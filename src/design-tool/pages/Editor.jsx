import React, { useState, useEffect } from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import Text from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import RightSidebarTabs from '../components/RightSidebarTabs';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'; // Fixed import
import { useAuth } from '@/hooks/use-auth';
import MainToolbar from '../components/MainToolbar';
import ContextualSidebar from '../components/ContextualSidebar';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PreviewModal } from '@/components/PreviewModal';

import {
    FiTrash2, FiRotateCcw, FiRotateCw, FiCheckCircle, FiSettings, FiX
} from 'react-icons/fi';

// --- CONFIGURATION: 2D VECTOR ASSETS ---
// Replace these URLs with your actual local assets (e.g., "/assets/vectors/tshirt.png")
const VECTOR_ASSETS = {
    default: "https://placehold.co/800x800/f1f5f9/cbd5e1?text=Generic+T-Shirt+(Vector)",
    "mens_cotton_tee": "https://placehold.co/800x800/fff/000?text=T-Shirt+Vector",
    "unisex_hoodie": "https://placehold.co/800x800/fff/000?text=Hoodie+Vector",
    "oversized_tee": "https://placehold.co/800x800/fff/000?text=Oversized+Tee+Vector",
    "womens_crop_top": "https://placehold.co/800x800/fff/000?text=Crop+Top+Vector",
    "ceramic_mug": "https://placehold.co/800x600/fff/000?text=Mug+Wrap+Vector",
};

export default function EditorPanel() {
    // --- CANVAS & TOOL STATE ---
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showProperties, setShowProperties] = useState(false);

    // --- PRODUCT & MOCKUP STATE ---
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product'); // Might be null (Blank Canvas Mode)
    const selectedColor = searchParams.get('color');
    const selectedSize = searchParams.get('size');

    // Default "Blank Canvas" Configuration
    const [productData, setProductData] = useState({
        id: "generic",
        title: "Future Order Design",
        category: "Apparel", 
        print_areas: { 
            front: { width: 3000, height: 4000 } // Default printable area
        }
    });
    
    // Default to the Generic Vector
    const [baseImage, setBaseImage] = useState(VECTOR_ASSETS.default); 
    const [currentView, setCurrentView] = useState("front");

    // --- PREVIEW / CART STATE ---
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [designPreview, setDesignPreview] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // --- HOOKS ---
    const { user } = useAuth();
    const userId = user?.uid; 
    const navigation = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    
    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);
    
    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');

    // 1. LOAD CONTEXT (Product or Blank)
    useEffect(() => {
        async function loadContext() {
            // Case A: User selected a specific product
            if (productId) {
                try {
                    const docRef = doc(db, "base_products", productId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        setProductData({
                            id: data.id,
                            title: data.title,
                            category: data.category || "Apparel",
                            print_areas: data.print_areas || { front: { width: 3000, height: 4000 } }
                        });

                        // ✅ FORCE VECTOR: Look up the 2D image based on ID, fallback to default
                        // This prevents loading the realistic photo
                        const vectorUrl = VECTOR_ASSETS[data.id] || VECTOR_ASSETS.default;
                        setBaseImage(vectorUrl);
                    }
                } catch (err) {
                    console.error("Error loading product:", err);
                }
            } 
            // Case B: Blank Canvas (No ID)
            else {
                console.log("🎨 Mode: Blank Canvas (Future Order)");
                setBaseImage(VECTOR_ASSETS.default);
                // Keep default productData state
            }
        }
        loadContext();
    }, [productId]);

    // 2. LOAD EXISTING DESIGN (If passed from Dashboard)
    useEffect(() => {
        if (location.state?.designToLoad && fabricCanvas) {
            const { designToLoad } = location.state;
            setEditingDesignId(designToLoad.id);
            setCurrentDesign(designToLoad);

            if (designToLoad.canvasData) {
                const jsonContent = typeof designToLoad.canvasData === 'string' 
                    ? designToLoad.canvasData 
                    : JSON.stringify(designToLoad.canvasData);

                fabricCanvas.loadFromJSON(jsonContent, () => {
                    fabricCanvas.renderAll();
                });
            }
        }
    }, [location.state, fabricCanvas]);

    useEffect(() => {
        setShowProperties(!!selectedId);
    }, [selectedId]);

    const handleToolClick = (tool) => {
        setActivePanel(prev => prev === tool ? null : tool);
    };

    // 3. GENERATE PREVIEW
    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();

        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2 
        });

        setDesignPreview(dataUrl);
        setIsPreviewOpen(true);
    };

    const handleAddToCart = async () => {
        setIsSaving(true);
        console.log("Saving Design:", { 
            isDraft: !productId, // Use this flag to save as 'Template' vs 'Order'
            product: productData.title,
            design: designPreview 
        });
        
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            // If it was a blank canvas, maybe go to templates?
            navigation(productId ? '/dashboard/orders' : '/dashboard/templates');
        }, 1500);
    };

    const isApparel = productData.category === "Apparel";
    const isMug = productData.category === "Home & Living";

    const BrandDisplay = (
        <div className="header-brand toolbar-brand" onClick={() => navigation('/dashboard')} style={{cursor: 'pointer'}}>
            <div className="logo-circle">
                <img src="/assets/LOGO.png" alt="TRYAM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1>TRYAM</h1>
        </div>
    );

    return (
        <div className="main-app-container">
            <div className="main full-height-main">

                <MainToolbar
                    activePanel={activePanel}
                    onSelectTool={handleToolClick}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool}
                    navigation={navigation}
                    brandDisplay={BrandDisplay}
                    fabricCanvas={fabricCanvas}
                />

                {activePanel && (
                    <ContextualSidebar
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        addText={addText}
                        addHeading={addHeading}
                        addSubheading={addSubheading}
                    />
                )}

                {/* --- MAIN WORKSPACE --- */}
                <main className="preview-area relative bg-slate-50 overflow-hidden flex items-center justify-center">
                    
                    {/* View Switcher (Only if Product has defined views) */}
                    {isApparel && productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/90 p-1.5 rounded-full border shadow-lg backdrop-blur-sm">
                            {Object.keys(productData.print_areas).map(view => (
                                <button 
                                    key={view}
                                    onClick={() => setCurrentView(view)}
                                    className={`px-5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                                        currentView === view 
                                            ? "bg-black text-white shadow-md scale-105" 
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="top-bar consolidated-bar">
                        <div className="control-group">
                            <button className="top-bar-button" onClick={() => dispatch(undo())} disabled={past.length === 0} style={{ opacity: past.length === 0 ? 0.25 : 1 }}>
                                <FiRotateCcw size={18} />
                            </button>
                            <button className="top-bar-button" onClick={() => dispatch(redo())} disabled={future.length === 0} style={{ opacity: future.length === 0 ? 0.25 : 1 }}>
                                <FiRotateCw size={18} />
                            </button>
                        </div>

                        <div className="control-group divider">
                            <button className="top-bar-button danger" onClick={() => removeObject(selectedId)} style={{ opacity: !selectedId ? 0.25 : 1 }}>
                                <FiTrash2 size={18} />
                            </button>
                        </div>

                        {selectedId && !showProperties && (
                            <div className="control-group phone-only">
                                <button className="top-bar-button accent" onClick={() => setShowProperties(true)}>
                                    <FiSettings size={18} /> <span>Edit</span>
                                </button>
                            </div>
                        )}

                        <div className="control-group">
                            {fabricCanvas && (
                                <SaveDesignButton
                                    canvas={fabricCanvas}
                                    userId={userId} 
                                    currentDesign={currentDesign}
                                    editingDesignId={editingDesignId}
                                    className="top-bar-button"
                                />
                            )}
                            <button onClick={handleGeneratePreview} className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-gray-800 transition-all flex items-center gap-2">
                                <FiCheckCircle size={18} />
                                <span>Finish</span>
                            </button>
                        </div>
                    </div>

                    {/* --- 2D CARTOON MOCKUP CONTAINER --- */}
                    <div className="relative flex justify-center items-center h-full w-full">
                        
                        {/* LAYER 1: The 2D Cartoon/Vector Base */}
                        <img 
                            src={baseImage} 
                            className="pointer-events-none select-none drop-shadow-xl"
                            alt="2D Mockup"
                            style={{ 
                                maxHeight: '80%', 
                                maxWidth: '80%', 
                                objectFit: 'contain'
                            }} 
                        />

                        {/* LAYER 2: The Design Canvas Box */}
                        <div 
                            className={`design-placement-box ${isMug ? 'mug-frame' : 'shirt-frame'}`}
                            style={{
                                position: 'absolute',
                                zIndex: 10,
                                border: '1px dashed rgba(99, 102, 241, 0.5)',
                                backgroundColor: 'rgba(255,255,255,0.05)', // Slight highlight to show printable area
                                
                                // Dynamic Sizing from DB or Default
                                aspectRatio: `${productData.print_areas?.[currentView]?.width || 3000} / ${productData.print_areas?.[currentView]?.height || 4000}`,
                                
                                // Category-Specific Positioning (Adjust these pixel values to match your Vectors)
                                width: isMug ? '400px' : '260px',
                                top: isApparel ? '28%' : '35%',
                                borderRadius: isMug ? '4px' : '0px'
                            }}
                        >
                            <CanvasEditor
                                setFabricCanvas={setFabricCanvas}
                                canvasObjects={canvasObjects}
                                selectedId={selectedId}
                                setActiveTool={setActiveTool}
                                setSelectedId={setSelectedId}
                                fabricCanvas={fabricCanvas}
                                setCurrentDesign={setCurrentDesign}
                                setEditingDesignId={setEditingDesignId}
                                past={past}
                            />
                        </div>
                    </div>
                </main>

                <aside className={`right-panel ${showProperties ? 'active' : ''}`}>
                    <RightSidebarTabs
                        id={selectedId}
                        type={activeTool}
                        object={canvasObjects.find((obj) => obj.id === selectedId)}
                        updateObject={updateObject}
                        removeObject={removeObject}
                        addText={addText}
                        fabricCanvas={fabricCanvas}
                        setSelectedId={setSelectedId}
                    />
                </aside>

                <PreviewModal 
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    baseImage={baseImage}
                    overlayImage={designPreview}
                    onAddToCart={handleAddToCart}
                    isSaving={isSaving}
                />

            </div>
        </div>
    );
}