import { Link, useNavigate } from "react-router";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { items, removeItem, updateQuantity, cartTotal, isLoading } = useCart();
  const navigate = useNavigate();

  if (isLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading cart...</div>;

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShoppingBag className="text-orange-500" /> Your Cart
        </h1>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
            <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300">Your cart is empty</h2>
            <p className="text-slate-500 max-w-sm">Looks like you haven't added any custom tees yet. Start designing!</p>
            <Link to="/design">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 mt-4 rounded-full px-8">
                Start Designing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- CART ITEMS LIST --- */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <Card className="bg-slate-800/50 border-white/10 overflow-hidden">
                      <CardContent className="p-4 flex gap-4 items-center">
                        {/* Thumbnail */}
                        <div className="h-24 w-24 bg-white rounded-lg p-2 flex-shrink-0">
                          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-contain" />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-slate-200 truncate">{item.title}</h3>
                          <p className="text-slate-400 text-sm">Size: M • Color: Black</p> {/* Placeholder for variants */}
                          <p className="text-orange-400 font-bold mt-1">₹{item.price}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-3">
                           <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-1 border border-white/5">
                             <button onClick={() => updateQuantity(item.id, - 1)} className="p-1 hover:text-white text-slate-400 disabled:opacity-50" disabled={item.quantity <= 1}>
                               <Minus size={16} />
                             </button>
                             <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.id, + 1)} className="p-1 hover:text-white text-slate-400">
                               <Plus size={16} />
                             </button>
                           </div>
                           <button 
                             onClick={() => removeItem(item.id)}
                             className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                           >
                             <Trash2 size={14} /> Remove
                           </button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* --- SUMMARY SIDEBAR --- */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-slate-800/80 backdrop-blur-xl border-white/10 shadow-2xl">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-xl font-bold text-white">Order Summary</h3>
                    
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-green-400">Free</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Tax (18% GST)</span>
                         <span>₹{(cartTotal * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 my-4 pt-4 flex justify-between text-lg font-bold text-white">
                        <span>Total</span>
                        <span>₹{(cartTotal * 1.18).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`/checkout?mode=cart`)}
                      className="w-full h-12 text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-900/20"
                    >
                      Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                      Secure Checkout powered by Stripe/Razorpay
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}