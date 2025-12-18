import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ShoppingBag, X, AlertCircle } from "lucide-react";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    overlayImage: string;     // The transparent design from Editor
    onAddToCart: () => void;
    isSaving: boolean;
    productCategory?: string; // "Apparel" | "Home & Living" | etc.
    selectedColor?: string;   // Hex code from Editor
}

// --- REALISTIC ASSETS ---
// These should be transparent PNGs in your public folder for best results
const MOCKUP_ASSETS = {
    apparel: {
        base: "https://placehold.co/1200x1200/ffffff/ffffff?text=Apparel+Base", 
        shadows: "https://placehold.co/1200x1200/000000/ffffff?text=Shadows" 
    },
    mug: {
        base: "https://placehold.co/1000x1000/ffffff/cccccc?text=Mug+Base",
        gloss: "https://placehold.co/1000x1000/ffffff/000000?text=Gloss"
    }
};

export function PreviewModal({ 
    isOpen, 
    onClose, 
    overlayImage, 
    onAddToCart, 
    isSaving,
    productCategory,
    selectedColor = "#ffffff"
}: PreviewModalProps) {

    // 1. Detect Mode
    const isApparel = productCategory === "Apparel";
    const isMug = productCategory === "Home & Living";
    const isBlank = !productCategory; // Started with Blank Canvas

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-0 flex flex-col md:flex-row">
                
                {/* --- LEFT: PREVIEW STAGE --- */}
                <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden p-10">
                    
                    {/* SCENARIO A: REALISTIC SHIRT (Color Tinting) */}
                    {isApparel && (
                        <div className="relative w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center shadow-2xl bg-white rounded-xl">
                            {/* Base Shirt - Tinted dynamically */}
                            <div 
                                className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-colors duration-300"
                                style={{ 
                                    backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})`,
                                    backgroundColor: selectedColor, 
                                    backgroundBlendMode: 'multiply' 
                                }}
                            />
                            
                            {/* User Design - Slight Perspective Tilt */}
                            <img 
                                src={overlayImage} 
                                alt="Design"
                                className="absolute w-[38%] top-[20%] mix-blend-multiply opacity-95"
                                style={{ transform: 'perspective(500px) rotateX(1deg)' }}
                            />

                            {/* Shadow Overlay - For wrinkles over the design */}
                            <div 
                                className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none mix-blend-multiply opacity-30"
                                style={{ backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})` }}
                            />
                        </div>
                    )}

                    {/* SCENARIO B: REALISTIC MUG (Curved Wrap) */}
                    {isMug && (
                        <div className="relative w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center">
                            <img src={MOCKUP_ASSETS.mug.base} className="absolute w-[60%] object-contain drop-shadow-2xl" />

                            {/* Warped Design Container */}
                            <div 
                                className="absolute w-[30%] h-[30%] flex items-center justify-center overflow-hidden"
                                style={{
                                    top: '35%', 
                                    borderRadius: '0 0 30px 30px', 
                                    maskImage: 'linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%)'
                                }}
                            >
                                <img src={overlayImage} className="w-full h-full object-contain mix-blend-multiply opacity-90" />
                            </div>
                            
                            {/* Gloss Reflection */}
                            <img src={MOCKUP_ASSETS.mug.gloss} className="absolute w-[60%] object-contain pointer-events-none mix-blend-screen opacity-40" />
                        </div>
                    )}

                    {/* SCENARIO C: BLANK CANVAS (Raw File) */}
                    {isBlank && (
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="relative bg-[url('https://placehold.co/20x20/f1f5f9/ffffff?text=+')] bg-repeat p-8 border-2 border-dashed border-slate-300 shadow-sm rounded-lg">
                                <img src={overlayImage} className="max-w-[500px] max-h-[500px] object-contain shadow-lg" />
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 border border-blue-100 max-w-md">
                                <AlertCircle size={20} />
                                <div className="text-left">
                                    <p className="font-bold text-sm">Design Only Mode</p>
                                    <p className="text-xs opacity-90">This design is saved as a template. You can apply it to products later from your dashboard.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT: ACTIONS --- */}
                <div className="w-full md:w-96 bg-white border-l p-8 flex flex-col z-20 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Final Review</h2>
                            <p className="text-slate-500 text-sm mt-1">Ready to create?</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}><X size={24}/></Button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-8 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Type</span>
                            <span className="font-semibold text-slate-900">{isBlank ? "Template" : productCategory}</span>
                        </div>
                        {!isBlank && selectedColor && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Color</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedColor }} />
                                    <span className="font-semibold text-slate-900 uppercase">{selectedColor}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 mt-auto pt-6 border-t">
                        <Button variant="outline" className="w-full h-12 gap-2">
                            <Download size={18} /> Download Proof
                        </Button>
                        <Button 
                            className="w-full h-14 text-lg font-bold bg-black hover:bg-slate-800 gap-2"
                            onClick={onAddToCart}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
                            {isBlank ? "Save to Library" : "Add to Cart"}
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}