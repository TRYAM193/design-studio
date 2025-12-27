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


import {
    FiTrash2, FiRotateCcw, FiRotateCw, FiCheckCircle, FiSettings, FiX
} from 'react-icons/fi';

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
    const [searchParams] = useSearchParams();
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

    const productId = searchParams.get('product') || currentDesign?.productConfig?.productId;
    const urlColor = searchParams.get('color') || currentDesign?.productConfig?.variantColor;
    const urlSize = searchParams.get('size') || currentDesign?.productConfig?.variantSize;

    const [productData, setProductData] = useState({
        title: "Custom Design",
        category: "Apparel",
        print_areas: { front: { width: 4500, height: 5400 } },
        options: { colors: [] }
    });

    const [canvasBg, setCanvasBg] = useState("#FFFFFF");
    const [currentView, setCurrentView] = useState("front");

    const [viewStates, setViewStates] = useState({});

    const [designTextures, setDesignTextures] = useState({
        front: { blob: null, url: null },
        back: { blob: null, url: null },
        leftSleeve: { blob: null, url: null },
        rightSleeve: { blob: null, url: null }
    });


    const containerRef = useRef(null);
    const [scaleFactor, setScaleFactor] = useState(0.2);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');

    // ✅ Initialize dims directly from default or product data logic
    const [canvasDims, setCanvasDims] = useState({ width: 300, height: 400 });

    useEffect(() => {
        async function initEditor() {
            if (!productId) return;
            try {
                const docRef = doc(db, "base_products", productId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProductData({
                        ...data,
                        print_areas: data.print_areas || { front: { width: 4500, height: 5400 } },
                        options: data.options || { colors: [] }
                    });
                    const initialColor = urlColor || (data.options?.colors?.[0] || "White");
                    setCanvasBg(COLOR_MAP[initialColor] || "#FFFFFF");
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        initEditor();
    }, [productId]);

    // ✅ Effect: Sync canvasDims with Product DB Data when view or product changes
    useEffect(() => {
        if (productData.canvas_size) {
            const area = productData.canvas_size;
            // We use the DB dimensions directly now
            // Ensure you have valid defaults if DB is empty
            setCanvasDims({
                width: area.width || 300,
                height: area.height || 400
            });
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

    // ✅ FIX: Use reduce to ensure Unique IDs and prevent Redux duplicates
    // ✅ FIX: addObj now accepts a list to Sync specific objects only
    const addObj = (objectsFromJSON = null) => {
        // 1. Decide Source: Use passed list (clean JSON) or live Canvas
        const sourceObjects = objectsFromJSON || fabricCanvas.getObjects();

        const seenIds = new Set();

        const newObjs = sourceObjects.reduce((acc, obj, i) => {
            // A. Skip System Objects (Double check)
            if (obj.id === 'print-area-border') return acc;

            // B. Property Extraction 
            // (Works for both Fabric Instances and JSON Objects as properties are top-level)
            const commonProps = {
                left: obj.left, top: obj.top, angle: obj.angle, fill: obj.fill,
                opacity: obj.opacity, shadowBlur: obj.shadowBlur || 0,
                shadowOffsetX: obj.shadowOffsetX || 0, shadowOffsetY: obj.shadowOffsetY || 0,
                shadowColor: obj.shadowColor || '', stroke: obj.stroke,
                strokeWidth: obj.strokeWidth, scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
                lockMovementX: obj.lockMovementX, lockMovementY: obj.lockMovementY,
            };

            let specificProps = {};
            // Handle Type Differences (JSON 'rect' vs Instance 'rect')
            const type = obj.type;

            if (type === 'image') {
                specificProps = { width: obj.width, height: obj.height, cropX: obj.cropX, cropY: obj.cropY, src: obj.src };
            } else if (['text', 'textbox', 'i-text', 'circle-text'].includes(type) || obj.textEffect === 'circle') {
                specificProps = { text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily, charSpacing: obj.charSpacing, textAlign: obj.textAlign, textStyle: obj.textStyle, textEffect: obj.textEffect, effectValue: obj.effectValue };
            } else {
                specificProps = { width: obj.width, height: obj.height, radius: obj.radius, rx: obj.rx, ry: obj.ry };
            }

            // C. ID Conflict Check
            let finalId = obj.customId || obj.id;
            if (!finalId || seenIds.has(finalId)) {
                finalId = `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
                // If it's a live Fabric object, update it. 
                // If it's a JSON object, updating properties doesn't hurt.
                if (typeof obj.set === 'function') {
                    obj.set('customId', finalId);
                    obj.set('id', finalId);
                } else {
                    obj.customId = finalId;
                    obj.id = finalId;
                }
            }
            seenIds.add(finalId);

            acc.push({
                id: finalId,
                type: obj.textEffect === 'circle' ? 'circle-text' : type,
                ...(type === 'image' && { src: obj.src }),
                props: { ...commonProps, ...specificProps }
            });
            return acc;
        }, []);

        if (newObjs) {
            store.dispatch(setCanvasObjects(newObjs));
        }
    };


    // ✅ FIX: Merge with Strict Border Deduplication
   useEffect(() => {
        if (!location.state || !fabricCanvas) return;

        const handleLoad = async () => {
            // 1. Determine Input Data
            const payload = location.state.designToLoad || location.state.mergeDesign;
            const isMerge = !!location.state.mergeDesign;
            
            if (!payload) return;

            // 2. Parse JSON
            let parsedJSON = payload.canvasJSON;
            if (typeof parsedJSON === 'string') {
                try { parsedJSON = JSON.parse(parsedJSON); } catch(e) { console.error("JSON Error", e); return; }
            }

            // ---------------------------------------------------------
            // CASE A: PRODUCT DESIGN (Multi-View) -> REPLACE EVERYTHING
            // ---------------------------------------------------------
            if (payload.type === 'PRODUCT' && payload.productConfig && !isMerge) {
                console.log("Loading Product Design...");

                // 1. Setup Environment (Colors, Product Data)
                setProductData(prev => ({
                    ...prev,
                    productId: payload.productConfig.productId,
                    options: { ...prev.options, colors: [payload.productConfig.variantColor] }
                }));
                setCanvasBg(payload.productConfig.variantColor);
                
                // 2. Load View States (Front, Back, etc.)
                setViewStates(parsedJSON); 
                
                // 3. Load Active View
                const activeView = payload.productConfig.activeView || 'front';
                setCurrentView(activeView);

                const activeViewJSON = parsedJSON[activeView];
                if (activeViewJSON) {
                    // Filter Border before loading
                    if (activeViewJSON.objects) {
                        activeViewJSON.objects = activeViewJSON.objects.filter(o => o.id !== 'print-area-border');
                    }

                    // Load Visuals
                    fabricCanvas.loadFromJSON(activeViewJSON, () => {
                        fabricCanvas.renderAll();
                        // Sync Redux
                        addObj(activeViewJSON.objects || []);
                        setLoadTimestamp(Date.now()); // Trigger border refresh
                    });
                }
            } 
            // ---------------------------------------------------------
            // CASE B: BLANK/SINGLE DESIGN -> MERGE OR LOAD
            // ---------------------------------------------------------
            else {
                // Get Objects List (Handle standard JSON or direct Array)
                let incomingObjects = parsedJSON.objects || (Array.isArray(parsedJSON) ? parsedJSON : []);
                
                // 1. Clean Data (Remove Borders)
                incomingObjects = incomingObjects.filter(obj => obj.id !== 'print-area-border');

                if (isMerge) {
                    console.log("Merging Blank Design into Current View...");

                    // 2. MERGE LOGIC: Enliven & Append (No toJSON!)
                    
                    // A. Assign New IDs (Avoid conflicts)
                    incomingObjects.forEach(obj => {
                        const newId = uuidv4();
                        obj.id = newId;
                        obj.customId = newId;
                    });

                    // B. Add Visuals to Canvas (Preserves existing objects)
                    import('fabric').then(({ fabric }) => {
                        fabric.util.enlivenObjects(incomingObjects, (enlivened) => {
                            enlivened.forEach(obj => {
                                fabricCanvas.add(obj); // Add to canvas
                            });
                            fabricCanvas.requestRenderAll();

                            // C. Update Redux (Current + New)
                            const currentReduxState = store.getState().canvas.present;
                            
                            // Better Strategy: Let's trust Redux State for existing, and format new ones.
                            const formattedNewObjects = enlivened.map(obj => ({
                                id: obj.customId,
                                type: obj.textEffect === 'circle' ? 'circle-text' : obj.type,
                                ...(obj.type === 'image' && { src: obj.src }),
                                props: {
                                    left: obj.left, top: obj.top, angle: obj.angle, fill: obj.fill,
                                    opacity: obj.opacity, shadowBlur: obj.shadowBlur||0, 
                                    scaleX: obj.scaleX||1, scaleY: obj.scaleY||1,
                                    // ... add other necessary props ...
                                    // (For brevity, ensure all props from addObj map are here)
                                    width: obj.width, height: obj.height, 
                                    text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily,
                                    // ...
                                }
                            }));
                            
                            // 1. Format Incoming
                            const newReduxObjs = incomingObjects.map(obj => ({
                                id: obj.customId,
                                type: obj.textEffect === 'circle' ? 'circle-text' : obj.type,
                                ...(obj.type === 'image' && { src: obj.src }),
                                props: {
                                    left: obj.left, top: obj.top, angle: obj.angle, fill: obj.fill,
                                    opacity: obj.opacity, 
                                    scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
                                    width: obj.width, height: obj.height,
                                    text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily,
                                    charSpacing: obj.charSpacing, textAlign: obj.textAlign,
                                    textStyle: obj.textStyle, textEffect: obj.textEffect, 
                                    effectValue: obj.effectValue,
                                    cropX: obj.cropX, cropY: obj.cropY,
                                    radius: obj.radius, rx: obj.rx, ry: obj.ry,
                                    stroke: obj.stroke, strokeWidth: obj.strokeWidth,
                                    shadowBlur: obj.shadowBlur, shadowColor: obj.shadowColor,
                                    shadowOffsetX: obj.shadowOffsetX, shadowOffsetY: obj.shadowOffsetY,
                                    lockMovementX: obj.lockMovementX, lockMovementY: obj.lockMovementY
                                }
                            }));

                            // 2. Append to Current State
                            const finalReduxList = [...currentReduxState, ...newReduxObjs];
                            store.dispatch(setCanvasObjects(finalReduxList));

                        }, 'fabric');
                    });

                } else {
                    // 3. STANDARD LOAD: Replace Current View
                    parsedJSON.objects = incomingObjects; // filtered list
                    fabricCanvas.loadFromJSON(parsedJSON, () => {
                        fabricCanvas.renderAll();
                        addObj(incomingObjects); // Sync only what we loaded
                        setLoadTimestamp(Date.now());
                    });
                }
            }
        };

        handleLoad();
        
        // Cleanup
        window.history.replaceState({}, document.title);

    }, [location.state, fabricCanvas]);

    console.log(fabricCanvas?.getActiveObject())

    const dataURLtoBlob = (dataURL) => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const captureCurrentCanvas = () => {
        if (!fabricCanvas) return null;

        const originalBg = fabricCanvas.backgroundColor;
        const originalClip = fabricCanvas.clipPath;

        if (productData.title.includes("Mug")) {
            fabricCanvas.backgroundColor = "#FFFFFF";
        } else {
            fabricCanvas.backgroundColor = null;
        }

        fabricCanvas.clipPath = null;
        const borderObj = fabricCanvas?.getObjects().find(obj => obj.id === 'print-area-border');
        let wasBorderVisible = false;
        if (borderObj) {
            wasBorderVisible = borderObj.visible; // Remember state
            // borderObj.visible = false; // Hide it
        }

        fabricCanvas.renderAll();

        try {
            const dataUrl = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1,
                enableRetinaScaling: false
            });
            const blob = dataURLtoBlob(dataUrl);
            const blobUrl = URL.createObjectURL(blob);
            return { blob, url: blobUrl };

        } catch (err) {
            console.error("Failed to capture canvas:", err);
            return null;
        } finally {
            fabricCanvas.backgroundColor = originalBg;
            fabricCanvas.clipPath = originalClip;
            if (borderObj) {
                borderObj.visible = wasBorderVisible; // Show it again
            }
            fabricCanvas.renderAll();
        }
    };


    const handleSwitchView = async (newView) => {
        if (!fabricCanvas || newView === currentView) return;

        const currentSnapshot = await captureCurrentCanvas();
        setDesignTextures(prev => ({ ...prev, [currentView]: currentSnapshot }));

        const currentCanvasState = store.getState().canvas;

        setViewStates(prev => ({
            ...prev,
            [currentView]: currentCanvasState
        }));

        setCurrentView(newView);

        const nextHistory = viewStates[newView] || { past: [], present: [], future: [] };

        dispatch(setHistory(nextHistory));
    };

    const handleColorChange = (colorName) => {
        if (!fabricCanvas) return;
        const hex = COLOR_MAP[colorName] || colorName;
        setCanvasBg(hex);
        fabricCanvas.backgroundColor = hex;
        fabricCanvas.renderAll();
    };

    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;

        fabricCanvas.discardActiveObject();
        setIsGeneratingPreview(true);

        try {
            const currentSnapshot = captureCurrentCanvas();

            if (!currentSnapshot) {
                console.error("Failed to generate snapshot");
                setIsGeneratingPreview(false);
                return;
            }

            const updatedTextures = {
                ...designTextures,
                [currentView]: currentSnapshot
            };

            setDesignTextures(updatedTextures);

            if (productId) {
                setIsPreviewOpen(true);
            } else {
                handleAddToCartDirectly(currentSnapshot);
            }
        } catch (error) {
            console.error("Preview generation error:", error);
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleAddToCartDirectly = (designData) => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            navigation('/dashboard/templates');
        }, 1500);
    };

    const handleAddToCart = async () => {
        setIsSaving(true);
        console.log("Saving Order:", {
            product: productData.title,
            textures: designTextures,
            color: canvasBg
        });
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            navigation('/dashboard/orders');
        }, 1500);
    };

    const BrandDisplay = (
        <div className="header-brand toolbar-brand" onClick={() => navigation('/dashboard')} style={{ cursor: 'pointer' }}>
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
                    onSelectTool={(tool) => setActivePanel(prev => prev === tool ? null : tool)}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool}
                    navigation={navigation}
                    brandDisplay={BrandDisplay}
                    fabricCanvas={fabricCanvas}
                    productId={productId}
                    urlColor={urlColor}
                    urlSize={urlSize}
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

                <main className="preview-area relative bg-slate-100 flex items-center justify-center overflow-hidden" ref={containerRef}>

                    {productId && productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/90 p-1.5 rounded-full border shadow-sm backdrop-blur-sm">
                            {Object.keys(productData.print_areas).map(view => (
                                <button
                                    key={view}
                                    onClick={() => handleSwitchView(view)}
                                    className={`px-4 py-1 rounded-full text-xs font-bold capitalize transition-all ${currentView === view ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}
                                >
                                    {view.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="top-bar consolidated-bar">
                        <div className="control-group">
                            <button className="top-bar-button" onClick={() => dispatch(undo())} disabled={past.length === 0} style={{ opacity: past.length === 0 ? 0.25 : 1 }}><FiRotateCcw size={18} /></button>
                            <button className="top-bar-button" onClick={() => dispatch(redo())} disabled={future.length === 0} style={{ opacity: future.length === 0 ? 0.25 : 1 }}><FiRotateCw size={18} /></button>
                        </div>
                        <div className="control-group divider">
                            <button className="top-bar-button danger" onClick={() => removeObject(selectedId)} style={{ opacity: !selectedId ? 0.25 : 1 }}><FiTrash2 size={18} /></button>
                        </div>
                        {selectedId && !showProperties && (
                            <div className="control-group phone-only">
                                <button className="top-bar-button accent" onClick={() => setShowProperties(true)}><FiSettings size={18} /> <span>Edit</span></button>
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
                                    currentView={currentView}
                                    viewStates={viewStates}
                                    productData={{
                                        productId: productId,
                                        color: canvasBg,
                                        print_areas: productData.print_areas
                                    }}
                                />
                            )}
                            <Button
                                onClick={handleGeneratePreview}
                                disabled={isGeneratingPreview || !fabricCanvas}
                            >
                                {isGeneratingPreview ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>Preview</>
                                )}
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
                        setCurrentDesign={setCurrentDesign}
                        setEditingDesignId={setEditingDesignId}
                        past={past}
                        bgcolor={canvasBg}
                        printDimensions={canvasDims}
                        productId={productId}
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
                        </>
                    ) : (
                        <div className="p-5">
                            {productId && productData.options?.colors?.length > 0 ? (
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

                <ThreeDPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    textures={designTextures}
                    onAddToCart={handleAddToCart}
                    isSaving={isSaving}
                    productId={productId}
                    productData={productData}
                    productCategory={productId ? productData.category : undefined}
                    selectedColor={canvasBg}
                />
            </div>
        </div>
    );
}