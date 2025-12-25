// src/design-tool/components/ThreeDPreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, X, Box, Image as ImageIcon } from "lucide-react";
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

    // ✅ FIXED CONFIGURATION (The "Print Area" Definition)
    // Since editing happens on canvas, this defines where the "Canvas" sits on the "Shirt"
    const printAreaConfig = productData.print_area_2d?.[activeSide] || { 
        top: 18,   // 18% from top
        left: 15,  // 15% from left
        width: 71  // 71% width
    };

    // Reset view when opening
    useEffect(() => {
        if (isOpen) {
            setViewMode('2d');
            setActiveSide(mockupKeys[0] || 'front');
        }
    }, [isOpen, productId]);

    const getCurrentTexture = () => {
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url; 
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();
    const currentMockupImage = mockups[activeSide];

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
                    
                    {/* === FULL WIDTH VIEWPORT === */}
                    <div className="flex-1 relative flex flex-col min-w-0"> 
                        {viewMode === '2d' && (
                            // p-0 ensures the image goes edge-to-edge
                            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-0 overflow-hidden relative">
                                
                                <div className="relative w-full h-full flex items-center justify-center bg-transparent group">
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

                                            {/* Layer 2: Mockup Image (Maximized) */}
                                            {/* h-[calc(100vh-64px)] ensures it fills vertical space exactly */}
                                            <img 
                                                src={currentMockupImage} 
                                                alt={`${activeSide} view`} 
                                                className="relative z-10 block h-[calc(100vh-64px)] w-auto object-contain"
                                                style={{ mixBlendMode: 'multiply' }} 
                                            />

                                            {/* Layer 3: Design Overlay (Fixed Positioning) */}
                                            {currentTexture && (
                                                <div 
                                                    className="absolute z-20"
                                                    style={{
                                                        top: `${printAreaConfig.top}%`,
                                                        left: `${printAreaConfig.left}%`,
                                                        width: `${printAreaConfig.width}%`,
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

                        {/* Side Selector (Floating Bottom Center) */}
                        {viewMode === '2d' && mockupKeys.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4 bg-zinc-900/80 p-2 rounded-xl backdrop-blur-sm border border-white/10">
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

                        {/* Add to Cart Button (Floating Bottom Right) */}
                        <div className="absolute bottom-6 right-6 z-50">
                            <Button
                                className="h-14 px-8 text-base font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl gap-2 shadow-xl"
                                onClick={onAddToCart}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <ShoppingBag size={20} />}
                                {isSaving ? "Processing..." : "Add to Cart"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}