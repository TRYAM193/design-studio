import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth"; // ✅ Need auth check
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, LogIn } from "lucide-react";
import { useNavigate } from "react-router";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/checkout?mode=cart"); 
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && user && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse ring-2 ring-[#0f172a]" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-[#0f172a] border-l border-white/10 text-white flex flex-col z-[100] p-0 shadow-2xl">
        <SheetHeader className="px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <SheetTitle className="text-white flex items-center gap-2 text-lg">
            <ShoppingBag className="text-orange-500 h-5 w-5" /> Your Cart 
          </SheetTitle>
        </SheetHeader>

        {/* ✅ GUEST VIEW */}
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
             <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                <LogIn className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold">Sign in to view cart</h3>
             <p className="text-slate-400 text-sm max-w-xs">
               Save your designs and access your cart from any device, anytime.
             </p>
             <Button onClick={() => navigate("/auth")} className="w-full bg-orange-600 hover:bg-orange-700">
               Sign In / Sign Up
             </Button>
          </div>
        ) : (
        /* ✅ LOGGED IN VIEW (Existing Logic) */
          items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-6 text-center">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <Button variant="outline" onClick={() => navigate("/design")} className="border-orange-500/30 text-orange-400">
                Start Designing
              </Button>
            </div>
          ) : (
            <>
              {/* List of Items */}
              <ScrollArea className="flex-1 px-6 py-4">
                 <div className="space-y-6">
                   {items.map((item) => (
                      <div key={item.id} className="flex gap-4 group relative">
                        {/* Thumbnail */}
                        <div className="w-20 h-24 bg-white rounded-lg p-2 flex-shrink-0 border border-white/10">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-medium text-sm text-slate-200 line-clamp-2">{item.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{item.variant.color} / {item.variant.size}</p>
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="text-sm font-bold text-white">₹{item.price}</p>
                            <div className="flex items-center gap-3 bg-slate-800 rounded-lg border border-white/5 p-1 h-8">
                               <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-full flex items-center justify-center hover:text-orange-400"><Minus className="w-3 h-3" /></button>
                               <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-full flex items-center justify-center hover:text-orange-400"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="absolute top-0 right-0 p-1.5 text-slate-600 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   ))}
                 </div>
              </ScrollArea>
              
              {/* Footer */}
              <div className="p-6 bg-[#0f172a] border-t border-white/10 space-y-4 shadow-2xl z-10">
                 <div className="flex justify-between items-center text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-orange-400">₹{cartTotal.toFixed(2)}</span>
                 </div>
                 <Button onClick={handleCheckout} className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 font-bold text-lg">
                    Checkout Now <ArrowRight className="w-5 h-5 ml-2" />
                 </Button>
              </div>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}