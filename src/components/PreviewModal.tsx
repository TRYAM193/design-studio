import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImage: string;    // The shirt/model image
  overlayImage: string; // The user's design (transparent PNG)
  onAddToCart: () => void;
  isSaving: boolean;
}

export function PreviewModal({ 
  isOpen, onClose, baseImage, overlayImage, onAddToCart, isSaving 
}: PreviewModalProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Preview Your Design</DialogTitle>
        </DialogHeader>
        
        {/* THE MOCKUP VIEW */}
        <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden border">
          {/* 1. Base Image (The Model) */}
          <img 
            src={baseImage} 
            alt="Base Product" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* 2. Overlay (The User's Design) */}
          {/* We position it absolutely to match where the canvas was. 
              You might need to adjust 'top'/'width' based on your Editor's layout ratio. 
          */}
          <img 
            src={overlayImage} 
            alt="Design Overlay" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ 
              // Refine this if your canvas is only on the chest area
              // For now, full overlay works if canvas covered the whole image
            }}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Keep Editing
          </Button>
          <Button 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700" 
            onClick={onAddToCart}
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}