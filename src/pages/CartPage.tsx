import { motion } from "framer-motion";
import { ShoppingBag, Trash2, ArrowRight, Minus, Plus, Sparkles, Store, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link, useNavigate } from "react-router"; 
import { useTranslation } from "@/hooks/use-translation"; // Optional if you have translations for cart

export default function CartPage() {
  const { items, removeItem, updateQuantity, cartTotal, clearCart, isLoading } = useCart();
  const navigate = useNavigate();
  // const { t } = useTranslation(); 

  // Helper for currency symbol
  const getSymbol = (currency: string) => {
    const symbols: Record<string, string> = { IN: "₹", US: "$", GB: "£", EU: "€" };
    return symbols[currency] || "$";
  };

  const currencySymbol = items.length > 0 ? getSymbol(items[0].currency) : "₹";

  if (isLoading) return null;

  return (
    <div className="space-y-8 pb-20 relative px-2 sm:px-0 font-sans text-slate-200">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME (Consistent with DashboardHome) */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-orange-400" />
            Your Cart
            <span className="text-lg font-medium text-slate-500 self-end mb-1">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </motion.div>

        {items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
             <Button 
                variant="ghost" 
                onClick={clearCart} 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
             >
                <Trash2 className="h-4 w-4" /> Clear All
             </Button>
          </motion.div>
        )}
      </div>

      {items.length === 0 ? (
        // ✅ EMPTY STATE (Styled like DashboardProjects empty state)
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 text-center"
        >
          <div className="h-20 w-20 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-lg shadow-black/20">
             <ShoppingBag className="h-10 w-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-400 max-w-sm mb-8">
            Looks like you haven't started your cosmic collection yet.
          </p>
          <Link to="/store">
            <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-900/40 border-0">
               <Store className="mr-2 h-5 w-5" /> Browse Catalog
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ✅ LEFT: Cart Items (Glassmorphism Cards) */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col sm:flex-row gap-4 p-4 hover:border-white/20 transition-all duration-300"
              >
                {/* Image */}
                <div className="w-full sm:w-32 h-32 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-1">
                   <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-slate-100 line-clamp-1 group-hover:text-blue-300 transition-colors">
                          {item.title}
                        </h3>
                        <div className="text-lg font-bold text-orange-400">
                          {getSymbol(item.currency)}{item.price.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-slate-700/50 border border-white/5 px-2 py-1 rounded text-xs text-slate-300 uppercase font-medium">
                          Size: {item.variant.size}
                        </span>
                        <span className="bg-slate-700/50 border border-white/5 px-2 py-1 rounded text-xs text-slate-300 uppercase font-medium">
                           {item.variant.color}
                        </span>
                      </div>
                   </div>

                   <div className="flex justify-between items-end mt-4 sm:mt-0">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-1 bg-slate-900/80 rounded-lg border border-white/10 p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                         onClick={() => removeItem(item.id)}
                         className="text-slate-500 hover:text-red-500 text-sm flex items-center gap-1.5 transition-colors px-2 py-1"
                      >
                         <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ✅ RIGHT: Order Summary (Sticky Panel) */}
          <div className="lg:col-span-1">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="sticky top-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <CreditCard className="w-5 h-5 text-blue-400" /> Summary
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white">{currencySymbol} {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Free
                  </span>
                </div>
                
                <div className="h-px bg-white/10 my-4" />
                
                <div className="flex justify-between items-end">
                  <span className="text-slate-200 font-medium">Total</span>
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                     {currencySymbol} {cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg shadow-lg shadow-orange-900/40 border-0 rounded-xl"
                    onClick={() => navigate("/checkout?mode=cart")}
                  >
                    Checkout <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <p className="text-center text-[10px] text-slate-500 mt-3">
                    Secured by Stripe. 30-day money-back guarantee.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      )}
    </div>
  );
}