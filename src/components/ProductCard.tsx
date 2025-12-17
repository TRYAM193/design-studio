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
    navigate(`/product/${product.id}`);
  };

  const isOutOfStock = product.stock_status === 'out_of_stock';
  
  // Safe Fallback: If price is missing or 0, show a default starting price
  const displayPrice = product.price_inr && product.price_inr > 0 ? product.price_inr : 499;

  return (
    <Card 
      className={cn(
        "group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300",
        isOutOfStock && "opacity-75 grayscale"
      )}
      onClick={handleViewDetails}
    >
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        <img 
          src={product.image || "https://placehold.co/400x500?text=Product"} 
          alt={product.title}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1 font-bold tracking-wide">
              SOLD OUT
            </Badge>
          </div>
        )}
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
        <span className="font-bold text-lg text-slate-900">₹{displayPrice}</span>
        
        <span className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
          View Details →
        </span>
      </CardFooter>
    </Card>
  );
}