// src/design-tool/components/ThreeDPreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, X, Box, Image as ImageIcon, Settings2, Move, Maximize2 } from "lucide-react";
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
    
    // ✅ DETECT MUG PRODUCT (Case insensitive check)
    const isMug = productData?.title?.toLowerCase().includes("mug") || 
                  productData?.category?.toLowerCase().includes("mug");

    const [viewMode, setViewMode] = useState('2d');
    const [activeSide, setActiveSide] = useState(mockupKeys[0] || 'front');

    const [adjustments, setAdjustments] = useState({ 
        top: 25, 
        left: 0, 
        width: 100, 
        height: 50 
    });

    useEffect(() => {
        if (isOpen) {
            setViewMode('2d');
            setActiveSide(mockupKeys[0] || 'front');
        }
    }, [isOpen, productId]);

    // Load defaults when switching sides
    useEffect(() => {
        const defaults = productData.print_area_2d?.[activeSide] || { top: 20, left: 30, width: 40, height: 40 };
        setAdjustments({
            top: defaults.top,
            left: defaults.left,
            width: defaults.width,
            height: defaults.height || defaults.width || 40
        });
    }, [activeSide, productData]);

    const getCurrentTexture = () => {
        // If it's a mug, we usually reuse the 'front' (full wrap) texture for all sides
        if (isMug) return textures.front?.url;
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url; 
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();
    
    const handleAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    console.log(i)

    // ✅ CALCULATE MUG WRAP OFFSET
    // If viewing 'Left', show left 1/3 of image. 'Front' -> Center. 'Right' -> Right 1/3.
    const getMugShift = () => {
        if (!isMug) return '0%';
        switch(activeSide) {
            case 'left': return '0%';      // Start of image
            case 'front': return '-100%';  // Center of image (shift left by 1 width)
            case 'right': return '-200%';  // End of image (shift left by 2 widths)
            default: return '0%';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[100vw] h-[100vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden rounded-xl shadow-2xl">
                <DialogTitle className="sr-only">Preview Design</DialogTitle>
                <DialogDescription className="sr-only">Preview your design in 2D or 3D</DialogDescription>

                {/* --- HEADER --- */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 z-10 flex-shrink-0">
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
                {/* ✅ MOBILE FIX: Added 'flex-col lg:flex-row' to stack on mobile */}
                <div className="flex-1 relative w-full bg-zinc-900 overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* === LEFT: PREVIEW AREA === */}
                    <div className="flex-1 relative flex flex-col min-w-0 h-full">
                        {viewMode === '2d' && (
                            <div className="relative w-full h-full flex flex-col">
                                <div className="flex-1 flex items-center justify-center bg-zinc-900 p-8 overflow-auto">
                                    
                                    {/* 🖼️ MOCKUP CONTAINER */}
                                    <div className="relative w-full max-w-[500px] aspect-[3/4] shadow-2xl rounded-lg overflow-hidden bg-white flex-shrink-0">
                                        
                                        {/* LAYER 1: Base Color */}
                                        <div 
                                            className="absolute inset-0 w-full h-full z-0 transition-colors duration-300"
                                            style={{ backgroundColor: selectedColor }}
                                        />

                                        {/* LAYER 2: Mockup Image */}
                                        {mockups[activeSide] ? (
                                            <img 
                                                src={mockups[activeSide]} 
                                                alt={`${activeSide} view`} 
                                                className="absolute inset-0 w-full h-full object-contain z-10"
                                                style={{ mixBlendMode: 'multiply' }} 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300 relative z-20">
                                                No Mockup Available
                                            </div>
                                        )}

                                        {/* LAYER 3: User Design (With Wrap Logic) */}
                                        {currentTexture && (
                                            <div 
                                                className="absolute z-20 border border-transparent hover:border-white/50 transition-all overflow-hidden"
                                                style={{
                                                    top: `${adjustments.top}%`,
                                                    left: `${adjustments.left}%`,
                                                    width: `${adjustments.width}%`,
                                                    height: `${adjustments.height}%`,
                                                    mixBlendMode: 'multiply' 
                                                }}
                                            >
                                                {/* ✅ WRAP LOGIC: If Mug, render 300% width and shift. If Shirt, standard fill. */}
                                                {isMug ? (
                                                    <div className="w-full h-full relative">
                                                        <img 
                                                            src={currentTexture}
                                                            alt="design"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                height: '100%',
                                                                width: '300%', // Assume wrap covers 3 views
                                                                maxWidth: 'none',
                                                                left: getMugShift(), // Shift based on side
                                                                transition: 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth slide effect
                                                                objectFit: 'fill'
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={currentTexture} 
                                                        alt="design" 
                                                        className="w-full h-full object-fill" 
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Side Selector */}
                                {mockupKeys.length > 1 && (
                                    <div className="h-20 lg:h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4 flex-shrink-0">
                                        {mockupKeys.map(side => (
                                            <button
                                                key={side}
                                                onClick={() => setActiveSide(side)}
                                                className={`relative w-14 h-14 lg:w-16 lg:h-16 rounded-lg border-2 overflow-hidden transition-all ${
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
                        )}

                        {/* === 3D VIEW === */}
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
                    </div>

                    {/* === RIGHT: ADJUSTMENT SIDEBAR (Only in 2D Mode) === */}
                    {/* ✅ MOBILE FIX: Responsive width (w-full on mobile, w-80 on desktop) */}
                    {viewMode === '2d' && (
                        <div className="w-full lg:w-80 h-auto lg:h-full bg-zinc-900 border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col gap-8 z-30 shadow-xl overflow-y-auto">
                            
                            <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                                <Settings2 className="text-zinc-400" size={20} />
                                <h3 className="text-white font-semibold">Adjust Placement</h3>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Move size={12} /> Position
                                </h4>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                                        <span>Top (Y)</span>
                                        <span className="text-white">{adjustments.top.toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100" step="1"
                                        value={adjustments.top}
                                        onChange={(e) => handleAdjustment('top', e.target.value)}
                                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                     
                                <div className="space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                                        <span>Left (X)</span>
                                        <span className="text-white">{adjustments.left.toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100" step="1"
                                        value={adjustments.left}
                                        onChange={(e) => handleAdjustment('left', e.target.value)}
                                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Maximize2 size={12} /> Dimensions
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                                        <span>Width</span>
                                        <span className="text-white">{adjustments.width.toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5" max="100" step="1"
                                        value={adjustments.width}
                                        onChange={(e) => handleAdjustment('width', e.target.value)}
                                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                                        <span>Height</span>
                                        <span className="text-white">{adjustments.height.toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5" max="100" step="1"
                                        value={adjustments.height}
                                        onChange={(e) => handleAdjustment('height', e.target.value)}
                                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="mt-auto pt-6 border-t border-white/10">
                                <Button
                                    className="w-full h-12 text-base font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl gap-2 shadow-xl"
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