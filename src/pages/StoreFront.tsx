import { useBaseProducts } from "@/hooks/use-base-products";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Storefront() {
  const { products, loading } = useBaseProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. Hero Section */}
      <div className="bg-white border-b py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900">
            Create Your <span className="text-primary">Custom Brand</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Premium quality apparel printed on demand. No inventory, just creativity. 
            Pick a product below to start designing.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search products (e.g. Hoodie, Crop Top)..." 
              className="pl-10 h-12 text-lg shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Product Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading catalog...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <span className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No products found matching "{search}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}