import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Pencil, LogIn, Heart, RotateCcw } from "lucide-react"; 
import { useNavigate } from "react-router";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, savedItems, removeItem, updateQuantity, saveForLater, moveToCart, removeSavedItem, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleCheckout = () => {
    setOpen(false);
    navigate("/checkout?mode=cart"); 
  };

  const handleEdit = (cartItemId: string) => {
    setOpen(false);
    navigate(`/design?editCartId=${cartItemId}`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
             <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                <LogIn className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold">Sign in to view cart</h3>
             <Button onClick={() => { setOpen(false); navigate("/auth"); }} className="w-full bg-orange-600 hover:bg-orange-700">
               Sign In / Sign Up
             </Button>
          </div>
        ) : (
          items.length === 0 && savedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-6 text-center">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <Button variant="outline" onClick={() => { setOpen(false); navigate("/design"); }} className="border-orange-500/30 text-orange-400">
                Start Designing
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                 {/* === ACTIVE CART ITEMS === */}
                 <div className="space-y-6">
                   {items.map((item) => (
                      <div key={item.id} className="flex gap-4 group relative bg-slate-900/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        
                        <div className="w-20 h-24 bg-white rounded-lg p-2 flex-shrink-0 border border-white/10">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div>
                            <div className="flex justify-between items-start pr-8">
                                <h4 className="font-medium text-sm text-slate-200 line-clamp-1">{item.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{item.variant.color} / {item.variant.size}</p>
                          </div>
                          
                          <div className="flex justify-between items-end mt-2">
                            <p className="text-sm font-bold text-white">₹{item.price}</p>
                            
                            <div className="flex items-center gap-2">
                                {/* SAVE FOR LATER BUTTON */}
                                <button 
                                  onClick={() => saveForLater(item.id)} 
                                  className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-400 mr-2"
                                  title="Save for Later"
                                >
                                   <Heart className="w-3.5 h-3.5" /> Save
                                </button>

                                <div className="flex items-center gap-3 bg-slate-800 rounded-lg border border-white/5 p-1 h-7">
                                   <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-full flex items-center justify-center hover:text-orange-400"><Minus className="w-3 h-3" /></button>
                                   <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-full flex items-center justify-center hover:text-orange-400"><Plus className="w-3 h-3" /></button>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <button 
                              onClick={() => removeItem(item.id)} 
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleEdit(item.id)} 
                              className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                              title="Edit Design"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      </div>
                   ))}
                 </div>

                 {/* === SAVED FOR LATER SECTION === */}
                 {savedItems.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Separator className="flex-1 bg-white/10" />
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saved for Later ({savedItems.length})</span>
                            <Separator className="flex-1 bg-white/10" />
                        </div>
                        
                        <div className="space-y-4 opacity-75">
                            {savedItems.map((item) => (
                                <div key={item.id} className="flex gap-4 p-2 rounded-lg border border-dashed border-white/10 hover:border-white/20 transition-colors">
                                    <div className="w-16 h-16 bg-white rounded-md p-1 flex-shrink-0 grayscale">
                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-xs text-slate-300 line-clamp-1">{item.title}</h4>
                                        <p className="text-[10px] text-slate-500 mb-2">{item.variant.color} / {item.variant.size} • ₹{item.price}</p>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => moveToCart(item.id)}
                                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Move to Cart
                                            </button>
                                            <button 
                                                onClick={() => removeSavedItem(item.id)}
                                                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

              </ScrollArea>
              
              <div className="p-6 bg-[#0f172a] border-t border-white/10 space-y-4 shadow-2xl z-10">
                 <div className="flex justify-between items-center text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-orange-400">₹{cartTotal.toFixed(2)}</span>
                 </div>
                 <Button onClick={handleCheckout} className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 font-bold text-lg rounded-xl">
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