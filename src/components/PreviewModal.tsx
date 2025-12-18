import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ShoppingBag, X } from "lucide-react";
import { useState, useEffect } from "react";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseImage: string | null; // This is the generic vector or null
    overlayImage: string;     // The transparent design from Editor
    onAddToCart: () => void;
    isSaving: boolean;
}

// --- REALISTIC ASSETS ---
// You need to upload these 3 images to your public/assets folder or host them
const MOCKUP_ASSETS = {
    apparel: {
        base: "https://placehold.co/1000x1000/ffffff/ffffff?text=White+Tee+Base", // Pure white tee photo
        shadows: "https://placehold.co/1000x1000/000000/ffffff?text=Shadow+Map",   // Multiply blend
        highlights: "https://placehold.co/1000x1000/ffffff/000000?text=Highlight+Map" // Screen blend
    },
    mug: {
        base: "https://placehold.co/800x800/ffffff/cccccc?text=Ceramic+Mug",
        // The GLOSS map is the secret. It has white reflections on transparent bg.
        gloss: "https://placehold.co/800x800/ffffff/000000?text=Gloss+Reflections" 
    }
};

export function PreviewModal({ 
    isOpen, 
    onClose, 
    overlayImage, 
    onAddToCart, 
    isSaving 
}: PreviewModalProps) {
    
    const [activeTab, setActiveTab] = useState<'apparel' | 'mug'>('apparel');
    const [shirtColor, setShirtColor] = useState("#ffffff");

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab('apparel'); 
            setShirtColor("#ffffff");
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-0">
                
                <div className="flex flex-col md:flex-row h-[80vh]">
                    
                    {/* LEFT: The Realistic Preview Stage */}
                    <div className="flex-1 relative bg-gray-200 flex items-center justify-center overflow-hidden">
                        
                        {/* --- SCENARIO A: APPAREL PREVIEW --- */}
                        {activeTab === 'apparel' && (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* 1. The Dynamic Color Base */}
                                <div 
                                    className="absolute w-[80%] h-[80%] bg-cover bg-center mask-image-source"
                                    style={{ 
                                        backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})`,
                                        // This filter tints the white shirt to ANY color
                                        backgroundColor: shirtColor, 
                                        backgroundBlendMode: 'multiply' 
                                    }}
                                />
                                
                                {/* 2. The User's Design */}
                                <img 
                                    src={overlayImage} 
                                    alt="Design"
                                    className="absolute w-[35%] top-[25%] mix-blend-multiply opacity-90"
                                    style={{ 
                                        // Slight perspective warp for realism
                                        transform: 'perspective(500px) rotateX(2deg)' 
                                    }}
                                />

                                {/* 3. Shadow/Wrinkle Overlay (The Realism Layer) */}
                                <div 
                                    className="absolute w-[80%] h-[80%] bg-cover bg-center pointer-events-none mix-blend-multiply opacity-40"
                                    style={{ backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})` }}
                                />
                            </div>
                        )}

                        {/* --- SCENARIO B: MUG PREVIEW (Curved) --- */}
                        {activeTab === 'mug' && (
                            <div className="relative w-full h-full flex items-center justify-center">
                                
                                {/* 1. Mug Base */}
                                <img 
                                    src={MOCKUP_ASSETS.mug.base} 
                                    className="absolute w-[60%] object-contain"
                                    alt="Mug Base"
                                />

                                {/* 2. The Design (Warped) */}
                                <div 
                                    className="absolute w-[30%] h-[30%] flex items-center justify-center overflow-hidden"
                                    style={{
                                        top: '35%', // Adjust based on your mug image
                                        borderRadius: '10px 10px 40px 40px', // Curves the bottom of design
                                        transform: 'perspective(1000px) rotateY(-5deg)', // Slight rotation
                                        maskImage: 'linear-gradient(to right, transparent 2%, black 10%, black 90%, transparent 98%)' // Fades edges to look round
                                    }}
                                >
                                    <img 
                                        src={overlayImage} 
                                        alt="Design"
                                        className="w-full h-full object-contain mix-blend-multiply opacity-95"
                                    />
                                </div>

                                {/* 3. THE SECRET: Gloss/Reflection Overlay */}
                                {/* This image sits ON TOP. It has white highlights. */}
                                <img 
                                    src={MOCKUP_ASSETS.mug.gloss} 
                                    className="absolute w-[60%] object-contain pointer-events-none mix-blend-screen opacity-60"
                                    alt="Gloss"
                                />
                            </div>
                        )}

                    </div>

                    {/* RIGHT: Controls & Details */}
                    <div className="w-full md:w-80 bg-white border-l p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Final Preview</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}><X size={20}/></Button>
                        </div>

                        {/* Preview Mode Switcher */}
                        <div className="space-y-4 mb-8">
                            <label className="text-xs font-bold text-slate-400 uppercase">Preview Mode</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                                <button 
                                    onClick={() => setActiveTab('apparel')}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'apparel' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                                >
                                    Apparel
                                </button>
                                <button 
                                    onClick={() => setActiveTab('mug')}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'mug' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                                >
                                    Mug
                                </button>
                            </div>
                        </div>

                        {/* Apparel Colors (Only show if Apparel) */}
                        {activeTab === 'apparel' && (
                            <div className="space-y-4 mb-auto">
                                <label className="text-xs font-bold text-slate-400 uppercase">Fabric Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {["#ffffff", "#000000", "#1e3a8a", "#dc2626", "#16a34a"].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setShirtColor(color)}
                                            className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${shirtColor === color ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-auto pt-6 border-t">
                            <Button variant="outline" className="w-full gap-2">
                                <Download size={16} /> Download Proof
                            </Button>
                            <Button 
                                className="w-full gap-2 bg-black hover:bg-gray-800 text-lg h-12"
                                onClick={onAddToCart}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <ShoppingBag size={18} />}
                                Add to Cart
                            </Button>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}