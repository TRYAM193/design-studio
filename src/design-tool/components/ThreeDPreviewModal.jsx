import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Box, Image as ImageIcon, X } from "lucide-react";
import Tshirt3DPreview from '../preview3d/Tshirt3DPreview';

// --- HELPER: The "Cylinder Warp" Function ---
// This takes the full design, crops the visible side, and warps it to look round
const generateWarpedMugView = (textureUrl, viewSide) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = textureUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 1. Define the "Slice" we want to see based on the view
            // Assuming the texture is a Full Wrap (approx 2.5:1 ratio)
            const totalWidth = img.width;
            const sliceWidth = totalWidth / 3; // We view 1/3 of the wrap at a time
            const height = img.height;

            // Output canvas size (High res)
            canvas.width = sliceWidth;
            canvas.height = height;

            // Determine which part of the source image to grab
            let sourceXStart = 0;
            if (viewSide === 'front') sourceXStart = sliceWidth;       // Middle 1/3
            if (viewSide === 'right') sourceXStart = sliceWidth * 2;   // Right 1/3
            // 'left' is 0 (Left 1/3)

            // 2. The Vertical Slicing Algorithm (Warping)
            const outputWidth = canvas.width;

            // Iterate over every vertical column of pixels in the OUTPUT canvas
            for (let x = 0; x < outputWidth; x++) {
                // Normalize x from -1 to 1 (calculating the curve)
                let n = (x / outputWidth) * 2 - 1;

                // Inverse Sine mapping to fake a cylinder projection
                // This calculates WHERE on the flat source image this pixel comes from
                let textureXOffset = (Math.asin(n) / (Math.PI / 2)) * (sliceWidth / 2) + (sliceWidth / 2);

                // Add the offset to our starting slice position
                let finalSourceX = sourceXStart + textureXOffset;

                // Clamp to prevent bleeding
                if (finalSourceX < sourceXStart) finalSourceX = sourceXStart;
                if (finalSourceX > sourceXStart + sliceWidth) finalSourceX = sourceXStart + sliceWidth;

                // Draw a 1px vertical strip
                ctx.drawImage(
                    img,
                    finalSourceX, 0, 1.5, height, // Source (x, y, w, h) - 1.5w for anti-aliasing
                    x, 0, 1, height               // Dest (x, y, w, h)
                );
            }

            resolve(canvas.toDataURL());
        };
        img.onerror = () => resolve(null);
    });
};

export function ThreeDPreviewModal({
    isOpen,
    onClose,
    textures,
    productData = {},
    selectedColor = "#FFFFFF"
}) {
    const has3D = !!productData.model3d;
    const mockups = productData.mockups || {};
    const mockupKeys = Object.keys(mockups);

    // Detect Mug
    const isMug = productData?.title?.toLowerCase().includes("mug") ||
        productData?.category?.toLowerCase().includes("mug");

    const [viewMode, setViewMode] = useState('2d');
    const [activeSide, setActiveSide] = useState(mockupKeys[0] || 'front');
    const [warpedTextureSrc, setWarpedTextureSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setViewMode('2d');
            setActiveSide(mockupKeys[0] || 'front');
        }
    }, [isOpen]);

    // --- EFFECT: Handle Mug Warping ---
    useEffect(() => {
        // If it's a mug and in 2D mode, we need to generate the warp
        if (isOpen && isMug && viewMode === '2d' && textures.front?.url) {
            setIsProcessing(true);

            // Mugs usually use the 'front' texture for the whole wrap. 
            // We pass the current 'activeSide' so the function knows which part to crop.
            generateWarpedMugView(textures.front.url, activeSide)
                .then(warpedUrl => {
                    setWarpedTextureSrc(warpedUrl);
                    setIsProcessing(false);
                });
        } else {
            // Standard flat preview for non-mugs
            setWarpedTextureSrc(null);
        }
    }, [activeSide, isMug, isOpen, textures, viewMode]);


    // Helper to get the standard texture (for non-mugs)
    const getStandardTexture = () => {
        if (activeSide === 'left' || activeSide === 'right') return textures.front?.url;
        return textures[activeSide]?.url;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[100vw] h-[100vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden rounded-xl shadow-2xl">
                <DialogTitle className="sr-only">Preview</DialogTitle>
                <DialogDescription className="sr-only">Product Preview</DialogDescription>

                {/* ===== HEADER ===== */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 z-10">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode("2d")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === "2d" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
                        >
                            <ImageIcon size={16} /> 2D Mockup
                        </button>
                        <button
                            onClick={() => has3D && setViewMode("3d")}
                            disabled={!has3D}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === "3d" ? "bg-white text-black" : "text-zinc-400 hover:text-white"} ${!has3D ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                            <Box size={16} />
                            {has3D ? "3D View" : "3D Not Available"}
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={20} />
                    </Button>
                </div>

                {/* ===== MAIN STAGE ===== */}
                <div className="flex-1 flex bg-zinc-900 overflow-hidden">
                    <div className="flex-1 flex flex-col">

                        {/* 2D VIEW PORT */}
                        {viewMode === "2d" && (
                            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-900 relative">

                                <div className="relative w-full max-w-[500px] aspect-[1/1] flex items-center justify-center">

                                    {/* --- LAYER 1: THE MUG BASE (Background) --- */}
                                    {/* This is the photo of the blank mug */}
                                    {mockups[activeSide] && (
                                        <img
                                            src={mockups[activeSide]}
                                            alt="Mug Base"
                                            className="relative z-0 w-full h-full object-contain"
                                        />
                                    )}

                                    {/* --- LAYER 2: THE WARPED DESIGN (Middle) --- */}
                                    {/* This sits ON TOP of the mug image, but UNDER the shadows */}
                                    <div
                                        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                                        style={{
                                            // THIS IS THE KEY MASKING LOGIC
                                            // You must have a mask PNG that matches your mockup shape exactly
                                            WebkitMaskImage: `url('/masks/mug-mask-${activeSide}.png')`, // e.g. mug-mask-front.png
                                            WebkitMaskSize: 'contain',
                                            WebkitMaskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',

                                            maskImage: `url('/masks/mug-mask-${activeSide}.png')`,
                                            maskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                        }}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="animate-spin text-white/50" />
                                        ) : isMug && warpedTextureSrc ? (
                                            <img
                                                src={warpedTextureSrc}
                                                alt="Warped Design"
                                                className="w-full h-full object-contain"
                                                style={{
                                                    // "Multiply" makes the design look like it soaked into the ceramic
                                                    mixBlendMode: 'multiply',
                                                    opacity: 0.9
                                                }}
                                            />
                                        ) : !isMug && getStandardTexture() ? (
                                            /* Fallback for T-shirts/Non-mugs */
                                            <img
                                                src={getStandardTexture()}
                                                className="w-[50%] h-[50%] object-contain" // Simplified sizing for non-mugs
                                            />
                                        ) : null}
                                    </div>

                                    {/* --- LAYER 3: SHADOWS & HIGHLIGHTS (Top) --- */}
                                    {/* This is a generated gradient to fake the roundness sheen */}
                                    {isMug && (
                                        <div
                                            className="absolute inset-0 z-20 pointer-events-none"
                                            style={{
                                                background: `linear-gradient(90deg, 
                                                    rgba(0,0,0,0.2) 0%, 
                                                    rgba(255,255,255,0.0) 30%, 
                                                    rgba(255,255,255,0.3) 45%, 
                                                    rgba(255,255,255,0.0) 60%, 
                                                    rgba(0,0,0,0.2) 100%)`,
                                                // We mask the shadow too so it doesn't show on the background
                                                WebkitMaskImage: `url('/masks/mug-mask-${activeSide}.png')`,
                                                WebkitMaskSize: 'contain',
                                                WebkitMaskRepeat: 'no-repeat',
                                                WebkitMaskPosition: 'center',
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
)}

                           {mockupKeys.length > 1 && (
                            <div className="h-24 border-t border-white/10 bg-zinc-950 flex items-center justify-center gap-4 z-30">
                                {mockupKeys.map(side => (
                                    <button
                                        key={side}
                                        onClick={() => setActiveSide(side)}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${activeSide === side ? "border-white scale-110" : "border-white/20 opacity-60 hover:opacity-100"}`}
                                    >
                                        <img src={mockups[side]} alt={side} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 3D RENDERER (Keep existing) */}
                        {viewMode === "3d" && has3D && (
                            <Tshirt3DPreview
                                modelUrl={productData.model3d}
                                textures={textures} // Pass full textures, let 3D component handle mapping
                                color={selectedColor}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}