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
    const currentMockupConfig = productData.print_area_2d?.[activeSide] || { top: 20, left: 30, width: 40 };

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
                        
                        {/* ✅ UPDATED BUTTON: Shows "3D Not Available" if missing */}
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
                <div className="flex-1 relative w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                    
                    {/* === 2D VIEW === */}
                    {viewMode === '2d' && (
                        <div className="relative w-full h-full flex flex-col">
                            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-8">
                                
                                {/* 🖼️ MOCKUP CONTAINER */}
                                <div className="relative w-full max-w-[500px] aspect-[3/4] shadow-2xl rounded-lg overflow-hidden bg-white">
                                    
                                    {/* LAYER 1: The Selected Color (Base) */}
                                    <div 
                                        className="absolute inset-0 w-full h-full z-0 transition-colors duration-300"
                                        style={{ backgroundColor: '#' }}
                                    />

                                    {/* LAYER 2: The Mockup Image (Shadows/Highlights) */}
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

                                    {/* LAYER 3: The User's Design */}
                                    {currentTexture && (
                                        <div 
                                            className="absolute z-20"
                                            style={{
                                                top: `${currentMockupConfig.top}%`,
                                                left: `${currentMockupConfig.left}%`,
                                                width: `${currentMockupConfig.width}%`,
                                                mixBlendMode: 'multiply' 
                                            }}
                                        >
                                            <img src={currentTexture} alt="design" className="w-full h-auto" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Side Selector */}
                            {mockupKeys.length > 1 && (
                                <div className="h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4">
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

                    {/* Footer / Add To Cart */}
                    <div className="absolute bottom-6 right-6 z-50 flex gap-3">
                         <Button
                            className="h-12 px-8 text-base font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl gap-2 shadow-xl"
                            onClick={onAddToCart}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
                            {isSaving ? "Processing..." : "Add to Cart"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}