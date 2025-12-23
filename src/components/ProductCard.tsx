// src/components/ProductCard.tsx
import { BaseProduct } from "@/hooks/use-base-products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: BaseProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    // Navigate to Product Details Page
    navigate(`/product/${product.id}`);
  };

  // Safe Fallback for price
  const displayPrice = product.price || 0;
  
  // Use uploaded image or first mockup
  const displayImage = product.image || product.mockups?.front || "https://placehold.co/400x500?text=No+Image";

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
      onClick={handleViewDetails}
    >
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        <img 
          src={displayImage}
          alt={product.title}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Hover Action */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center bg-gradient-to-t from-black/50 to-transparent">
             <span className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                View Details
             </span>
        </div>
      </div>

      <CardContent className="pt-4 px-4 pb-2">
        <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>
        <p className="text-sm text-slate-500 mt-1 capitalize truncate">
          {product.category || "Apparel"} • {product.options?.colors?.length || 0} Colors
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-2 flex justify-between items-center">
        <span className="font-bold text-lg text-slate-900">${displayPrice.toFixed(2)}</span>
      </CardFooter>
    </Card>
  );
}