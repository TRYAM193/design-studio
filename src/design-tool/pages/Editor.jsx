import React, { useState, useEffect, useRef } from 'react';
import '../styles/Editor.css';
import * as fabric from 'fabric';
import CanvasEditor from '../components/CanvasEditor';
import Text from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton'; // Ensure this uses new logic
import RightSidebarTabs from '../components/RightSidebarTabs';
import { undo, redo, setCanvasObjects, setHistory } from '../redux/canvasSlice'; // Added setCanvasObjects
import { store } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import MainToolbar from '../components/MainToolbar';
import ContextualSidebar from '../components/ContextualSidebar';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ThreeDPreviewModal } from '../components/ThreeDPreviewModal';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FiTrash2, FiRotateCcw, FiRotateCw, FiSettings, FiX, FiCheckCircle } from 'react-icons/fi';

const COLOR_MAP = {
    "White": "#FFFFFF", "Natural": "#F3E5AB", "Soft Cream": "#F5F5DC", "Sand": "#C2B280", "Silver": "#C0C0C0",
    "Black": "#000000", "Solid Black Blend": "#1a1a1a", "Black Heather": "#2D2D2D", "Charcoal": "#36454F",
    "Dark Grey": "#4A4A4A", "Asphalt": "#505050", "Dark Heather": "#4B5563", "Dark Grey Heather": "#525252",
    "Graphite Heather": "#374151", "Deep Heather": "#606060", "Sport Grey": "#9CA3AF", "Athletic Heather": "#9E9E9E",
    "Ash": "#D1D5DB", "Navy": "#000080", "Heather Navy": "#34495E", "Royal": "#2563EB", "True Royal": "#1C39BB",
    "Heather True Royal": "#4169E1", "Steel Blue": "#4682B4", "Carolina Blue": "#7BAFD4", "Heather Columbia Blue": "#7897BB",
    "Light Blue": "#ADD8E6", "Baby Blue": "#89CFF0", "Heather Ice Blue": "#A4D3EE", "Turquoise": "#40E0D0",
    "Aqua": "#00FFFF", "Heather Aqua": "#66CDAA", "Red": "#EF4444", "Heather Red": "#CD5C5C", "Cardinal": "#C41E3A",
    "Maroon": "#800000", "Heliconia": "#DB2763", "Berry": "#C32148", "Pink": "#FFC0CB", "Light Pink": "#FFB6C1",
    "Soft Pink": "#FDE9EA", "Charity Pink": "#FF69B4", "Heather Mauve": "#C18995", "Purple": "#6A0DAD",
    "Team Purple": "#4B0082", "Heather Team Purple": "#663399", "Forest Green": "#228B22", "Forest": "#0B6623",
    "Military Green": "#4B5320", "Army": "#454B1B", "Olive": "#808000", "Heather Olive": "#556B2F",
    "Irish Green": "#009E60", "Kelly": "#4CBB17", "Heather Kelly": "#3CB371", "Heather Green": "#608060",
    "Leaf": "#76904A", "Heather Mint": "#98FF98", "Gold": "#FFD700", "Yellow": "#FFFF00", "Orange": "#FFA500",
    "Autumn": "#D2691E", "Brown": "#8B4513", "Heather Clay": "#B66A50", "Heather Peach": "#FFCBA4"
};

export default function EditorPanel() {
    const dispatch = useDispatch();
    const navigation = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams(); // Use setter to update URL
    const { user } = useAuth();
    const userId = user?.uid;

    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showProperties, setShowProperties] = useState(false);

    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);

    // ✅ LOAD FROM URL PARAMS (These are our Single Source of Truth for New Designs)
    const urlProductId = searchParams.get('product');
    const urlColor = searchParams.get('color');
    const urlSize = searchParams.get('size');
    const urlDesignId = searchParams.get('designId');

    const [productData, setProductData] = useState({
        title: "Custom Design",
        category: "Apparel",
        print_areas: { front: { width: 4500, height: 5400 } },
        options: { colors: [] }
    });

    const [canvasBg, setCanvasBg] = useState("#FFFFFF");
    const [currentView, setCurrentView] = useState("front");
    const [viewStates, setViewStates] = useState({});
    
    // ... (keep designTextures, refs, etc. same as before) ...
    const [designTextures, setDesignTextures] = useState({
        front: { blob: null, url: null },
        back: { blob: null, url: null },
    });
    const containerRef = useRef(null);
    const [scaleFactor, setScaleFactor] = useState(0.2);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');
    const [canvasDims, setCanvasDims] = useState({ width: 4500, height: 5400 });

    // ✅ 1. FETCH PRODUCT DATA (Base)
    useEffect(() => {
        async function initProduct() {
            // Priority: Design Config > URL Param
            const pid = currentDesign?.productConfig?.productId || urlProductId;
            
            if (!pid) return;

            try {
                const docRef = doc(db, "base_products", pid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProductData({
                        ...data,
                        print_areas: data.print_areas || { front: { width: 4500, height: 5400 } },
                        options: data.options || { colors: [] }
                    });
                    
                    // Initialize Color: Saved Design > URL Param > Default
                    const savedColor = currentDesign?.productConfig?.variantColor;
                    const initialColor = savedColor || urlColor || (data.options?.colors?.[0] || "White");
                    setCanvasBg(COLOR_MAP[initialColor] || "#FFFFFF");
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        initProduct();
    }, [urlProductId, currentDesign]); // Re-run if design loads

    // ✅ 2. FETCH SAVED DESIGN (Redux Loader)
    useEffect(() => {
        if (!urlDesignId || !userId) return;
        
        // Prevent double loading
        if (editingDesignId === urlDesignId) return;

        async function loadDesign() {
            try {
                const designRef = doc(db, `users/${userId}/designs`, urlDesignId);
                const designSnap = await getDoc(designRef);
                
                if (designSnap.exists()) {
                    const design = designSnap.data();
                    setCurrentDesign(design);
                    setEditingDesignId(design.id);

                    // A. PRODUCT MODE
                    if (design.type === 'PRODUCT' && design.productConfig) {
                        // 1. Set View States (Hydrate Redux Arrays)
                        const savedStates = design.canvasData || {}; // Changed from canvasJSON
                        setViewStates(savedStates);

                        // 2. Set Current View
                        const activeView = design.productConfig.activeView || 'front';
                        setCurrentView(activeView);

                        // 3. Dispatch IMMEDIATE Redux Update
                        // This replaces "loadFromJSON" in CanvasEditor
                        const activeObjects = savedStates[activeView] || [];
                        dispatch(setCanvasObjects(activeObjects));
                    } 
                    // B. BLANK MODE
                    else {
                        const objects = design.canvasData || [];
                        dispatch(setCanvasObjects(objects));
                    }
                    console.log("Design Loaded via Redux:", design.id);
                }
            } catch (e) {
                console.error("Error loading design", e);
            }
        }
        loadDesign();
    }, [urlDesignId, userId, dispatch]);


    // ✅ 3. URL SYNC (Ensure URL always matches state for Save)
    useEffect(() => {
        if (currentDesign?.productConfig) {
            // If we loaded a design, ensure URL params match (so refresh works)
            const params = new URLSearchParams(searchParams);
            const { productId, variantColor, variantSize } = currentDesign.productConfig;
            
            if (productId && params.get('product') !== productId) params.set('product', productId);
            if (variantColor && params.get('color') !== variantColor) params.set('color', variantColor);
            if (variantSize && params.get('size') !== variantSize) params.set('size', variantSize);
            
            setSearchParams(params, { replace: true });
        }
    }, [currentDesign, setSearchParams]);


    // ... (Keep existing Canvas Dims & Scaling logic) ...
    useEffect(() => {
        if (productData.print_areas && productData.print_areas[currentView]) {
            const area = productData.print_areas[currentView];
            setCanvasDims({ width: area.width || 4500, height: area.height || 5400 });
        }
    }, [productData, currentView]);

    useEffect(() => {
        function calculateScale() {
            if (!containerRef.current) return;
            const realWidth = productData.print_areas?.[currentView]?.width || 4500;
            const realHeight = productData.print_areas?.[currentView]?.height || 5400;
            const availableWidth = containerRef.current.clientWidth;
            const availableHeight = containerRef.current.clientHeight;
            const widthRatio = (availableWidth * 0.85) / realWidth;
            const heightRatio = (availableHeight * 0.85) / realHeight;
            setScaleFactor(Math.min(widthRatio, heightRatio));
        }
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [productData, currentView]);


    // ... (Keep Snapshot Logic) ...
    const getCleanDataURL = () => {
        if (!fabricCanvas) return null;
        const originalBg = fabricCanvas.backgroundColor;
        const originalClip = fabricCanvas.clipPath;
        if (productData.title?.includes("Mug")) fabricCanvas.backgroundColor = "#FFFFFF";
        else fabricCanvas.backgroundColor = null;
        fabricCanvas.clipPath = null;
        const borderObj = fabricCanvas.getObjects().find(obj => obj.customId === 'print-area-border' || obj.id === 'print-area-border');
        let wasBorderVisible = false;
        if (borderObj) { wasBorderVisible = borderObj.visible; borderObj.visible = false; }
        
        fabricCanvas.renderAll();
        const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 0.5, enableRetinaScaling: false });
        
        fabricCanvas.backgroundColor = originalBg;
        fabricCanvas.clipPath = originalClip;
        if (borderObj) borderObj.visible = wasBorderVisible;
        fabricCanvas.renderAll();
        return dataUrl;
    };
    
    // Capture function for Preview/View Switch
    const captureCurrentCanvas = () => {
         const url = getCleanDataURL();
         if(!url) return null;
         
         // Convert to blob for 3D preview
         const arr = url.split(',');
         const mime = arr[0].match(/:(.*?);/)[1];
         const bstr = atob(arr[1]);
         let n = bstr.length;
         const u8arr = new Uint8Array(n);
         while (n--) { u8arr[n] = bstr.charCodeAt(n); }
         const blob = new Blob([u8arr], { type: mime });
         return { blob, url: URL.createObjectURL(blob) };
    }

    const handleSwitchView = async (newView) => {
        if (!fabricCanvas || newView === currentView) return;

        // 1. Save current view state
        const currentSnapshot = captureCurrentCanvas();
        if(currentSnapshot) setDesignTextures(prev => ({ ...prev, [currentView]: currentSnapshot }));

        const currentCanvasState = store.getState().canvas.present; // Save REDUX ARRAY
        setViewStates(prev => ({ ...prev, [currentView]: currentCanvasState }));

        // 2. Switch
        setCurrentView(newView);

        // 3. Load next view state
        const nextObjects = viewStates[newView] || [];
        dispatch(setCanvasObjects(nextObjects)); // This triggers CanvasEditor to draw
        dispatch(setHistory({ past: [], present: nextObjects, future: [] })); // Reset Undo/Redo for new view
    };
    
    // ... (Keep Color Change, Preview Generation, Add to Cart) ...
    const handleColorChange = (colorName) => {
        const hex = COLOR_MAP[colorName] || colorName;
        setCanvasBg(hex);
    };

    const handleGeneratePreview = () => {
         if (!fabricCanvas) return;
         setIsGeneratingPreview(true);
         setTimeout(() => {
            const currentSnapshot = captureCurrentCanvas();
            setDesignTextures(prev => ({ ...prev, [currentView]: currentSnapshot }));
            setIsPreviewOpen(true);
            setIsGeneratingPreview(false);
         }, 50);
    };

    const handleAddToCart = async () => {
        setIsSaving(true);
        setTimeout(() => { setIsSaving(false); setIsPreviewOpen(false); navigation('/dashboard/orders'); }, 1500);
    };

    const handleSaveSuccess = (savedId) => {
        if (savedId && savedId !== editingDesignId) {
            setEditingDesignId(savedId);
            setSearchParams(prev => {
                prev.set('designId', savedId);
                return prev;
            });
        }
    };

    const BrandDisplay = (
        <div className="header-brand toolbar-brand" onClick={() => navigation('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="logo-circle"><img src="/assets/LOGO.png" alt="TRYAM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            <h1>TRYAM</h1>
        </div>
    );

    return (
        <div className="main-app-container">
            <div className="main full-height-main">
                <MainToolbar
                    activePanel={activePanel}
                    onSelectTool={(tool) => setActivePanel(prev => prev === tool ? null : tool)}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool}
                    navigation={navigation}
                    brandDisplay={BrandDisplay}
                    fabricCanvas={fabricCanvas}
                    productId={urlProductId || currentDesign?.productConfig?.productId}
                    urlColor={urlColor || currentDesign?.productConfig?.variantColor}
                    urlSize={urlSize || currentDesign?.productConfig?.variantSize}
                />
                
                {/* ... Sidebar ... */}
                {activePanel && <ContextualSidebar activePanel={activePanel} setActivePanel={setActivePanel} addText={addText} addHeading={addHeading} addSubheading={addSubheading} />}

                <main className="preview-area relative bg-slate-100 flex items-center justify-center overflow-hidden" ref={containerRef}>
                    
                    {/* View Switcher */}
                    {productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/90 p-1.5 rounded-full border shadow-sm backdrop-blur-sm">
                            {Object.keys(productData.print_areas).map(view => (
                                <button key={view} onClick={() => handleSwitchView(view)} className={`px-4 py-1 rounded-full text-xs font-bold capitalize transition-all ${currentView === view ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                                    {view.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="top-bar consolidated-bar">
                        <div className="control-group">
                            <button className="top-bar-button" onClick={() => dispatch(undo())} disabled={past.length === 0}><FiRotateCcw size={18} /></button>
                            <button className="top-bar-button" onClick={() => dispatch(redo())} disabled={future.length === 0}><FiRotateCw size={18} /></button>
                        </div>
                        <div className="control-group divider">
                             <button className="top-bar-button danger" onClick={() => removeObject(selectedId)}><FiTrash2 size={18} /></button>
                        </div>
                        {selectedId && !showProperties && (
                             <button className="top-bar-button accent phone-only" onClick={() => setShowProperties(true)}><FiSettings size={18} /> Edit</button>
                        )}
                        <div className="control-group">
                            {fabricCanvas && (
                                <SaveDesignButton
                                    // 🚀 Updated Save Logic
                                    // We pass Redux State (canvasObjects) directly!
                                    canvas={store.getState().canvas} // This is actually handled inside saveDesign.js via props, but we pass current canvasObjects in props below
                                    userId={userId}
                                    editingDesignId={editingDesignId}
                                    className="top-bar-button"
                                    currentView={currentView}
                                    viewStates={viewStates}
                                    
                                    // 🚀 CRITICAL: Passing URL/Design Data explicitly
                                    productData={{
                                        productId: urlProductId || currentDesign?.productConfig?.productId,
                                        color: urlColor || currentDesign?.productConfig?.variantColor, // Using URL/State Data
                                        size: urlSize || currentDesign?.productConfig?.variantSize,   // Using URL/State Data
                                        print_areas: productData.print_areas
                                    }}
                                    
                                    // We pass the RAW REDUX ARRAY for the current view
                                    currentObjects={canvasObjects} 
                                    
                                    onGetSnapshot={getCleanDataURL}
                                    onSaveSuccess={handleSaveSuccess}
                                />
                            )}
                            <Button onClick={handleGeneratePreview} disabled={isGeneratingPreview || !fabricCanvas}>
                                {isGeneratingPreview ? <><Loader2 className="animate-spin" /> Generating...</> : "Preview"}
                            </Button>
                        </div>
                    </div>

                    <CanvasEditor
                        setFabricCanvas={setFabricCanvas}
                        canvasObjects={canvasObjects} // Redux Source of Truth
                        selectedId={selectedId}
                        setActiveTool={setActiveTool}
                        setSelectedId={setSelectedId}
                        fabricCanvas={fabricCanvas}
                        printDimensions={canvasDims}
                        productId={productData.productId}
                        activeView={currentView}
                        // Note: Removed old 'load' props, handled by Editor now
                    />
                </main>

                {/* ... Right Sidebar & Modals ... */}
                <aside className={`right-panel ${showProperties || !selectedId ? 'active' : ''}`}>
                    {selectedId ? (
                        <>
                            <div className="mobile-panel-header">
                                <span className="mobile-panel-title">Edit Properties</span>
                                <button onClick={() => setShowProperties(false)} className="mobile-close-btn"><FiX size={20} /></button>
                            </div>
                            <RightSidebarTabs id={selectedId} type={activeTool} object={canvasObjects.find((obj) => obj.id === selectedId)} updateObject={updateObject} removeObject={removeObject} addText={addText} fabricCanvas={fabricCanvas} setSelectedId={setSelectedId} />
                        </>
                    ) : (
                        <div className="p-5">
                             {productData.options?.colors?.length > 0 && (
                                 <div className="grid grid-cols-4 gap-3">
                                     {productData.options.colors.map(color => (
                                         <button key={color} onClick={() => handleColorChange(color)} className={`w-10 h-10 rounded-full border-2 ${canvasBg.toLowerCase() === (COLOR_MAP[color]||color).toLowerCase() ? "border-indigo-600" : ""}`} style={{ backgroundColor: COLOR_MAP[color] || color }} title={color}></button>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </aside>

                <ThreeDPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} textures={designTextures} onAddToCart={handleAddToCart} isSaving={isSaving} productId={urlProductId || currentDesign?.productConfig?.productId} productData={productData} productCategory={productData.category} selectedColor={canvasBg} />
            </div>
        </div>
    );
}