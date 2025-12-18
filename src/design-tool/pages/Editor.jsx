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
    FiTrash2, FiRotateCcw, FiRotateCw, FiDownload, FiShoppingBag,
    FiSettings, FiX, FiCheckCircle
} from 'react-icons/fi';

export default function EditorPanel() {
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showProperties, setShowProperties] = useState(false);

    // --- PRODUCT & VIEW STATE ---
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product');
    const selectedColor = searchParams.get('color');
    const selectedSize = searchParams.get('size');

    const [product, setProduct] = useState(null);
   const [baseMockup, setBaseMockup] = useState("/assets/mockups/generic-tee-vector.png");
    const [productData, setProductData] = useState({
        title: "New Design",
        category: "Apparel",
        print_areas: { front: { width: 3000, height: 4000 } }
    });
    const [currentView, setCurrentView] = useState("front"); // 'front', 'back', etc.
    
    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [designPreview, setDesignPreview] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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

    // 1. FETCH FULL PRODUCT DATA
    useEffect(() => {
        async function loadProduct() {
            if (!productId) return;
            try {
                const docRef = doc(db, "base_products", productId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProduct(data);
                    setBaseImage(data.image); 
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        loadProduct();
    }, [productId]);

    // 2. LOAD EXISTING DESIGN
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
        setShowProperties(false);
    }, [selectedId]);

    const handleToolClick = (tool) => {
        setActivePanel(prev => prev === tool ? null : tool);
    };

    // 3. MOCKUP PREVIEW GENERATION
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
        console.log("Adding to cart:", { productId, color: selectedColor, size: selectedSize });
        
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            navigation('/dashboard/orders');
        }, 1500);
    };

    // Categorization logic
    const isApparel = product?.category === "Apparel";
    const isMug = product?.category === "Home & Living";

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

                <main className="preview-area relative overflow-hidden bg-slate-50">
                    {/* Multi-Side Switcher (Floating) */}
                    {isApparel && product?.print_areas && Object.keys(product.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/90 p-1.5 rounded-full border shadow-lg backdrop-blur-sm">
                            {Object.keys(product.print_areas).map(view => (
                                <button 
                                    key={view}
                                    onClick={() => setCurrentView(view)}
                                    className={`px-5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                                        currentView === view ? "bg-indigo-600 text-white shadow-md scale-105" : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Toolbar Controls */}
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

                    {/* --- THE LAYERED MOCKUP SYSTEM --- */}
                    <div className="main-mockup-container">
                        {/* 1. BOTTOM LAYER: The Product Base */}
                        <img 
                            src={baseImage} 
                            className="product-base-image" 
                            alt="Mockup" 
                        />

                        {/* 2. MIDDLE LAYER: The Fabric Canvas Box */}
                        <div 
                            className={`design-placement-box ${isMug ? 'mug-frame' : 'shirt-frame'}`}
                            style={{
                                // Use the exact print area from Printify for aspect ratio
                                aspectRatio: `${product?.print_areas?.[currentView]?.width || 3000} / ${product?.print_areas?.[currentView]?.height || 4000}`,
                                // Adjust position based on category
                                width: isMug ? '400px' : '280px',
                                marginTop: isApparel ? '-40px' : '20px'
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

                        {/* 3. TOP LAYER: Shadow Mask (The Realism Secret) */}
                        <div 
                            className="product-shadow-overlay" 
                            style={{ backgroundImage: `url(${baseImage})` }} 
                        />
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
                    baseImage={baseImage || "https://placehold.co/600x600?text=No+Product"}
                    overlayImage={designPreview}
                    onAddToCart={handleAddToCart}
                    isSaving={isSaving}
                />
            </div>
        </div>
    );
}