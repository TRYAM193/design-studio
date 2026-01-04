import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

// ✅ Define Props to accept control from Parent
interface CartDrawerProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose(false); // Close drawer
    navigate("/checkout?mode=cart");
  };

  const getSymbol = (currency: string) => {
    const symbols: Record<string, string> = { IN: "₹", US: "$", GB: "£", EU: "€", CA: "C$" };
    return symbols[currency] || "$";
  };
  const currencySymbol = items.length > 0 ? getSymbol(items[0].currency) : "₹";

  return (
    // ✅ Controlled Sheet: Uses 'open' and 'onOpenChange'
    <Sheet open={isOpen} onOpenChange={onClose}>
      
      {/* NO <SheetTrigger> here anymore. The Sidebar button is the trigger. */}
      
      <SheetContent className="w-full sm:max-w-md bg-slate-900 border-l border-white/10 text-white flex flex-col z-[100]">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag className="text-orange-500" /> Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
            <ShoppingBag className="w-16 h-16 opacity-20" />
            <p>Your cart is empty.</p>
            <Button variant="outline" onClick={() => { onClose(false); navigate("/"); }} className="border-white/10 text-white hover:bg-white/5">
              Start Designing
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4 mt-8">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-white rounded-md p-2 flex-shrink-0 relative overflow-hidden">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-400 capitalize">{item.variant.color} / {item.variant.size}</p>
                      
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-bold text-orange-400">
                          {getSymbol(item.currency)}{item.price}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 bg-slate-800 rounded-md border border-white/10">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-orange-400"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-orange-400"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-6 space-y-4 bg-slate-900 border-t border-white/10 mt-auto">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total <span className="text-xs font-normal text-slate-400">(Inclusive of taxes)</span></span>
                <span className="text-orange-400">{currencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg shadow-lg shadow-orange-900/20">
                Checkout Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}