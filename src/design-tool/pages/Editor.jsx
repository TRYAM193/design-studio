const [currentDesign, setCurrentDesign] = useState(null);
const [editingDesignId, setEditingDesignId] = useState(null);
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
const COLOR_MAP = {
    "White": "#FFFFFF",
    "Black": "#000000",
    "Red": "#EF4444",
    "Royal": "#2563EB",
    "Navy": "#1E3A8A",
    "Sport Grey": "#9CA3AF",
    "Heather Grey": "#9CA3AF",
    "Dark Heather": "#4B5563",
    "Maroon": "#7F1D1D",
    "Green": "#16A34A",
    "Orange": "#F97316",
    "Purple": "#9333EA",
    "Pink": "#EC4899",
    "Sand": "#D6C3A3",
    "Forest Green": "#14532D",
    "Gold": "#EAB308",
    "Light Blue": "#BAE6FD"
};

export default function EditorPanel() {
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
    const [showProperties, setShowProperties] = useState(false);

    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);

    // --- PRODUCT STATE ---
    const productId = searchParams.get('product');
    const urlColor = searchParams.get('color');

    const [productData, setProductData] = useState({
        title: "Custom Design",
        category: "Apparel",
        print_areas: { front: { width: 4500, height: 5400 } }, // Default High-Res
        options: { colors: ["White", "Black", "Navy", "Red", "Royal", "Sport Grey"] }
    });

    const [baseImage, setBaseImage] = useState("https://placehold.co/800x800?text=Product+Preview");
    const [canvasBg, setCanvasBg] = useState("#FFFFFF");
    const [currentView, setCurrentView] = useState("front");

    // --- SCALING STATE ---
    const containerRef = useRef(null);
    const [scaleFactor, setScaleFactor] = useState(0.2); // Start small, update on mount

    // --- PREVIEW STATE ---
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [designPreview, setDesignPreview] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);
    const [activePanel, setActivePanel] = useState('text');

    // 1. INITIAL LOAD
    useEffect(() => {
        async function initEditor() {
            if (!productId) {
                if (urlColor) setCanvasBg(COLOR_MAP[urlColor] || urlColor);
                return;
            }

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
                    setBaseImage(data.image);
                    const initialColor = urlColor || (data.options?.colors?.[0] || "White");
                    setCanvasBg(COLOR_MAP[initialColor] || "#FFFFFF");
                }
            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
        initEditor();
    }, [productId]);

    // 2. AUTO-SCALE LOGIC (The Fix for "Too Small")
    useEffect(() => {
        function calculateScale() {
            if (!containerRef.current) return;

            const realWidth = productData.print_areas?.[currentView]?.width || 4500;
            const realHeight = productData.print_areas?.[currentView]?.height || 5400;

            const availableWidth = containerRef.current.clientWidth;
            const availableHeight = containerRef.current.clientHeight;

            // Padding: Keep 80% of screen height/width occupied
            const widthRatio = (availableWidth * 0.85) / realWidth;
            const heightRatio = (availableHeight * 0.85) / realHeight;

            // Choose the smaller ratio to ensure it fits completely
            const bestScale = Math.min(widthRatio, heightRatio);

            setScaleFactor(bestScale);
        }

        // Run initially and on resize
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [productData, currentView]);

    const handleSwitchView = (newView) => {
        if (!fabricCanvas || newView === currentView) return;
        setCurrentView(newView);
        fabricCanvas.requestRenderAll();
    };

    const handleColorChange = (colorName) => {
        const hex = COLOR_MAP[colorName] || colorName;
        setCanvasBg(hex);
    };

    const handleGeneratePreview = () => {
        if (!fabricCanvas) return;
        fabricCanvas.discardActiveObject();

        // 1. Hide bg to get transparent PNG
        fabricCanvas.backgroundColor = null
        fabricCanvas.renderAll();

        // 2. Export High-Res Design
        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1 // Actual print size
        });

        setDesignPreview(dataUrl);
        setIsPreviewOpen(true);

        // 3. Restore visual bg
        fabricCanvas.renderAll();

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

    // Helper for canvas dimensions
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

                    {/* View Tabs */}
                    {productData.print_areas && Object.keys(productData.print_areas).length > 1 && (
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

                    {/* --- THE SCALED CANVAS --- */}
                    {/* This wrapper uses transform: scale() to fit the massive print canvas onto the screen.
                        It calculates based on the parent container size (containerRef).
                    */}

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
                        </div>
                    )}
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