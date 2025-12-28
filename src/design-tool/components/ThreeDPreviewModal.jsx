import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, X, Box, Image as ImageIcon, Settings2, Move, Maximize2, ArrowRight, ArrowDown } from "lucide-react";
import Tshirt3DPreview from '../preview3d/Tshirt3DPreview';

export function ThreeDPreviewModal({
    isOpen,
    onClose,
    textures,
    onAddToCart,
    isSaving,
    productId,
    productData = {},
    selectedColor
}) {
    const has3D = !!productData.model3d;
    const mockups = productData.mockups || {};
    const mockupKeys = Object.keys(mockups);
    
    // ✅ 1. DETECT MUG
    const isMug = productData?.title?.toLowerCase().includes("mug") || 
                  productData?.category?.toLowerCase().includes("mug");

    const [viewMode, setViewMode] = useState('2d');
    const [activeSide, setActiveSide] = useState(mockupKeys[0] || 'front');

    // ✅ STATE: Adjustments for 2D Placement
    const [adjustments, setAdjustments] = useState({ 
        top: 25, 
        left: 0, 
        width: 100, 
        height: 50 
    });

    const [showControls, setShowControls] = useState(true); // Toggle for the slider panel

    // Detect Pure Black
    const isPureBlack = selectedColor?.toLowerCase() === '#000000' || selectedColor?.toLowerCase() === '#000';

    useEffect(() => {
        if (isOpen) {
            if (isMug && has3D) {
                setViewMode('3d');
            } else {
                setViewMode('2d');
            }
            setActiveSide(mockupKeys[0] || 'front');
        }
    }, [isOpen, productId, isMug, has3D]);

    // Reset or Load Defaults when side changes
    useEffect(() => {
        const defaults = productData.print_area_2d?.[activeSide] || { top: 20, left: 30, width: 40, height: 40 };
        setAdjustments({
            top: defaults.top || 20,
            left: defaults.left || 0,
            width: defaults.width || 100,
            height: defaults.height || defaults.width || 100
        });
    }, [activeSide, productData]);

    const getCurrentTexture = () => {
        if (isMug) return textures.front?.url;
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url; 
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();
    
    const handleAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    const getMugShift = () => {
        if (!isMug) return '0%';
        switch(activeSide) {
            case 'left': return '0%';
            case 'front': return '-100%';
            case 'right': return '-200%';
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
                        
                        {!isMug && (
                            <button
                                onClick={() => setViewMode('2d')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    viewMode === '2d' ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <ImageIcon size={16} /> 2D Mockup
                            </button>
                        )}
                        
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

                    <div className="flex items-center gap-3">
                        <Button 
                             onClick={onAddToCart} 
                             disabled={isSaving}
                             className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <ShoppingBag size={18} />}
                            Add to Cart
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white rounded-full hover:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* --- MAIN STAGE --- */}
                <div className="flex-1 relative w-full bg-zinc-900 overflow-hidden flex">
                    
                    {/* === LEFT: PREVIEW AREA === */}
                    <div className="flex-1 relative flex flex-col min-w-0">
                        
                        {viewMode === '2d' && (
                            <div className="relative w-full h-full flex flex-col">
                                <div className="flex-1 flex items-center justify-center bg-zinc-900 p-8 overflow-auto">
                                    
                                    {/* 🖼️ MOCKUP CONTAINER */}
                                    <div className="relative w-full max-w-[500px] aspect-[3/4] shadow-2xl rounded-lg overflow-hidden bg-zinc-200 flex-shrink-0 group">
                                        
                                        {/* LAYER 1: Base Color */}
                                        <div 
                                            className="absolute inset-0 w-full h-full z-0 transition-colors duration-300"
                                            style={{ 
                                                backgroundColor: selectedColor,
                                                maskImage: `url(${mockups[activeSide]})`,
                                                maskSize: 'contain',
                                                maskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                                WebkitMaskImage: `url(${mockups[activeSide]})`,
                                                WebkitMaskSize: 'contain',
                                                WebkitMaskRepeat: 'no-repeat',
                                                WebkitMaskPosition: 'center',
                                            }}
                                        />

                                        {/* LAYER 2: Mockup Image */}
                                        {mockups[activeSide] ? (
                                            <>
                                                {/* A. SHADOW LAYER */}
                                                <img 
                                                    src={mockups[activeSide]} 
                                                    alt={`${activeSide} view`} 
                                                    className="absolute inset-0 w-full h-full object-contain z-10"
                                                    style={{ mixBlendMode: 'multiply' }} 
                                                />
                                                
                                                {/* B. HIGHLIGHT LAYER */}
                                                <img 
                                                    src={mockups[activeSide]} 
                                                    alt={`${activeSide} highlights`} 
                                                    className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
                                                    style={{ 
                                                        mixBlendMode: 'screen', 
                                                        opacity: isPureBlack ? 0.1 : 0.3 
                                                    }} 
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300 relative z-20">
                                                No Mockup Available
                                            </div>
                                        )}

                                        {/* LAYER 3: USER DESIGN & 2D ADJUSTMENT LOGIC */}
                                        {currentTexture && (
                                            <div 
                                                className="absolute z-20 border border-transparent hover:border-white/50 transition-colors overflow-hidden"
                                                style={{
                                                    // ✅ THIS IS WHERE THE SLIDERS APPLY
                                                    top: `${adjustments.top}%`,
                                                    left: `${adjustments.left}%`,
                                                    width: `${adjustments.width}%`,
                                                    height: `${adjustments.height}%`,
                                                    mixBlendMode: 'multiply' 
                                                }}
                                            >
                                                {isMug ? (
                                                    <div className="relative w-full h-full">
                                                        <img 
                                                            src={currentTexture} 
                                                            alt="design" 
                                                            style={{
                                                                width: '300%',
                                                                maxWidth: 'none',
                                                                height: '100%',
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: getMugShift(),
                                                                transition: 'left 0.4s ease-in-out',
                                                                objectFit: 'fill'
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <img src={currentTexture} alt="design" className="w-full h-full object-fill" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ✅ NEW: 2D PLACEMENT FIXING PANEL (FLOATING) */}
                                {showControls && (
                                    <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl w-64 z-30 animate-in fade-in slide-in-from-right-5">
                                        <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                                            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Settings2 size={14} className="text-indigo-400"/> Placement Fix
                                            </h3>
                                            <button onClick={() => setShowControls(false)} className="text-zinc-500 hover:text-white">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {/* Top Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                                                    <span className="flex items-center gap-1"><ArrowDown size={10}/> Top Offset</span>
                                                    <span className="text-white">{adjustments.top.toFixed(1)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="100" step="0.5"
                                                    value={adjustments.top}
                                                    onChange={(e) => handleAdjustment('top', e.target.value)}
                                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                                />
                                            </div>

                                            {/* Left Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                                                    <span className="flex items-center gap-1"><ArrowRight size={10}/> Left Offset</span>
                                                    <span className="text-white">{adjustments.left.toFixed(1)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="-50" max="100" step="0.5"
                                                    value={adjustments.left}
                                                    onChange={(e) => handleAdjustment('left', e.target.value)}
                                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                                />
                                            </div>

                                            {/* Width Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                                                    <span className="flex items-center gap-1"><Maximize2 size={10}/> Width Scale</span>
                                                    <span className="text-white">{adjustments.width.toFixed(1)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="5" max="200" step="0.5"
                                                    value={adjustments.width}
                                                    onChange={(e) => handleAdjustment('width', e.target.value)}
                                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                                />
                                            </div>

                                             {/* Height Slider */}
                                             <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                                                    <span className="flex items-center gap-1"><Maximize2 size={10} className="rotate-90"/> Height Scale</span>
                                                    <span className="text-white">{adjustments.height.toFixed(1)}%</span>
                                                </div>
                                                <input 
                                                    type="range" min="5" max="200" step="0.5"
                                                    value={adjustments.height}
                                                    onChange={(e) => handleAdjustment('height', e.target.value)}
                                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Toggle Button (If panel closed) */}
                                {!showControls && (
                                    <button 
                                        onClick={() => setShowControls(true)}
                                        className="absolute top-4 right-4 bg-zinc-900 p-2 rounded-lg border border-white/10 hover:bg-zinc-800 transition-colors"
                                        title="Show Adjustment Controls"
                                    >
                                        <Settings2 size={20} className="text-white" />
                                    </button>
                                )}

                                {/* Side Selector Thumbnails */}
                                {mockupKeys.length > 1 && (
                                    <div className="h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4 flex-shrink-0">
                                        {mockupKeys.map(side => (
                                            <button
                                                key={side}
                                                onClick={() => setActiveSide(side)}
                                                className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all bg-zinc-200 ${
                                                    activeSide === side ? "border-white scale-110" : "border-white/20 opacity-60 hover:opacity-100"
                                                }`}
                                            >
                                                <div 
                                                    className="absolute inset-0" 
                                                    style={{ 
                                                        backgroundColor: selectedColor,
                                                        maskImage: `url(${mockups[side]})`,
                                                        maskSize: 'cover',
                                                        WebkitMaskImage: `url(${mockups[side]})`,
                                                        WebkitMaskSize: 'cover'
                                                    }} 
                                                />
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
                </div>
            </DialogContent>
        </Dialog>
    );
}