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
import { PreviewModal } from '@/components/PreviewModal'; // Ensure you created this file!

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

    // --- NEW: PRODUCT & PREVIEW STATE ---
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product');
    const selectedColor = searchParams.get('color');
    const selectedSize = searchParams.get('size');

    const [baseImage, setBaseImage] = useState(null);
    const [productTitle, setProductTitle] = useState("Custom Design");
    
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

    // 1. FETCH PRODUCT DETAILS (If URL has ?product=...)
    useEffect(() => {
        async function loadBaseProduct() {
            if (!productId) return;
            try {
                const docRef = doc(db, "base_products", productId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBaseImage(data.image); // Use the specific image we seeded
                    setProductTitle(data.title);
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        loadBaseProduct();
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

    // Close properties on selection change
    useEffect(() => {
        setShowProperties(false);
    }, [selectedId]);

    const handleToolClick = (tool) => {
        setActivePanel(prev => prev === tool ? null : tool);
    };

    // --- NEW: GENERATE PREVIEW (Mockup Logic) ---
    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;

        // 1. Deselect objects so borders don't show
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();

        // 2. Export ONLY the design (transparent PNG)
        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2 // High res
        });

        setDesignPreview(dataUrl);
        setIsPreviewOpen(true);
    };

    const handleAddToCart = async () => {
        setIsSaving(true);
        // TODO: Implement actual Firestore "Add to Cart" here
        console.log("Adding to cart:", {
             productId, color: selectedColor, size: selectedSize, design: designPreview 
        });
        
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            alert("Added to Cart! (Logic to be connected)"); 
            navigation('/dashboard/orders'); // Redirect to orders or cart
        }, 1500);
    };

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

                <main className="preview-area relative">
                    {/* Top Bar */}
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
                            
                            {/* FINISH BUTTON */}
                            <button 
                                onClick={handleGeneratePreview}
                                className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-gray-800 transition-all flex items-center gap-2"
                            >
                                <FiCheckCircle size={18} />
                                <span>Finish</span>
                            </button>
                        </div>
                    </div>

                    {/* --- THE CANVAS AREA (With Shirt Background) --- */}
                    <div 
                        className="canvas-wrapper flex justify-center items-center h-full w-full"
                        style={{
                            // If baseImage exists, set it as background for the whole wrapper
                            // NOTE: You might need to adjust CSS to ensure CanvasEditor is centered properly over the shirt
                            backgroundImage: baseImage ? `url(${baseImage})` : 'none',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    >
                         {/* Pass fabricCanvas setter to child */}
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

                {/* --- MOCKUP PREVIEW MODAL --- */}
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
// https://github.com/TRYAM193/DesignPage.git
// powershell -ExecutionPolicy Bypass -File autosync.ps1