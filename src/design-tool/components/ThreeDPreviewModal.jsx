// src/design-tool/components/ThreeDPreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, X, Box, Image as ImageIcon, Move, Maximize2 } from "lucide-react";
import Tshirt3DPreview from '../preview3d/Tshirt3DPreview';

export function ThreeDPreviewModal({
    isOpen,
    onClose,
    textures,
    onAddToCart,
    isSaving,
    productId,
    productData = {},
    selectedColor = "#FFFFFF" 
}) {
    const has3D = !!productData.model3d;
    const mockups = productData.mockups || {};
    const mockupKeys = Object.keys(mockups);
    
    const [viewMode, setViewMode] = useState('2d');
    const [activeSide, setActiveSide] = useState(mockupKeys[0] || 'front');

    // ✅ DEFAULT VALUES (Left: 15%, Top: 18%, Scale: 71%)
    const fallbackDefaults = { top: 18, left: 15, width: 71 };

    const [adjustments, setAdjustments] = useState({ 
        top: fallbackDefaults.top, 
        left: fallbackDefaults.left, 
        scale: fallbackDefaults.width 
    });

    useEffect(() => {
        if (isOpen) {
            const defaults = productData.print_area_2d?.[activeSide] || fallbackDefaults;
            setAdjustments({
                top: defaults.top,
                left: defaults.left,
                scale: defaults.width || defaults.scale || 71
            });
        }
    }, [isOpen, activeSide, productId]);

    const getCurrentTexture = () => {
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url; 
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();
    const currentMockupImage = mockups[activeSide];

    const handleAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Full Screen Modal */}
            <DialogContent className="w-[100vw] h-[100vh] max-w-none p-0 gap-0 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden shadow-2xl">
                <DialogTitle className="sr-only">Preview Design</DialogTitle>
                <DialogDescription className="sr-only">Preview your design in 2D or 3D</DialogDescription>

                {/* --- HEADER --- */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 z-50 flex-shrink-0">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode('2d')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewMode === '2d' ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <ImageIcon size={16} /> 2D Mockup
                        </button>
                        
                        <button
                            onClick={() => has3D && setViewMode('3d')}
                            disabled={!has3D}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewMode === '3d' ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
                            } ${!has3D ? "opacity-40 cursor-not-allowed bg-transparent hover:text-zinc-400" : ""}`}
                        >
                            <Box size={16} /> 
                            {has3D ? "3D View" : "3D Not Available"}
                        </button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white rounded-full hover:bg-white/10">
                        <X size={20} />
                    </Button>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 relative w-full bg-zinc-900 overflow-hidden flex">
                    
                    {/* === LEFT: PREVIEW CANVAS (Expanded Viewport) === */}
                    <div className="flex-1 relative flex flex-col min-w-0"> {/* min-w-0 prevents flex overflow */}
                        {viewMode === '2d' && (
                            // Reduced padding from p-8 to p-4 to maximize space
                            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-4 overflow-hidden relative">
                                
                                <div className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden bg-transparent group transition-all duration-300">
                                    {currentMockupImage ? (
                                        <>
                                            {/* Layer 1: Color Mask */}
                                            <div 
                                                className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                                                style={{ 
                                                    backgroundColor: selectedColor,
                                                    maskImage: `url(${currentMockupImage})`,
                                                    WebkitMaskImage: `url(${currentMockupImage})`,
                                                    maskSize: 'contain',
                                                    WebkitMaskSize: 'contain',
                                                    maskRepeat: 'no-repeat',
                                                    WebkitMaskRepeat: 'no-repeat',
                                                    maskPosition: 'center',
                                                    WebkitMaskPosition: 'center'
                                                }}
                                            />

                                            {/* Layer 2: Mockup Image (Increased height to 85vh) */}
                                            <img 
                                                src={currentMockupImage} 
                                                alt={`${activeSide} view`} 
                                                // ⚡ CHANGED: increased max-h to 85vh for larger view
                                                className="relative z-10 block max-h-[85vh] w-auto object-contain"
                                                style={{ mixBlendMode: 'multiply' }} 
                                            />

                                            {/* Layer 3: Design Overlay */}
                                            {currentTexture && (
                                                <div 
                                                    className="absolute z-20"
                                                    style={{
                                                        top: `${adjustments.top}%`,
                                                        left: `${adjustments.left}%`,
                                                        width: `${adjustments.scale}%`,
                                                        mixBlendMode: 'multiply',
                                                        opacity: 0.95 
                                                    }}
                                                >
                                                    <img src={currentTexture} alt="design" className="w-full h-auto" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-[300px] h-[400px] flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-lg">
                                            No Mockup Available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {viewMode === '3d' && has3D && (
                            <div className="w-full h-full">
                                <Tshirt3DPreview
                                    modelUrl={productData.model3d}
                                    textures={{
                                        front: textures.front?.url,
                                        back: textures.back?.url,
                                        leftSleeve: textures.leftSleeve?.url,
                                        rightSleeve: textures.rightSleeve?.url
                                    }}
                                    color={selectedColor}
                                />
                            </div>
                        )}

                        {/* Side Selector (Floating at Bottom Center) */}
                        {viewMode === '2d' && mockupKeys.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-4 bg-zinc-900/80 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                {mockupKeys.map(side => (
                                    <button
                                        key={side}
                                        onClick={() => setActiveSide(side)}
                                        className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                                            activeSide === side ? "border-white scale-110 shadow-lg" : "border-white/20 opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <div className="absolute inset-0" style={{ backgroundColor: selectedColor }} />
                                        <img 
                                            src={mockups[side]} 
                                            alt={side} 
                                            className="absolute inset-0 w-full h-full object-cover" 
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* === RIGHT: CONTROLS SIDEBAR === */}
                    {viewMode === '2d' && (
                        <div className="w-80 bg-zinc-900 border-l border-white/10 p-6 flex flex-col gap-8 z-40 shadow-xl flex-shrink-0">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2 border-b border-white/10 pb-4">
                                <Move size={18} /> Position & Scale
                            </h3>

                            {/* Top / Y-Axis Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                    <span>Vertical Position (Y)</span>
                                    <span className="text-white">{adjustments.top.toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100" step="1"
                                    value={adjustments.top}
                                    onChange={(e) => handleAdjustment('top', e.target.value)}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            {/* Left / X-Axis Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                    <span>Horizontal Position (X)</span>
                                    <span className="text-white">{adjustments.left.toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100" step="1"
                                    value={adjustments.left}
                                    onChange={(e) => handleAdjustment('left', e.target.value)}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            {/* Scale / Size Slider */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium items-center">
                                    <span className="flex items-center gap-2"><Maximize2 size={14} /> Size / Scale</span>
                                    <span className="text-white">{adjustments.scale.toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5" max="100" step="1"
                                    value={adjustments.scale}
                                    onChange={(e) => handleAdjustment('scale', e.target.value)}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/10">
                                <p className="text-xs text-zinc-500 mb-4 text-center">
                                    Use sliders to fine-tune the print placement on the mockup.
                                </p>
                                <Button
                                    className="w-full h-14 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-xl gap-2 shadow-xl"
                                    onClick={onAddToCart}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <ShoppingBag size={20} />}
                                    {isSaving ? "Processing..." : "Add to Cart"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}