import { BaseProduct } from "@/hooks/use-base-products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paintbrush, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: BaseProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  
  // Logic: Is it out of stock?
  const isOutOfStock = product.stock_status === 'out_of_stock';

  const sellingPrice = product.base_cost_inr + 300;

  const handleCustomize = () => {
    if (isOutOfStock) return; // Prevent click
    navigate(`/design/new?product=${product.id}`);
  };

  return (
    <Card className={cn(
      "group overflow-hidden border-none shadow-sm transition-all duration-300",
      isOutOfStock ? "opacity-75 grayscale" : "hover:shadow-xl" // Grey out if sold out
    )}>
      <div 
        className="relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer" 
        onClick={handleCustomize}
      >
        <img 
          src={product.image} 
          alt={product.title}
          className={cn(
            "object-cover w-full h-full transition-transform duration-500",
            !isOutOfStock && "group-hover:scale-105"
          )}
        />

        {/* OUT OF STOCK OVERLAY */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-black/70 text-white px-4 py-2 rounded-md font-bold uppercase tracking-widest text-sm backdrop-blur-sm">
              Sold Out
            </div>
          </div>
        )}

        {/* Normal Hover Action (Only if in stock) */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" className="font-semibold gap-2">
              <Paintbrush className="w-4 h-4" /> Customize
            </Button>
          </div>
        )}
      </div>

      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{product.title}</h3>
            <p className="text-sm text-muted-foreground">
              {product.colors.length} Colors Available
            </p>
          </div>
          
          {/* Price Badge or Status Badge */}
          {isOutOfStock ? (
            <Badge variant="destructive" className="font-bold">
              No Stock
            </Badge>
          ) : (
            <Badge variant="outline" className="text-base font-bold border-primary text-primary">
              ₹{sellingPrice}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pb-4 pt-0">
        <Button 
          onClick={handleCustomize} 
          disabled={isOutOfStock} // DISABLE BUTTON
          className="w-full font-bold text-md h-11"
          variant={isOutOfStock ? "secondary" : "default"}
        >
          {isOutOfStock ? (
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Unavailable
            </span>
          ) : (
            "Start Designing"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}