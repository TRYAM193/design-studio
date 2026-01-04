import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Pass 'mode=cart' so the checkout page knows to load from Context/Firestore
    navigate("/checkout?mode=cart"); 
  };

  // Default to INR or grab from a global store setting if available
  const currencySymbol = "₹"; 

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse ring-2 ring-[#0f172a]" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-[#0f172a] border-l border-white/10 text-white flex flex-col z-[100] p-0 shadow-2xl">
        <SheetHeader className="px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <SheetTitle className="text-white flex items-center gap-2 text-lg">
            <ShoppingBag className="text-orange-500 h-5 w-5" /> Your Cart 
            <span className="text-slate-500 text-sm font-normal">({cartCount} items)</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-6 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
               <ShoppingBag className="w-10 h-10 opacity-40" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-300">Your cart is empty</p>
              <p className="text-sm mt-1">Looks like you haven't added any designs yet.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/design")} // Redirect to Design Tool
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white mt-4"
            >
              Start Designing
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 group relative">
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-white rounded-lg p-2 flex-shrink-0 relative overflow-hidden border border-white/10">
                      <img src={item.thumbnail} alt={item.productTitle} className="w-full h-full object-contain" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-medium text-sm text-slate-200 line-clamp-2 leading-tight">{item.productTitle}</h4>
                        {/* If you have variantId or logic to decode it, display here */}
                        {item.variantId && <p className="text-xs text-slate-500 mt-1">Variant: {item.variantId}</p>}
                      </div>
                      
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-sm font-bold text-white">
                          {currencySymbol}{item.price}
                        </p>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-3 bg-slate-800 rounded-lg border border-white/5 p-1 h-8">
                          <button 
                             onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                             className="w-6 h-full flex items-center justify-center hover:text-orange-400 text-slate-400 disabled:opacity-30"
                             disabled={item.quantity <= 1}
                          >
                             <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                             className="w-6 h-full flex items-center justify-center hover:text-orange-400 text-slate-400"
                          >
                             <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove Button (Absolute top-right for cleaner look) */}
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="absolute top-0 right-0 p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer Section */}
            <div className="p-6 bg-[#0f172a] border-t border-white/10 space-y-4 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-orange-400">{currencySymbol}{cartTotal.toFixed(2)}</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-green-400 justify-center bg-green-900/10 border border-green-500/10 py-2 rounded-lg">
                 <ShieldCheck className="w-3 h-3" /> Secure Checkout • Free Shipping Included
              </div>

              <Button 
                onClick={handleCheckout} 
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg shadow-lg shadow-orange-900/20 rounded-xl"
              >
                Checkout Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}