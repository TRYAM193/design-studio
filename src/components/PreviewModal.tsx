import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ShoppingBag, X, Printer, ShieldCheck } from "lucide-react";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    overlayImage: string;
    onAddToCart: () => void;
    isSaving: boolean;
    productCategory?: string;
    selectedColor?: string;
}

export function PreviewModal({ 
    isOpen, 
    onClose, 
    overlayImage, 
    onAddToCart, 
    isSaving,
    productCategory = "Apparel",
    selectedColor = "#FFFFFF"
}: PreviewModalProps) {

    const isMug = productCategory === "Home & Living";
    const isApparel = !isMug;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogTitle>
            
            {/* Wide, cinematic modal */}
            <DialogContent className="max-w-[90vw] w-full h-[85vh] p-0 gap-0 bg-zinc-950 border-zinc-800 flex  shadow-2xl rounded-xl">
                
                {/* --- LEFT: THE DIGITAL PROOFING STAGE --- */}
                <div className="flex-[2] relative bg-zinc-900 flex flex-col items-center justify-center p-8 ">
                    
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 opacity-[0.03]" 
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                    />

                    {/* --- THE VIRTUAL MOCKUP --- */}
                    <div className="relative z-10 animate-in fade-in zoom-in duration-500">
                        
                        {/* SCENARIO A: CSS T-SHIRT (No Image Required) */}
                        {isApparel && (
                            <div className="relative w-[500px] h-[600px] flex items-center justify-center">
                                {/* The Shirt Shape (CSS Mask) */}
                                <div 
                                    className="absolute inset-0 shadow-2xl transition-all duration-500"
                                    style={{
                                        backgroundColor: selectedColor,
                                        // A simple SVG path for a T-shirt shape clip-path
                                        clipPath: "path('M 150 0 L 190 40 Q 250 80 310 40 L 350 0 L 480 50 L 450 150 L 400 130 L 400 600 L 100 600 L 100 130 L 50 150 L 20 50 Z')",
                                        boxShadow: "inset 0 0 50px rgba(0,0,0,0.2)" // Inner shadow for depth
                                    }}
                                >
                                    {/* Texture/Noise Overlay for Fabric feel */}
                                    <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')]"></div>
                                    
                                    {/* Fold Shadows */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 mix-blend-overlay"></div>
                                </div>

                                {/* The User Design */}
                                <img 
                                    src={overlayImage} 
                                    alt="Print" 
                                    className="relative w-[180px] z-20 mix-blend-multiply opacity-90"
                                    style={{ top: '-20px' }} // Adjust based on clip-path
                                />
                            </div>
                        )}

                        {/* SCENARIO B: CSS MUG (No Image Required) */}
                        {isMug && (
                            <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                                {/* Mug Body */}
                                <div 
                                    className="relative w-[280px] h-[350px] bg-white rounded-b-[40px] shadow-xl overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)`
                                    }}
                                >
                                    {/* The Design Wrapped */}
                                    <div className="absolute top-[80px] left-0 w-full h-[200px] flex items-center justify-center">
                                        <img 
                                            src={overlayImage} 
                                            className="w-[80%] object-contain mix-blend-multiply opacity-95" 
                                        />
                                    </div>
                                    
                                    {/* Glossy Reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></div>
                                </div>

                                {/* Mug Handle */}
                                <div className="absolute right-[60px] top-[100px] w-[80px] h-[180px] border-[25px] border-l-0 border-white rounded-r-[50px] shadow-lg -z-10"></div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-6 text-zinc-500 text-sm font-medium tracking-wide">
                        <div className="flex items-center gap-2"><ShieldCheck size={16}/> High Quality Print</div>
                        <div className="flex items-center gap-2"><Printer size={16}/> DTG Technology</div>
                    </div>
                </div>

                {/* --- RIGHT: ORDER DETAILS --- */}
                <div className="flex-1 min-w-[350px] max-w-[400px] bg-white p-10 flex flex-col relative z-20">
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-6 top-6 rounded-full hover:bg-slate-100">
                        <X size={24} className="text-slate-400"/>
                    </Button>

                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Digital Proof</h2>
                        <p className="text-slate-500 mt-2 font-medium">Review your configuration before production.</p>
                    </div>

                    <div className="space-y-8 flex-1">
                        {/* Product Info Block */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</label>
                            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                <span className="text-slate-600 font-medium">Item Type</span>
                                <span className="text-slate-900 font-bold">{productCategory}</span>
                            </div>
                            {isApparel && (
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Selected Base</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: selectedColor }}></div>
                                        <span className="text-slate-900 font-bold uppercase">{selectedColor}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Status Block */}
                        <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} className="text-emerald-600"/>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-emerald-900">Print File Ready</h4>
                                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">Resolution is optimized for {isMug ? 'ceramic' : 'fabric'} printing. No artifacts detected.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3 pt-6">
                        <Button 
                            className="w-full h-14 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-xl gap-3"
                            onClick={onAddToCart}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
                            {isSaving ? "Processing..." : "Confirm & Add to Cart"}
                        </Button>
                        <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600">
                            Download PDF Proof
                        </Button>
                    </div>
                </div>

            </DialogContent>
          </DialogTitle>
        </Dialog>
    );
}