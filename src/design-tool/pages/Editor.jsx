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
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import MainToolbar from '../components/MainToolbar';
import ContextualSidebar from '../components/ContextualSidebar';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PreviewModal } from '@/components/PreviewModal';

import {
    FiTrash2, FiRotateCcw, FiRotateCw, FiCheckCircle, FiSettings, FiX
} from 'react-icons/fi';

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
    const productId = searchParams.get('product');
    const selectedColor = searchParams.get('color');
    const selectedSize = searchParams.get('size');

    // Default "Blank Canvas" Configuration
    const [productData, setProductData] = useState({
        title: "Custom Project",
        category: "Apparel", // Default category
        print_areas: { 
            front: { width: 3000, height: 4000 } // Default A3-ish ratio
        }
    });
    
    // The visual base image (2D vector or Photo)
    // You can replace this URL with your local 'assets/mockups/generic-tee.png'
    const [baseImage, setBaseImage] = useState("https://placehold.co/800x800/e2e8f0/94a3b8?text=Blank+Tee"); 
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
    
    // Redux Selectors
    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);
    
    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');

    // 1. LOAD PRODUCT CONTEXT (or set Blank Canvas)
    useEffect(() => {
        async function loadContext() {
            // Case A: User came from Store (Has Product ID)
            if (productId) {
                try {
                    const docRef = doc(db, "base_products", productId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        setProductData({
                            title: data.title,
                            category: data.category || "Apparel",
                            print_areas: data.print_areas || { front: { width: 3000, height: 4000 } }
                        });

                        // Prefer a specific 2D vector if you added it to DB, else use main image
                        setBaseImage(data.vector_mockup || data.image);
                    }
                } catch (err) {
                    console.error("Error loading product:", err);
                }
            } 
            // Case B: Blank Canvas (No ID) - Defaults already set in state
            else {
                console.log("🎨 Loading Blank Canvas Mode");
            }
        }
        loadContext();
    }, [productId]);

    // 2. LOAD EXISTING DESIGN (If editing a saved project)
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

    // Close property panel when selection clears
    useEffect(() => {
        setShowProperties(!!selectedId);
    }, [selectedId]);

    const handleToolClick = (tool) => {
        setActivePanel(prev => prev === tool ? null : tool);
    };

    // 3. GENERATE PREVIEW IMAGE
    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;

        // Deselect everything for a clean snapshot
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();

        // Export high-quality transparent PNG
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
        // TODO: Save to Firestore 'cart' collection
        console.log("Adding to cart:", { 
            product: productData.title,
            color: selectedColor, 
            size: selectedSize, 
            design: designPreview 
        });
        
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            navigation('/dashboard/orders');
        }, 1500);
    };

    // --- CATEGORY & LAYOUT HELPERS ---
    const isApparel = productData.category === "Apparel";
    const isMug = productData.category === "Home & Living";

    // Branding Component
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

                {/* --- MAIN PREVIEW AREA (The "Desk") --- */}
                <main className="preview-area relative bg-slate-50 overflow-hidden">
                    
                    {/* View Switcher (Front/Back) - Only if multiple views exist */}
                    {productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
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

                    {/* Top Toolbar (Undo/Redo/Save) */}
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
                            
                            <button 
                                onClick={handleGeneratePreview}
                                className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-gray-800 transition-all flex items-center gap-2"
                            >
                                <FiCheckCircle size={18} />
                                <span>Finish</span>
                            </button>
                        </div>
                    </div>

                    {/* --- LAYERED MOCKUP SYSTEM --- */}
                    <div className="main-mockup-container relative flex justify-center items-center h-full w-full">
                        
                        {/* LAYER 1: Base Mockup (Cartoon Vector or Photo) */}
                        <img 
                            src={baseImage} 
                            className="product-base-image pointer-events-none select-none"
                            alt="Product Base"
                            style={{ 
                                maxHeight: '85%', 
                                maxWidth: '85%', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' // Adds depth
                            }} 
                        />

                        {/* LAYER 2: The Design Canvas (Positioned dynamically) */}
                        <div 
                            className={`design-placement-box ${isMug ? 'mug-frame' : 'shirt-frame'}`}
                            style={{
                                position: 'absolute',
                                zIndex: 10,
                                border: '1px dashed rgba(99, 102, 241, 0.4)', // Helper guide
                                // Dynamic Sizing from DB
                                aspectRatio: `${productData.print_areas[currentView]?.width || 3000} / ${productData.print_areas[currentView]?.height || 4000}`,
                                // Positioning Logic
                                width: isMug ? '400px' : '280px',
                                top: isApparel ? '24%' : '35%',
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

                        {/* LAYER 3: Texture Overlay (For Realism) */}
                        <div 
                            className="product-shadow-overlay absolute inset-0 pointer-events-none"
                            style={{ 
                                backgroundImage: `url(${baseImage})`,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                mixBlendMode: 'multiply',
                                opacity: 0.15,
                                zIndex: 11
                            }}
                        />
                    </div>
                </main>

                <aside className={`right-panel ${showProperties ? 'active' : ''}`}>
                    <div className="mobile-panel-header">
                        <span className="mobile-panel-title">Edit Properties</span>
                        <button onClick={() => setShowProperties(false)} className="mobile-close-btn">
                            <FiX size={20} />
                        </button>
                    </div>

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

                {/* --- PREVIEW MODAL --- */}
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