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
import { ThreeDPreviewModal } from '../components/ThreeDPreviewModal';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FiTrash2, FiRotateCcw, FiRotateCw, FiCheckCircle, FiSettings, FiX } from 'react-icons/fi';

const COLOR_MAP = {
    "White": "#FFFFFF",
    "Natural": "#F3E5AB",
    "Soft Cream": "#F5F5DC",
    "Sand": "#C2B280",
    "Silver": "#C0C0C0",
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
    "Red": "#EF4444",
    "Heather Red": "#CD5C5C",
    "Cardinal": "#C41E3A",
    "Maroon": "#800000",
    "Heliconia": "#DB2763",
    "Berry": "#C32148",
    "Pink": "#FFC0CB",
    "Light Pink": "#FFB6C1",
    "Soft Pink": "#FDE9EA",
    "Charity Pink": "#FF69B4",
    "Heather Mauve": "#C18995",
    "Purple": "#6A0DAD",
    "Team Purple": "#4B0082",
    "Heather Team Purple": "#663399",
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
    "Gold": "#FFD700",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Autumn": "#D2691E",
    "Brown": "#8B4513",
    "Heather Clay": "#B66A50",
    "Heather Peach": "#FFCBA4"
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

    const productId = searchParams.get('product');
    const urlColor = searchParams.get('color');

    const [productData, setProductData] = useState({
        title: "Custom Design",
        category: "Apparel",
        print_areas: { front: { width: 4500, height: 5400 } },
        options: { colors: [] }
    });

    const [canvasBg, setCanvasBg] = useState("#FFFFFF");
    const [currentView, setCurrentView] = useState("front");

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

    // Initialize product data
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
    }, [productId, urlColor]);

    // Calculate scale factor
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

    // Load design from location state
    useEffect(() => {
        if (location.state?.designToLoad && fabricCanvas) {
            const { designToLoad } = location.state;
            if (designToLoad.canvasData) {
                const jsonContent = typeof designToLoad.canvasData === 'string'
                    ? designToLoad.canvasData
                    : JSON.stringify(designToLoad.canvasData);
                fabricCanvas.loadFromJSON(jsonContent, () => fabricCanvas.renderAll());
            }
        }
    }, [location.state, fabricCanvas]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(designTextures).forEach(texture => {
                if (texture?.url && texture.url.startsWith('blob:')) {
                    URL.revokeObjectURL(texture.url);
                }
            });
        };
    }, []);

    // Helper function to convert dataURL to Blob
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

    // Capture current canvas as blob URL
    const captureCurrentCanvas = () => {
        if (!fabricCanvas) return null;

        console.log("Capturing canvas...");

        const originalBg = fabricCanvas.backgroundColor;
        fabricCanvas.backgroundColor = null;
        fabricCanvas.renderAll();

        try {
            const dataUrl = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1,
                enableRetinaScaling: false
            });

            console.log("DataURL captured, length:", dataUrl.length);

            const blob = dataURLtoBlob(dataUrl);
            const blobUrl = URL.createObjectURL(blob);

            console.log("Blob URL created:", blobUrl);

            return { blob, url: blobUrl };

        } catch (err) {
            console.error("Failed to capture canvas:", err);
            return null;
        } finally {
            fabricCanvas.backgroundColor = originalBg;
            fabricCanvas.renderAll();
        }
    };

    // Switch between different views (front, back, sleeves)
    const handleSwitchView = (newView) => {
        if (!fabricCanvas || newView === currentView) return;

        const currentSnapshot = captureCurrentCanvas();

        setDesignTextures(prev => ({
            ...prev,
            [currentView]: currentSnapshot
        }));

        setCurrentView(newView);
        fabricCanvas.requestRenderAll();
    };

    // Handle color change
    const handleColorChange = (colorName) => {
        if (!fabricCanvas) return;
        const hex = COLOR_MAP[colorName] || colorName;
        setCanvasBg(hex);
        fabricCanvas.backgroundColor = hex;
        fabricCanvas.renderAll();
    };

    // Generate 3D preview
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

    // Add to cart directly without product
    const handleAddToCartDirectly = (designData) => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            navigation('/dashboard/templates');
        }, 1500);
    };

    // Handle add to cart from 3D preview
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

    return (
        <div className="editor-container">
            {/* Top Toolbar */}
            <MainToolbar
                productData={productData}
                canvasBg={canvasBg}
                onColorChange={handleColorChange}
                currentView={currentView}
                onViewChange={handleSwitchView}
            />

            {/* Main Content Area */}
            <div className="editor-content">
                {/* Left Sidebar */}
                <ContextualSidebar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    fabricCanvas={fabricCanvas}
                    addText={addText}
                    addHeading={addHeading}
                    addSubheading={addSubheading}
                    activePanel={activePanel}
                    setActivePanel={setActivePanel}
                />

                {/* Canvas Area */}
                <div className="canvas-container" ref={containerRef}>
                    <CanvasEditor
                        canvasObjects={canvasObjects}
                        setFabricCanvas={setFabricCanvas}
                        setSelectedId={setSelectedId}
                        scaleFactor={scaleFactor}
                        printAreaWidth={productData.print_areas?.[currentView]?.width || 4500}
                        printAreaHeight={productData.print_areas?.[currentView]?.height || 5400}
                        canvasBg={canvasBg}
                    />

                    {/* Action Buttons */}
                    <div className="canvas-actions">
                        <Button
                            onClick={() => dispatch(undo())}
                            disabled={past.length === 0}
                            variant="outline"
                            size="icon"
                        >
                            <FiRotateCcw />
                        </Button>

                        <Button
                            onClick={() => dispatch(redo())}
                            disabled={future.length === 0}
                            variant="outline"
                            size="icon"
                        >
                            <FiRotateCw />
                        </Button>

                        <Button
                            onClick={() => selectedId && removeObject(fabricCanvas, selectedId, setSelectedId)}
                            disabled={!selectedId}
                            variant="outline"
                            size="icon"
                        >
                            <FiTrash2 />
                        </Button>

                        <Button
                            onClick={handleGeneratePreview}
                            disabled={isGeneratingPreview || !fabricCanvas}
                        >
                            {isGeneratingPreview ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>Preview in 3D</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <RightSidebarTabs
                    fabricCanvas={fabricCanvas}
                    selectedId={selectedId}
                    showProperties={showProperties}
                    setShowProperties={setShowProperties}
                />
            </div>

            {/* 3D Preview Modal */}
            <ThreeDPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                textures={{
                    front: designTextures.front?.url,
                    back: designTextures.back?.url,
                    leftSleeve: designTextures.leftSleeve?.url,
                    rightSleeve: designTextures.rightSleeve?.url
                }}
                onAddToCart={handleAddToCart}
                isSaving={isSaving}
                productId={productId}
                productCategory={productData.category}
                selectedColor={canvasBg}
            />
        </div>
    );
}
