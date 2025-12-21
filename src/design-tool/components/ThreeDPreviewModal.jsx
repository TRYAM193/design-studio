import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, X } from "lucide-react";
import Tshirt3DPreview from '../preview3d/Tshirt3DPreview';

export function ThreeDPreviewModal({
    isOpen,
    onClose,
    textures,
    onAddToCart,
    isSaving,
    productId,
    productCategory = "Apparel",
    selectedColor = "#FFFFFF"
}) {
    const isApparel = productCategory === "Apparel" || !productCategory;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex overflow-hidden rounded-xl shadow-2xl">
                <DialogTitle className="sr-only">3D Preview</DialogTitle>
                {/* Added Description to fix accessibility warning */}
                <DialogDescription className="sr-only">
                    A rotatable 3D preview of your custom design on the selected product.
                </DialogDescription>

                {/* --- FULL SCREEN 3D STAGE --- */}
                <div className="flex-1 relative w-full h-full bg-zinc-900">

                    {/* Close Button (Floating) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10"
                    >
                        <X size={20} />
                    </Button>

                    {/* 3D Content */}
                    {isApparel ? (
                        <Tshirt3DPreview
                            productId={productId}
                            textures={{
                                front: textures.front?.url,
                                back: textures.back?.url,
                                leftSleeve: textures.leftSleeve?.url,
                                rightSleeve: textures.rightSleeve?.url
                            }}
                            color={selectedColor}
                        />
                    ) : (
                        <div>3D Preview not available for this item.</div>
                    )}


                    {/* Action Bar (Floating Bottom) */}
                    <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-4 px-4 pointer-events-none">
                        <div className="pointer-events-auto flex gap-3 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="text-white hover:bg-white/10 h-12 px-6 rounded-xl"
                            >
                                Continue Editing
                            </Button>

                            <Button
                                className="h-12 px-8 text-base font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl gap-2"
                                onClick={onAddToCart}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
                                {isSaving ? "Processing..." : "Add to Cart"}
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}