// src/pages/StoreFront.tsx
import { useBaseProducts } from "@/hooks/use-base-products";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Storefront() {
  const { products, loading } = useBaseProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen relative font-sans selection:bg-orange-500 selection:text-white">
       
       {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
       <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* 1. Hero Section */}
      <div className="relative pt-24 pb-16 px-4">
        <div className="container mx-auto text-center space-y-6">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(234,88,12,0.2)]"
          >
              <Sparkles className="w-3 h-3" /> New Collection
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl"
          >
            Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Custom Look</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Premium quality apparel printed on demand. Select a product below to launch the design studio.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto relative mt-10"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="Search hoodies, tees..." 
              className="pl-12 h-14 text-lg shadow-xl rounded-full bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-orange-500 focus-visible:border-orange-500 backdrop-blur-md transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
        </div>
      </div>

      {/* 2. Product Grid */}
      <div className="container mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-slate-400 font-medium">Loading catalog...</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white">Featured Collection</h2>
              <span className="text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {filteredProducts.length} Items
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-slate-800/30 rounded-3xl border border-dashed border-white/10">
                <p className="text-xl text-slate-400">No products found matching "{search}"</p>
                <button 
                  onClick={() => setSearch("")}
                  className="mt-4 text-orange-500 font-medium hover:text-orange-400 hover:underline transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}