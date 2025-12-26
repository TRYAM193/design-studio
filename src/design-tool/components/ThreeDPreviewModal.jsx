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

    // ✅ 1. DETECT MUG
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
        // ✅ For Mugs, ALWAYS use the 'front' texture (which contains the full wrap design)
        if (isMug) return textures.front?.url;

        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url;
        return textures[activeSide]?.url;
    };

    const currentTexture = getCurrentTexture();

    const handleAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    // ✅ 2. CALCULATE SHIFT (The "Pan Camera" Logic)
    // This tells the image to slide Left/Right inside the frame
    const getMugShift = () => {
        if (!isMug) return '0%';
        switch (activeSide) {
            case 'left': return '0%';      // Show Left 1/3
            case 'front': return '-100%';  // Show Middle 1/3
            case 'right': return '-200%';  // Show Right 1/3
            default: return '0%';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[100vw] h-[100vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden rounded-xl shadow-2xl">
                <DialogTitle className="sr-only">Preview Design</DialogTitle>
                <DialogDescription className="sr-only">
                    Preview your design in 2D or 3D
                </DialogDescription>

                {/* ===== HEADER ===== */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 z-10">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode("2d")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === "2d"
                                    ? "bg-white text-black"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            <ImageIcon size={16} /> 2D Mockup
                        </button>

                        <button
                            onClick={() => has3D && setViewMode("3d")}
                            disabled={!has3D}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === "3d"
                                    ? "bg-white text-black"
                                    : "text-zinc-400 hover:text-white"
                                } ${!has3D ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                            <Box size={16} />
                            {has3D ? "3D View" : "3D Not Available"}
                        </button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* ===== MAIN STAGE ===== */}
                <div className="flex-1 flex bg-zinc-900 overflow-hidden">

                    {/* ===== LEFT PREVIEW ===== */}
                    <div className="flex-1 flex flex-col">
                        {viewMode === "2d" && (
                            <div className="flex-1 flex items-center justify-center p-8">

                                {/* MOCKUP CONTAINER */}
                                <div className="relative w-full max-w-[500px] aspect-[3/4] bg-white rounded-lg shadow-2xl overflow-hidden">

                                    {/* Base color */}
                                    <div
                                        className="absolute inset-0"
                                        style={{ backgroundColor: selectedColor }}
                                    />

                                    {/* Mockup image */}
                                    {mockups[activeSide] && (
                                        <img
                                            src={mockups[activeSide]}
                                            alt={activeSide}
                                            className="absolute inset-0 w-full h-full object-contain z-10"
                                            style={{ mixBlendMode: "multiply" }}
                                        />
                                    )}

                                    {/* Mug shadow */}
                                    {isMug && (
                                        <div
                                            className="absolute inset-0 z-15 pointer-events-none"
                                            style={{
                                                background: `linear-gradient(
                      to right,
                      rgba(0,0,0,0.4) 0%,
                      rgba(0,0,0,0.05) 25%,
                      rgba(255,255,255,0.2) 40%,
                      rgba(255,255,255,0) 50%,
                      rgba(0,0,0,0.05) 75%,
                      rgba(0,0,0,0.4) 100%
                    )`,
                                                mixBlendMode: "multiply"
                                            }}
                                        />
                                    )}

                                    {/* ===== USER DESIGN ===== */}
                                    {currentTexture && (
                                        <>
                                            {/* MUG (MASKED WRAP) */}
                                            {isMug && (
                                                <div
                                                    className="absolute z-20 pointer-events-none"
                                                    style={{
                                                        top: `${adjustments.top}%`,
                                                        left: `${adjustments.left}%`,
                                                        width: `${adjustments.width}%`,
                                                        height: `${adjustments.height}%`,

                                                        WebkitMaskImage: "url('/masks/mug-mask.png')",
                                                        WebkitMaskSize: "100% 100%",
                                                        WebkitMaskRepeat: "no-repeat",

                                                        maskImage: "url('/masks/mug-mask.png')",
                                                        maskSize: "100% 100%",
                                                        maskRepeat: "no-repeat",

                                                        mixBlendMode: "multiply",
                                                        overflow: "hidden"
                                                    }}
                                                >
                                                    <img
                                                        src={currentTexture}
                                                        alt="Mug wrap"
                                                        style={{
                                                            width: "300%",
                                                            height: "100%",
                                                            position: "absolute",
                                                            top: 0,
                                                            left: getMugShift(),
                                                            transition: "left 0.4s ease-in-out",
                                                            objectFit: "fill"
                                                        }}
                                                        draggable={false}
                                                    />
                                                </div>
                                            )}

                                            {/* NON-MUG */}
                                            {!isMug && (
                                                <div
                                                    className="absolute z-20"
                                                    style={{
                                                        top: `${adjustments.top}%`,
                                                        left: `${adjustments.left}%`,
                                                        width: `${adjustments.width}%`,
                                                        height: `${adjustments.height}%`
                                                    }}
                                                >
                                                    <img
                                                        src={currentTexture}
                                                        alt="Design"
                                                        className="w-full h-full object-fill"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Side selector */}
                        {mockupKeys.length > 1 && (
                            <div className="h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4">
                                {mockupKeys.map(side => (
                                    <button
                                        key={side}
                                        onClick={() => setActiveSide(side)}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${activeSide === side
                                                ? "border-white scale-110"
                                                : "border-white/20 opacity-60"
                                            }`}
                                    >
                                        <div
                                            className="absolute inset-0"
                                            style={{ backgroundColor: selectedColor }}
                                        />
                                        <img
                                            src={mockups[side]}
                                            alt={side}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            style={{ mixBlendMode: "multiply" }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ===== 3D VIEW ===== */}
                    {viewMode === "3d" && has3D && (
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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}