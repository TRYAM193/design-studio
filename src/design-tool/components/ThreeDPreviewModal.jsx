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

    // ✅ 1. State for Position & Scale Sliders
    const [adjustments, setAdjustments] = useState({ top: 20, left: 30, scale: 40 });

    // ✅ 2. Reset/Initialize sliders when side changes
    useEffect(() => {
        if (isOpen) {
            const defaults = productData.print_area_2d?.[activeSide] || { top: 20, left: 30, width: 40 };
            setAdjustments({
                top: defaults.top,
                left: defaults.left,
                scale: defaults.width
            });
        }
    }, [isOpen, activeSide, productId]);

    const getCurrentTexture = () => {
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url; 
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();
    const currentMockupImage = mockups[activeSide];

    // Helper for slider input change
    const handleAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[100vw] h-[100vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden rounded-xl shadow-2xl">
                <DialogTitle className="sr-only">Preview Design</DialogTitle>
                <DialogDescription className="sr-only">Preview your design in 2D or 3D</DialogDescription>

                {/* --- HEADER --- */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 z-10">
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

                {/* --- MAIN STAGE --- */}
                <div className="flex-1 relative w-full bg-zinc-900 overflow-hidden flex">
                    
                    {/* === LEFT: PREVIEW CANVAS === */}
                    <div className="flex-1 relative flex flex-col">
                        {viewMode === '2d' && (
                            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-8 overflow-auto">
                                
                                <div className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden bg-transparent group">
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

                                            {/* Layer 2: Mockup Image */}
                                            <img 
                                                src={currentMockupImage} 
                                                alt={`${activeSide} view`} 
                                                className="relative z-10 block max-h-[70vh] w-auto object-contain"
                                                style={{ mixBlendMode: 'multiply' }} 
                                            />

                                            {/* Layer 3: Design Overlay (Controlled by Sliders) */}
                                            {currentTexture && (
                                                <div 
                                                    className="absolute z-20"
                                                    style={{
                                                        // ✅ Linked to Slider State
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

                        {/* Side Selector (Bottom) */}
                        {viewMode === '2d' && mockupKeys.length > 1 && (
                            <div className="h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4 flex-shrink-0 z-30">
                                {mockupKeys.map(side => (
                                    <button
                                        key={side}
                                        onClick={() => setActiveSide(side)}
                                        className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                                            activeSide === side ? "border-white scale-110" : "border-white/20 opacity-60 hover:opacity-100"
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

                    {/* === RIGHT: CONTROLS SIDEBAR (Visible in 2D) === */}
                    {viewMode === '2d' && (
                        <div className="w-72 bg-zinc-900 border-l border-white/10 p-6 flex flex-col gap-8 z-40 shadow-xl">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                <Move size={18} /> Position & Scale
                            </h3>

                            {/* Top / Y-Axis Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                    <span>Top (Y)</span>
                                    <span>{adjustments.top.toFixed(0)}%</span>
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
                            <div className="space-y-3">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                    <span>Left (X)</span>
                                    <span>{adjustments.left.toFixed(0)}%</span>
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
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-wider font-medium items-center">
                                    <span className="flex items-center gap-2"><Maximize2 size={14} /> Scale</span>
                                    <span>{adjustments.scale.toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5" max="100" step="1"
                                    value={adjustments.scale}
                                    onChange={(e) => handleAdjustment('scale', e.target.value)}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div className="mt-auto">
                                <Button
                                    className="w-full h-12 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-xl gap-2 shadow-xl"
                                    onClick={onAddToCart}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
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