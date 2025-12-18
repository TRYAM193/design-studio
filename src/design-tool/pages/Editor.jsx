import React, { useState, useEffect, useRef } from 'react';
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
    FiTrash2, FiRotateCcw, FiRotateCw, FiCheckCircle, FiSettings, FiX, FiLayers
} from 'react-icons/fi';

// Color Palette for Background Simulation
// Comprehensive Color Map for all Product Variants
const COLOR_MAP = {
    // --- WHITES & CREAMS ---
    "White": "#FFFFFF",
    "Natural": "#F3E5AB",
    "Soft Cream": "#F5F5DC",
    "Sand": "#C2B280",
    "Silver": "#C0C0C0",
    
    // --- BLACKS & GREYS ---
    "Black": "#000000",
    "Solid Black Blend": "#1a1a1a",
    "Black Heather": "#2D2D2D",
    "Charcoal": "#36454F",
    "Dark Grey": "#4A4A4A",
    "Asphalt": "#505050",
    "Dark Heather": "#4B5563",
    "Dark Grey Heather": "#525252",
    "Graphite Heather": "#374151",
    "Deep Heather": "#606060",
    "Sport Grey": "#9CA3AF",
    "Athletic Heather": "#9E9E9E",
    "Ash": "#D1D5DB",

    // --- BLUES ---
    "Navy": "#000080",
    "Heather Navy": "#34495E",
    "Royal": "#2563EB",
    "True Royal": "#1C39BB",
    "Heather True Royal": "#4169E1",
    "Steel Blue": "#4682B4",
    "Carolina Blue": "#7BAFD4",
    "Heather Columbia Blue": "#7897BB",
    "Light Blue": "#ADD8E6",
    "Baby Blue": "#89CFF0",
    "Heather Ice Blue": "#A4D3EE",
    "Turquoise": "#40E0D0",
    "Aqua": "#00FFFF",
    "Heather Aqua": "#66CDAA",

    // --- REDS & PINKS ---
    "Red": "#EF4444",
    "Heather Red": "#CD5C5C",
    "Cardinal": "#C41E3A",
    "Maroon": "#800000",
    "Heliconia": "#DB2763", // Bright Pink
    "Berry": "#C32148",
    "Pink": "#FFC0CB",
    "Light Pink": "#FFB6C1",
    "Soft Pink": "#FDE9EA",
    "Charity Pink": "#FF69B4",
    "Heather Mauve": "#C18995",

    // --- PURPLES ---
    "Purple": "#6A0DAD",
    "Team Purple": "#4B0082",
    "Heather Team Purple": "#663399",

    // --- GREENS ---
    "Forest Green": "#228B22",
    "Forest": "#0B6623",
    "Military Green": "#4B5320",
    "Army": "#454B1B",
    "Olive": "#808000",
    "Heather Olive": "#556B2F",
    "Irish Green": "#009E60",
    "Kelly": "#4CBB17",
    "Heather Kelly": "#3CB371",
    "Heather Green": "#608060",
    "Leaf": "#76904A",
    "Heather Mint": "#98FF98",

    // --- YELLOWS & ORANGES & BROWNS ---
    "Gold": "#FFD700",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Autumn": "#D2691E",
    "Brown": "#8B4513",
    "Heather Clay": "#B66A50",
    "Heather Peach": "#FFCBA4"
};

export default function EditorPanel() {
    // --- REDUX & ROUTER ---
    const dispatch = useDispatch();
    const navigation = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const userId = user?.uid;

    // --- CANVAS STATE ---
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showProperties, setShowProperties] = useState(false);

    // Redux Selectors
    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);

    // --- PRODUCT & VIEW STATE ---
    const productId = searchParams.get('product');
    const urlColor = searchParams.get('color');

    const [productData, setProductData] = useState({
        title: "Custom Design",
        category: "Apparel",
        print_areas: { front: { width: 4500, height: 5400 } }, // Default High-Res
        options: { colors: [] }
    });

    const [canvasBg, setCanvasBg] = useState("#FFFFFF");
    const [currentView, setCurrentView] = useState("front");

    // --- SCALING STATE ---
    const containerRef = useRef(null);
    const [scaleFactor, setScaleFactor] = useState(0.2);

    // --- PREVIEW STATE ---
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [designPreview, setDesignPreview] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');

    // 1. INITIAL LOAD
    useEffect(() => {
        async function initEditor() {
            // Case A: Blank Canvas (No Product ID)
            if (!productId) {
                // Keep default productData
                // Do NOT set a background color logic here, will handle in render
                return;
            }

            // Case B: Product Selected
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

                    // Set initial background color if product exists
                    const initialColor = urlColor || (data.options?.colors?.[0] || "White");
                    setCanvasBg(COLOR_MAP[initialColor] || "#FFFFFF");
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        initEditor();
    }, [productId]);

    // 2. AUTO-SCALE LOGIC
    useEffect(() => {
        function calculateScale() {
            if (!containerRef.current) return;

            const realWidth = productData.print_areas?.[currentView]?.width || 4500;
            const realHeight = productData.print_areas?.[currentView]?.height || 5400;

            const availableWidth = containerRef.current.clientWidth;
            const availableHeight = containerRef.current.clientHeight;

            // Fit to 85% of screen space
            const widthRatio = (availableWidth * 0.85) / realWidth;
            const heightRatio = (availableHeight * 0.85) / realHeight;

            const bestScale = Math.min(widthRatio, heightRatio);
            setScaleFactor(bestScale);
        }

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [productData, currentView]);

    // 3. LOAD EXISTING DESIGN (Drafts)
    useEffect(() => {
        if (location.state?.designToLoad && fabricCanvas) {
            const { designToLoad } = location.state;
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

    const handleSwitchView = (newView) => {
        if (!fabricCanvas || newView === currentView) return;
        setCurrentView(newView);
        // Note: You would typically save/load JSON state here for multi-side
        fabricCanvas.requestRenderAll();
    };

    const handleColorChange = (colorName) => {
if (!)

        const hex = COLOR_MAP[colorName] || colorName;
        setCanvasBg(hex);
        fabricCanvas.backgroundColor = hex
        fabricCanvas.renderAll()
    };

    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;
        fabricCanvas.discardActiveObject();

        // 1. Hide bg (if any) to get transparent PNG
        const originalBg = fabricCanvas.backgroundColor;
        fabricCanvas.setBackgroundColor(null, () => {
            fabricCanvas.renderAll();

            // 2. Export Design
            const dataUrl = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1
            });

            setDesignPreview(dataUrl);
            setIsPreviewOpen(true);

            // 3. Restore bg (if needed internally by fabric, though we use DIV for bg)
            fabricCanvas.renderAll();
        });
    };

    const handleAddToCart = async () => {
        setIsSaving(true);
        console.log("Saving Order:", { product: productData.title, design: designPreview });
        setTimeout(() => {
            setIsSaving(false);
            setIsPreviewOpen(false);
            navigation('/dashboard/orders');
        }, 1500);
    };

    const realWidth = productData.print_areas?.[currentView]?.width || 4500;
    const realHeight = productData.print_areas?.[currentView]?.height || 5400;

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

                {/* --- WORKSPACE CONTAINER --- */}
                <main className="preview-area relative bg-slate-100 flex items-center justify-center overflow-hidden" ref={containerRef}>

                    {/* View Tabs (Only if Product has Views) */}
                    {productId && productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/90 p-1.5 rounded-full border shadow-sm backdrop-blur-sm">
                            {Object.keys(productData.print_areas).map(view => (
                                <button
                                    key={view}
                                    onClick={() => handleSwitchView(view)}
                                    className={`px-4 py-1 rounded-full text-xs font-bold capitalize transition-all ${currentView === view ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    {view.replace('_', ' ')}
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

                    {/* --- THE SCALED CANVAS (Visual Workspace) --- */}

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

                </main>

                <aside className={`right-panel ${showProperties || !selectedId ? 'active' : ''}`}>
                    {selectedId ? (
                        /* Case A: Object Selected -> Show Properties */
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
                        /* Case B: Nothing Selected */
                        <div className="p-5">
                            {/* Only Show Colors if Product is Selected */}
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
                                                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-all relative group
                                                        ${isActive ? "border-indigo-600 scale-110" : "border-slate-200 hover:border-slate-300"}
                                                    `}
                                                    style={{ backgroundColor: hex }}
                                                    title={color}
                                                >
                                                    {isActive && <span className="absolute inset-0 flex items-center justify-center text-white/90"><FiCheckCircle size={16} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} /></span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                        Visualize your design on different fabric colors.
                                    </p>
                                </>
                            ) : (
                                <div className="text-center text-slate-400 py-10">
                                    <p>Select an element to edit properties.</p>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                <PreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    // Pass null as baseImage so preview logic knows there is no "Photo"
                    baseImage={null}
                    overlayImage={designPreview}
                    onAddToCart={handleAddToCart}
                    isSaving={isSaving}
                />
            </div>
        </div>
    );
}