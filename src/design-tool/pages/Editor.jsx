// src/design-tool/pages/Editor.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Editor.css';
import * as fabric from 'fabric';
import CanvasEditor from '../components/CanvasEditor';
import Text from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import RightSidebarTabs from '../components/RightSidebarTabs';
import { undo, redo, setCanvasObjects, setHistory } from '../redux/canvasSlice';
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
import { FiTrash2, FiRotateCcw, FiRotateCw, FiSettings, FiX } from 'react-icons/fi';

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const userId = user?.uid;

    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showProperties, setShowProperties] = useState(false);

    // Redux State
    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);

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
    
    // Track Refs for Cleanup/Backup
    const currentViewRef = useRef(currentView);
    const viewStatesRef = useRef(viewStates);

    useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
    useEffect(() => { viewStatesRef.current = viewStates; }, [viewStates]);

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

    // ✅ NAVIGATE & FREEZE: Save Session Before Leaving
    const navigateToTemplates = () => {
        // 1. Capture Current State Synchronously
        const currentObjects = store.getState().canvas.present;
        const currentViewSnapshot = currentViewRef.current;
        const allViewsSnapshot = viewStatesRef.current;

        // 2. Build Backup Payload
        const backupData = {
            view: currentViewSnapshot,
            viewStates: {
                ...allViewsSnapshot,
                [currentViewSnapshot]: currentObjects // Ensure latest objects are saved
            },
            timestamp: Date.now()
        };

        // 3. Save to Storage
        sessionStorage.setItem('merge_context', JSON.stringify(backupData));

        // 4. Navigate
        navigation('/dashboard/templates', { 
            state: { 
                filterMode: 'product',
                filterProductId: productData.productId,
                filterColor: canvasBg,
                filterSize: urlSize
            }
        });
    }

    // ✅ 1. FETCH PRODUCT DATA
    useEffect(() => {
        async function initProduct() {
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
                    
                    const savedColor = currentDesign?.productConfig?.variantColor;
                    const initialColor = savedColor || urlColor || (data.options?.colors?.[0] || "White");
                    setCanvasBg(COLOR_MAP[initialColor] || "#FFFFFF");
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        initProduct();
    }, [urlProductId, currentDesign]);


    // ✅ 2. UNIFIED LOAD & MERGE LOGIC (Fixed for Back View Preservation)
    useEffect(() => {
        if (!userId) return;

        const mergeId = location.state?.mergeDesignId;
        const isMerge = !!mergeId;

        // --- SCENARIO A: MERGING ---
        if (isMerge) {
            async function performMerge() {
                // 1. THAW: Restore Context from Storage
                const contextJSON = sessionStorage.getItem('merge_context');
                
                // Defaults if restore fails
                let targetView = 'front';
                let currentViewObjects = [];
                let fullHistory = {};

                if (contextJSON) {
                    try {
                        const context = JSON.parse(contextJSON);
                        // Check freshness (e.g. < 1 hour)
                        if (Date.now() - context.timestamp < 3600000) {
                            targetView = context.view;
                            fullHistory = context.viewStates || {};
                            // Get objects for the restored view
                            currentViewObjects = fullHistory[targetView] || [];
                        }
                    } catch (e) { console.error("Restore failed", e); }
                    
                    // Clean up storage so we don't restore old data later
                    sessionStorage.removeItem('merge_context');
                }

                // 2. FETCH: Get New Design to Merge
                let incomingObjects = [];
                try {
                    const designRef = doc(db, `users/${userId}/designs`, mergeId);
                    const designSnap = await getDoc(designRef);
                    if (designSnap.exists()) {
                        const design = designSnap.data();
                        const raw = Array.isArray(design.canvasData) ? design.canvasData : (design.canvasData?.front || []);
                        
                        if (raw.length > 0) {
                            incomingObjects = raw.map(obj => ({
                                ...obj, 
                                id: uuidv4(), 
                                customId: uuidv4(),
                                props: { ...obj.props, left: (obj.props.left||0)+30, top: (obj.props.top||0)+30 }
                            }));
                        }
                    }
                } catch (e) { console.error(e); }

                // 3. COMBINE (InMemory)
                const finalObjectsForView = [...currentViewObjects, ...incomingObjects];
                
                // Update the history with the merged result
                const finalHistory = {
                    ...fullHistory,
                    [targetView]: finalObjectsForView
                };

                // 4. APPLY ATOMICALLY
                console.log(`Merging on ${targetView}: ${currentViewObjects.length} existing + ${incomingObjects.length} new`);
                
                setCurrentView(targetView); // Force correct view
                setViewStates(finalHistory); // Restore full history (Front, etc.)
                dispatch(setCanvasObjects(finalObjectsForView)); // Render current view

                // 5. Cleanup
                window.history.replaceState({}, document.title);
            }
            performMerge();
        }

        // --- SCENARIO B: LOADING (Full Replace) ---
        else if (urlDesignId && editingDesignId !== urlDesignId) {
            async function loadDesign() {
                try {
                    const designRef = doc(db, `users/${userId}/designs`, urlDesignId);
                    const designSnap = await getDoc(designRef);
                    
                    if (designSnap.exists()) {
                        const design = designSnap.data();
                        setCurrentDesign(design);
                        setEditingDesignId(design.id);

                        if (design.type === 'PRODUCT' && design.productConfig) {
                            const savedStates = design.canvasData || {};
                            setViewStates(savedStates);
                            
                            const activeView = design.productConfig.activeView || 'front';
                            setCurrentView(activeView);

                            const activeObjects = savedStates[activeView] || [];
                            dispatch(setCanvasObjects(activeObjects));
                        } else {
                            const objects = design.canvasData || [];
                            dispatch(setCanvasObjects(objects));
                        }
                    }
                } catch (e) { console.error("Error loading design", e); }
            }
            loadDesign();
        }

    }, [urlDesignId, location.state, userId, dispatch]);


    // ✅ 3. URL SYNC
    useEffect(() => {
        if (currentDesign?.productConfig) {
            const params = new URLSearchParams(searchParams);
            const { productId, variantColor, variantSize } = currentDesign.productConfig;
            
            let changed = false;
            if (productId && params.get('product') !== productId) { params.set('product', productId); changed = true; }
            if (variantColor && params.get('color') !== variantColor) { params.set('color', variantColor); changed = true; }
            if (variantSize && params.get('size') !== variantSize) { params.set('size', variantSize); changed = true; }
            
            if (changed) setSearchParams(params, { replace: true });
        }
    }, [currentDesign, setSearchParams]);

    // ... (Keep existing Scale, Dims, Snapshot Logic) ...
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
    
    const captureCurrentCanvas = () => {
         const url = getCleanDataURL();
         if(!url) return null;
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

        const currentSnapshot = captureCurrentCanvas();
        if(currentSnapshot) setDesignTextures(prev => ({ ...prev, [currentView]: currentSnapshot }));

        const currentCanvasState = store.getState().canvas.present;
        setViewStates(prev => ({ ...prev, [currentView]: currentCanvasState }));

        setCurrentView(newView);

        const nextObjects = viewStates[newView] || [];
        dispatch(setCanvasObjects(nextObjects));
        dispatch(setHistory({ past: [], present: nextObjects, future: [] }));
    };
    
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
                    onSelectTool={(tool) => {
                        // ✅ Use the new freeze-and-navigate logic
                        if (tool === 'templates') {
                            navigateToTemplates();
                        } else {
                            setActivePanel(prev => prev === tool ? null : tool);
                        }
                    }}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool}
                    navigation={navigation}
                    brandDisplay={BrandDisplay}
                    fabricCanvas={fabricCanvas}
                    productId={urlProductId || currentDesign?.productConfig?.productId}
                    urlColor={urlColor || currentDesign?.productConfig?.variantColor}
                    urlSize={urlSize || currentDesign?.productConfig?.variantSize}
                />
                
                {activePanel && <ContextualSidebar activePanel={activePanel} setActivePanel={setActivePanel} addText={addText} addHeading={addHeading} addSubheading={addSubheading} />}

                <main className="preview-area relative bg-slate-100 flex items-center justify-center overflow-hidden" ref={containerRef}>
                    
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
                                    canvas={store.getState().canvas}
                                    userId={userId}
                                    editingDesignId={editingDesignId}
                                    className="top-bar-button"
                                    currentView={currentView}
                                    viewStates={viewStates}
                                    productData={{
                                        productId: urlProductId || currentDesign?.productConfig?.productId,
                                        color: urlColor || currentDesign?.productConfig?.variantColor,
                                        size: urlSize || currentDesign?.productConfig?.variantSize,
                                        print_areas: productData.print_areas
                                    }}
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
                        canvasObjects={canvasObjects}
                        selectedId={selectedId}
                        setActiveTool={setActiveTool}
                        setSelectedId={setSelectedId}
                        fabricCanvas={fabricCanvas}
                        printDimensions={canvasDims}
                        productId={productData.productId}
                        activeView={currentView}
                    />
                </main>

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
                            {productData.id && productData.options?.colors?.length > 0 ? (
                                <>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Product Colors</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {productData.options.colors.map((color) => {
                                            const hex = COLOR_MAP[color] || "#ccc";
                                            const isActive = canvasBg.toLowerCase() === hex.toLowerCase();
                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorChange(color)}
                                                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-all relative group ${isActive ? "border-indigo-600 scale-110" : "border-slate-200 hover:border-slate-300"}`}
                                                    style={{ backgroundColor: hex }}
                                                    title={color}
                                                >
                                                    {isActive && <span className="absolute inset-0 flex items-center justify-center text-white/90"><FiCheckCircle size={16} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} /></span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">Visualize your design on different fabric colors.</p>
                                </>
                            ) : (
                                <div className="text-center text-slate-400 py-10">Select an element to edit properties.</div>
                            )}
                        </div>
                    )}
                </aside>

                <ThreeDPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} textures={designTextures} onAddToCart={handleAddToCart} isSaving={isSaving} productId={urlProductId || currentDesign?.productConfig?.productId} productData={productData} productCategory={productData.category} selectedColor={canvasBg} />
            </div>
        </div>
    );
}