import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ShoppingBag, X } from "lucide-react";

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
const MOCKUP_ASSETS = {
  apparel: {
    base: "https://placehold.co/1200x1200/ffffff/ffffff?text=High-Res+Apparel+Base",
    // In production, use a transparent PNG of just wrinkles/shadows
    shadows: "https://placehold.co/1200x1200/000000/ffffff?text=Shadows"
  },
  mug: {
    base: "https://placehold.co/1000x1000/ffffff/cccccc?text=Ceramic+Mug+Base",
    gloss: "https://placehold.co/1000x1000/ffffff/000000?text=Gloss+Overlay"
  }
};

export function PreviewModal({
  isOpen,
  onClose,
  overlayImage,
  onAddToCart,
  isSaving,
  productCategory = "generic",
  selectedColor = "#ffffff"
}: PreviewModalProps) {

  // Determine Mode based on Product Category
  const isApparel = productCategory === "Apparel";
  const isMug = productCategory === "Home & Living";
  const isBlank = !isApparel && !isMug; // "Generic" or Blank Canvas mode

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle>
        {/* Increased width to max-w-7xl for a cinematic preview */}
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-0 flex flex-col md:flex-row">

          {/* LEFT: The Stage (Preview Area) */}
          <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden p-10">

            {/* SCENARIO A: APPAREL PREVIEW (Tintable) */}
            {isApparel && (
              <div className="relative w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center shadow-2xl">
                {/* 1. Base Shirt (Tinted with selectedColor) */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})`,
                    backgroundColor: selectedColor,
                    backgroundBlendMode: 'multiply'
                  }}
                />

                {/* 2. User Design */}
                <img
                  src={overlayImage}
                  alt="Design"
                  className="absolute w-[38%] top-[22%] mix-blend-multiply opacity-95"
                  style={{ transform: 'perspective(500px) rotateX(1deg)' }}
                />

                {/* 3. Shadow/Wrinkle Overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-multiply opacity-30"
                  style={{ backgroundImage: `url(${MOCKUP_ASSETS.apparel.base})` }}
                />
              </div>
            )}

            {/* SCENARIO B: MUG PREVIEW (Curved) */}
            {isMug && (
              <div className="relative w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center">
                {/* 1. Mug Base */}
                <img
                  src={MOCKUP_ASSETS.mug.base}
                  className="absolute w-[70%] object-contain drop-shadow-2xl"
                  alt="Mug Base"
                />

                {/* 2. Design (Warped) */}
                <div
                  className="absolute w-[35%] h-[35%] flex items-center justify-center overflow-hidden"
                  style={{
                    top: '32%',
                    borderRadius: '8px 8px 30px 30px',
                    maskImage: 'linear-gradient(to right, transparent 2%, black 15%, black 85%, transparent 98%)'
                  }}
                >
                  <img
                    src={overlayImage}
                    alt="Design"
                    className="w-full h-full object-contain mix-blend-multiply opacity-90"
                  />
                </div>

                {/* 3. Gloss Overlay */}
                <img
                  src={MOCKUP_ASSETS.mug.gloss}
                  className="absolute w-[70%] object-contain pointer-events-none mix-blend-screen opacity-50"
                  alt="Gloss"
                />
              </div>
            )}

            {/* SCENARIO C: BLANK/GENERIC MODE (Just the Design) */}
            {isBlank && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative border-2 border-dashed border-slate-300 bg-[url('https://placehold.co/20x20/eeeeee/ffffff?text=+')] bg-repeat p-4 shadow-sm">
                  <img
                    src={overlayImage}
                    alt="Raw Design"
                    className="max-w-[600px] max-h-[600px] object-contain"
                  />
                </div>
                <p className="text-slate-400 text-sm">Raw Print File Preview</p>
              </div>
            )}

          </div>

          {/* RIGHT: Action Sidebar */}
          <div className="w-full md:w-96 bg-white border-l p-8 flex flex-col z-20 shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Final Review</h2>
                <p className="text-slate-500 text-sm mt-1">Ready to print?</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-100 rounded-full">
                <X size={24} />
              </Button>
            </div>

            {/* Summary Info */}
            <div className="space-y-6 mb-auto">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Product Type</span>
                  <span className="font-semibold text-slate-900">{isApparel ? "Apparel" : isMug ? "Ceramic" : "Custom Print"}</span>
                </div>
                {isApparel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fabric Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: selectedColor }} />
                      <span className="font-semibold text-slate-900 uppercase">{selectedColor}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t">
              <Button variant="outline" className="w-full h-12 text-base font-medium border-slate-300 hover:bg-slate-50 gap-2">
                <Download size={18} /> Download Proof
              </Button>
              <Button
                className="w-full h-14 text-lg font-bold bg-black hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all gap-2"
                onClick={onAddToCart}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
                {isSaving ? "Saving..." : "Add to Cart"}
              </Button>
            </div>
          </div>

        </DialogContent>
      </DialogTitle>
    </Dialog>
  );
}