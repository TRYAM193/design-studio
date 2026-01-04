// src/design-tool/pages/Editor.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Editor.css';
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
import { useCart } from '@/context/CartContext';
import MainToolbar from '../components/MainToolbar';
import ContextualSidebar from '../components/ContextualSidebar';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
// import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'; // REMOVED for speed
import { ThreeDPreviewModal } from '../components/ThreeDPreviewModal';
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { FiTrash2, FiRotateCcw, FiRotateCw, FiSettings, FiX, FiCheckCircle, FiChevronDown, FiDroplet, FiShoppingBag, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const CURRENCY_MAP = {
    IN: { symbol: '₹', code: 'INR' },
    US: { symbol: '$', code: 'USD' },
    GB: { symbol: '£', code: 'GBP' },
    EU: { symbol: '€', code: 'EUR' },
    CA: { symbol: 'C$', code: 'CAD' }
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

    const { addItem, updateItemContent, items: cartItems } = useCart();

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

    const editCartId = searchParams.get('editCartId');
    const [isEditMode, setIsEditMode] = useState(false);

    const urlRegion = searchParams.get('region') || 'IN';

    const [productData, setProductData] = useState(false);
    const [selectedSize, setSelectedSize] = useState(urlSize || 'M');
    const [quantity, setQuantity] = useState(1);

    const AVAILABLE_SIZES = productData.options?.sizes || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

    const [canvasBg, setCanvasBg] = useState(urlColor);
    const [currentView, setCurrentView] = useState("front");
    const [viewStates, setViewStates] = useState({});

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
    const [showColorPanel, setShowColorPanel] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const currencyInfo = CURRENCY_MAP[urlRegion] || CURRENCY_MAP.IN;
    let currentPrice = 0;
    if (productData) {
        if (typeof productData.price === 'object') {
            currentPrice = productData.price[urlRegion] || productData.price.IN || 0;
        } else {
            currentPrice = productData.price || 0;
        }
    }
    const totalPrice = (currentPrice * quantity).toFixed(2);

    useEffect(() => {
        if (!selectedId) {
            setShowColorPanel(true);
        }
    }, [selectedId]);

    // --- Loading & Merging Logic (Abbreviated for brevity - keeping logic same) ---
    const handleLoadSavedDesign = async (designItem) => {
        if (!designItem || !userId) return;
        try {
            const designRef = doc(db, `users/${userId}/designs`, designItem.id);
            const designSnap = await getDoc(designRef);
            if (!designSnap.exists()) return;
            const designData = designSnap.data();

            if (designData.type === 'PRODUCT') {
                 if (designData.productConfig?.productId === (urlProductId || productData.id)) {
                    setCurrentDesign(designData);
                    setEditingDesignId(designData.id);
                    const savedStates = designData.canvasData || {};
                    setViewStates(savedStates);
                    const activeView = designData.productConfig.activeView || 'front';
                    setCurrentView(activeView);
                    const activeObjects = savedStates[activeView] || [];
                    dispatch(setCanvasObjects(activeObjects));
                    setSearchParams(prev => { prev.set('designId', designData.id); return prev; });
                }
            } else {
                // Legacy or blank handling
                const objects = designData.canvasData || [];
                dispatch(setCanvasObjects(objects));
            }
        } catch (error) { console.error("Error loading:", error); }
    };

    const navigateToTemplates = () => {
        const currentObjects = store.getState().canvas.present;
        const backupData = {
            view: currentView,
            viewStates: { ...viewStates, [currentView]: currentObjects },
            timestamp: Date.now()
        };
        sessionStorage.setItem('merge_context', JSON.stringify(backupData));
        navigation('/dashboard/templates', { state: { filterMode: 'product', filterProductId: productData.productId } });
    }

    const fetchProductData = async (pid) => {
        if (!pid) return null;
        try {
            const docRef = doc(db, "base_products", pid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const processedData = {
                    ...data,
                    print_areas: data.print_areas || { front: { width: 4500, height: 5400 } },
                    options: data.options || { colors: [] }
                };
                setProductData(processedData);
                return processedData;
            }
        } catch (err) { console.error(err); }
        return null;
    };

    // --- Restore from Cart ---
    useEffect(() => {
        if (editCartId && cartItems.length > 0) {
            const itemToEdit = cartItems.find(i => i.id === editCartId);
            if (itemToEdit && itemToEdit.designData) {
                setIsEditMode(true);
                if (itemToEdit.variant?.color) setCanvasBg(COLOR_MAP[itemToEdit.variant.color] || itemToEdit.variant.color);
                if (itemToEdit.variant?.size) setSelectedSize(itemToEdit.variant.size);
                if (itemToEdit.quantity) setQuantity(itemToEdit.quantity);

                if (itemToEdit.designData.viewStates) {
                    setViewStates(itemToEdit.designData.viewStates);
                    viewStatesRef.current = itemToEdit.designData.viewStates;
                }
                const savedView = itemToEdit.designData.currentView || 'front';
                setCurrentView(savedView);
                dispatch(setCanvasObjects(itemToEdit.designData.viewStates?.[savedView] || []));
                fetchProductData(itemToEdit.productId);
            }
        }
    }, [editCartId, cartItems, dispatch]);

    useEffect(() => {
        if (!editCartId) {
            const pid = urlProductId || currentDesign?.productConfig?.productId;
            if (pid) fetchProductData(pid);
        }
    }, [urlProductId, currentDesign, editCartId]);


    useEffect(() => {
        if (productData.canvas_size) {
            const area = productData.canvas_size;
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
            setScaleFactor(Math.min((availableWidth * 0.85) / realWidth, (availableHeight * 0.85) / realHeight));
        }
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [productData, currentView]);


    // --- Optimized Image Generation ---

    // Added 'targetWidth' for faster thumbnail generation
    const getCleanDataURL = (targetWidth = 2400) => {
        if (!fabricCanvas) return null;

        const originalBg = fabricCanvas.backgroundColor;
        const originalClip = fabricCanvas.clipPath;
        const originalVpt = fabricCanvas.viewportTransform;

        if (productData.title?.includes("Mug")) {
            fabricCanvas.backgroundColor = "#FFFFFF";
        } else {
            fabricCanvas.backgroundColor = null;
        }
        fabricCanvas.clipPath = null;
        const borderObj = fabricCanvas.getObjects().find(obj => obj.customId === 'print-area-border' || obj.id === 'print-area-border');
        if (borderObj) borderObj.visible = false;

        const currentWidth = fabricCanvas.width;
        const multiplier = targetWidth / currentWidth; // Calculate multiplier dynamically

        fabricCanvas.renderAll();

        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 0.8, // Reduced slightly for speed
            multiplier: multiplier,
            enableRetinaScaling: true
        });

        // Restore
        fabricCanvas.backgroundColor = originalBg;
        fabricCanvas.clipPath = originalClip;
        if (originalVpt) fabricCanvas.setViewportTransform(originalVpt);
        if (borderObj) borderObj.visible = true;
        fabricCanvas.requestRenderAll();

        return dataUrl;
    };

    const captureCurrentCanvas = () => {
        const url = getCleanDataURL(1200); // Default preview size
        if (!url) return null;
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
        if (currentSnapshot) setDesignTextures(prev => ({ ...prev, [currentView]: currentSnapshot }));
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
        if (fabricCanvas) {
            fabricCanvas.backgroundColor = hex;
            fabricCanvas.requestRenderAll();
        }
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

    // ✅ 🚀 OPTIMIZED PAYLOAD GENERATOR
    const generateOrderPayload = async () => {
        const originalView = currentView;
        
        // 1. Snapshot CURRENT view (Fast, no reload needed)
        // Use 800px for thumbnails (much faster than 2400px)
        const currentSnapshot = getCleanDataURL(800); 
        const currentReduxState = store.getState().canvas.present;
        
        // Update local history
        const tempViewStates = { ...viewStates, [currentView]: currentReduxState };
        
        // Prepare results container
        const generatedPreviews = { ...designTextures }; 
        if(currentSnapshot) generatedPreviews[currentView] = currentSnapshot;

        // 2. Identify UNTOUCHED views vs EDITED views
        // We only need to generate images for views that have objects in them.
        // We filter 'tempViewStates' for keys that are NOT currentView and have objects > 0
        const viewsToProcess = Object.keys(tempViewStates).filter(view => {
            const objects = tempViewStates[view];
            // Only process if it's not the current view AND it has objects
            return view !== currentView && objects && objects.length > 0;
        });

        // 3. Process other views (only if necessary)
        if (viewsToProcess.length > 0) {
            setIsGeneratingPreview(true); // Small spinner
            
            try {
                for (const view of viewsToProcess) {
                    const viewObjects = tempViewStates[view];
                    
                    // Load into canvas
                    await new Promise(resolve => {
                        fabricCanvas.loadFromJSON({ version: "6.9.0", objects: viewObjects }, () => {
                            fabricCanvas.renderAll();
                            resolve();
                        });
                    });

                    // Snapshot (Fast 800px)
                    const url = getCleanDataURL(800);
                    if(url) generatedPreviews[view] = url;
                }
            } catch (e) {
                console.error("Error generating backgrounds", e);
            } finally {
                // Restore Original View
                await new Promise(resolve => {
                    fabricCanvas.loadFromJSON({ version: "5.3.0", objects: currentReduxState }, () => {
                        setCurrentView(originalView);
                        dispatch(setCanvasObjects(currentReduxState));
                        fabricCanvas.renderAll();
                        resolve();
                    });
                });
                setIsGeneratingPreview(false);
            }
        }

        // 4. Return Payload (No High-Res Uploads here - fast return)
        return {
            designId: editingDesignId || `temp_${Date.now()}`,
            title: productData.title || "Custom T-Shirt",
            productId: productData.id,
            variant: { color: canvasBg, size: selectedSize },
            quantity: quantity,
            price: currentPrice,
            currency: 'INR',
            thumbnail: productData.image,
            
            // Contains all view images (low res)
            previewImages: generatedPreviews, 
            
            // We set this false, so Admin knows to generate from JSON
            highResGenerated: false, 
            
            designData: {
                viewStates: tempViewStates, 
                currentView: originalView
            },
            vendor: "qikink",
            createdAt: new Date().toISOString()
        };
    };

    const handleAddToCart = async () => {
        if (!userId) { alert("Please login"); return; }
        setIsAddingToCart(true);
        try {
            const payload = await generateOrderPayload(); // Fast generation
            if (isEditMode && editCartId) {
                await updateItemContent(editCartId, payload);
                alert("Cart Updated!");
                navigation('/cart');
            } else {
                await addItem(payload);
            }
        } catch (error) {
            console.error(error);
            alert("Error saving design");
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        setIsSaving(true);
        // Fast generation (no Firebase upload)
        const payload = await generateOrderPayload(); 
        
        try {
             // LocalStorage has 5MB limit. 
             // If payload is too big (many images), we might need to strip previews for LS
             // For now, try saving.
            localStorage.setItem('directBuyItem', JSON.stringify(payload));
            navigation('/checkout?mode=direct');
        } catch (e) {
            console.error("Storage limit exceeded?", e);
            // Fallback: Just navigate, maybe pass ID? 
            // Ideally, we should save to DB as a 'temp_cart' item instead of LS
            alert("Design too complex for direct buy. Adding to cart instead.");
            await addItem(payload);
            navigation('/cart');
        } finally {
            setIsSaving(false);
        }
    };

    // ... (BrandDisplay, etc. remains same) ...
    const BrandDisplay = (
        <div className="header-brand toolbar-brand" onClick={() => navigation('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="logo-circle ring-1 ring-white/20 shadow-lg shadow-orange-500/20">
                <img src="/assets/LOGO.png" alt="TRYAM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ color: 'white' }}>TRYAM</h1>
        </div>
    );

    return (
        <div className="main-app-container selection:bg-orange-500 selection:text-white">
            <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="main full-height-main">
                <MainToolbar
                    activePanel={activePanel}
                    onSelectTool={(tool) => {
                        if (tool === 'templates') { navigateToTemplates(); } 
                        else { setActivePanel(prev => prev === tool ? null : tool); }
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

                {activePanel && <ContextualSidebar activePanel={activePanel} setActivePanel={setActivePanel} addText={addText} addHeading={addHeading} addSubheading={addSubheading} productId={urlProductId || currentDesign?.productConfig?.productId}
                    handleLoadSavedDesign={handleLoadSavedDesign} fabricCanvas={fabricCanvas}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool} />}

                <main className="preview-area relative bg-transparent flex items-center justify-center overflow-hidden" ref={containerRef}>
                    {productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-slate-800/80 p-1.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
                            {Object.keys(productData.print_areas).map(view => (
                                <button key={view} onClick={() => handleSwitchView(view)} className={`px-4 py-1 rounded-full text-xs font-bold capitalize transition-all ${currentView === view ? "bg-orange-600 text-white shadow-orange-900/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                                    {view.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="top-bar consolidated-bar">
                        <div className="control-group">
                            <button className="top-bar-button" onClick={() => dispatch(undo())} disabled={!past.length} style={{ opacity: past.length ? '1' : '0.5' }}><FiRotateCcw size={18} /></button>
                            <button className="top-bar-button" onClick={() => dispatch(redo())} disabled={!future.length} style={{ opacity: future.length ? '1' : '0.5' }}><FiRotateCw size={18} /></button>
                        </div>
                        <div className="control-group divider">
                            <button className="top-bar-button danger" onClick={() => removeObject(selectedId)} style={{ opacity: !selectedId ? '0.5' : '1' }}><FiTrash2 size={18} /></button>
                        </div>
                        {selectedId && !showProperties && (
                            <button className="top-bar-button accent phone-only" onClick={() => setShowProperties(true)}><FiSettings size={18} /> Edit</button>
                        )}
                        {!showColorPanel && !productData && (
                            <button className="top-bar-button accent phone-only" onClick={() => setShowColorPanel(true)}><FiDroplet size={18} /> Colors</button>
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
                                    onGetSnapshot={() => getCleanDataURL(1200)}
                                    onSaveSuccess={() => {}}
                                    currentDesignName={currentDesign?.name}
                                />
                            )}
                            <Button onClick={handleGeneratePreview} disabled={isGeneratingPreview || !fabricCanvas} className="bg-slate-700 hover:bg-slate-600 text-white border border-white/10">
                                {isGeneratingPreview ? <><Loader2 className="animate-spin" /> ...</> : "Preview"}
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
                        productId={productData.id}
                        activeView={currentView}
                    />
                </main>

                <aside className={`right-panel ${(selectedId ? showProperties : showColorPanel) ? 'active' : ''}`}>
                    {selectedId ? (
                        <>
                            <div className="mobile-panel-header">
                                <span className="mobile-panel-title">Edit Properties</span>
                                <button onClick={() => setShowProperties(false)} className="mobile-close-btn"><FiX size={20} /></button>
                            </div>
                            <RightSidebarTabs id={selectedId} type={activeTool} object={canvasObjects.find((obj) => obj.id === selectedId)} updateObject={updateObject} removeObject={removeObject} addText={addText} fabricCanvas={fabricCanvas} setSelectedId={setSelectedId} />
                        </>
                    ) : (productData && (
                        <div className="p-6 flex flex-col h-full overflow-y-auto">
                            <div className="mobile-panel-header">
                                <span className="mobile-panel-title">Product Options</span>
                                <button onClick={() => setShowColorPanel(false)} className="mobile-close-btn"><FiChevronDown size={24} /></button>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Color</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {productData.options?.colors?.length > 0 ? productData.options.colors.map((color) => {
                                        const hex = COLOR_MAP[color] || "#ccc";
                                        const isActive = canvasBg.toLowerCase() === hex.toLowerCase();
                                        return (
                                            <button key={color} onClick={() => handleColorChange(color)} className={`w-9 h-9 rounded-full border transition-all relative ${isActive ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0f172a] scale-110" : "hover:scale-110 border-slate-600"}`} style={{ backgroundColor: hex }}>
                                                {isActive && <FiCheckCircle className="text-orange-500 absolute -top-1 -right-1 bg-white rounded-full drop-shadow-md" />}
                                            </button>
                                        );
                                    }) : <p className="text-sm text-slate-500 col-span-5">No colors available</p>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Size</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {AVAILABLE_SIZES.map((size) => (
                                        <button key={size} onClick={() => setSelectedSize(size)} className={`py-2 text-sm font-medium rounded-md border transition-all ${selectedSize === size ? "border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.2)]" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800"}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quantity</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-slate-700 rounded-md bg-slate-900/50">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white"><FiMinus size={14} /></button>
                                        <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-12 text-center text-sm font-medium focus:outline-none bg-transparent text-white" />
                                        <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white"><FiPlus size={14} /></button>
                                    </div>
                                    <div className="text-sm text-slate-400">{currencyInfo.symbol}{totalPrice} total</div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-700">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400">Total Price</p>
                                        <p className="text-2xl font-bold text-white">{currencyInfo.symbol}{totalPrice}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-col sm:flex-row">
                                    <Button onClick={handleAddToCart} disabled={isAddingToCart || !fabricCanvas} className={`flex-1 h-12 text-base text-white border border-slate-600 ${isEditMode ? "bg-blue-600 hover:bg-blue-700 border-blue-500" : "bg-slate-700 hover:bg-slate-600"}`}>
                                        {isAddingToCart ? <Loader2 className="animate-spin" /> : isEditMode ? <> <Save className="mr-2 h-4 w-4" /> Update Cart </> : <> <FiShoppingBag className="mr-2" /> Add to Cart </>}
                                    </Button>
                                    <Button onClick={handleBuyNow} disabled={isSaving || !fabricCanvas} className="flex-1 h-12 text-base bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/40 border-0">
                                        {isSaving ? <> <Loader2 className="animate-spin mr-2" /> Processing... </> : <> <FiShoppingCart className="mr-2" /> Buy Now </>}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-center text-slate-500 mt-2">Secure checkout powered by Stripe</p>
                            </div>
                        </div>
                    ))}
                </aside>
                <ThreeDPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} textures={designTextures} onAddToCart={handleAddToCart} isSaving={isSaving} productId={urlProductId || currentDesign?.productConfig?.productId} productData={productData} productCategory={productData.category} selectedColor={canvasBg} />
            </div>
        </div>
    );
}