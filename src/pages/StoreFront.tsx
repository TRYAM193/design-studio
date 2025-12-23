// src/pages/StoreFront.tsx
import { useBaseProducts } from "@/hooks/use-base-products";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Storefront() {
  const { products, loading } = useBaseProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Hero Section */}
      <div className="bg-white border-b py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900">
            Create Your <span className="text-indigo-600">Custom Look</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
            Premium quality apparel printed on demand. Select a product below to launch the design studio.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="Search hoodies, tees..." 
              className="pl-12 h-14 text-lg shadow-sm rounded-full border-slate-200 focus-visible:ring-indigo-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Product Grid */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading catalog...</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-8 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Featured Collection</h2>
              <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                {filteredProducts.length} Items
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-xl border border-dashed">
                <p className="text-xl text-slate-400">No products found matching "{search}"</p>
                <button 
                  onClick={() => setSearch("")}
                  className="mt-4 text-indigo-600 font-medium hover:underline"
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