import { BaseProduct } from "@/hooks/use-base-products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paintbrush } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: BaseProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  // Simple logic: Base Cost + ₹300 Profit Margin
  const sellingPrice = product.base_cost_inr + 300;

  const handleCustomize = () => {
    navigate(`/design/new?product=${product.id}`);
  };

  return (
    <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer" onClick={handleCustomize}>
        
        {/* LAYER 1: The Base Image (Model/Blank) */}
        {/* We use a placeholder if no image exists in DB */}
        <img 
          src={product.image && product.image.startsWith('http') ? product.image : "/assets/design-001.jpeg"} 
          alt={product.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        {/* LAYER 2: The Design Overlay (Future Feature) */}
        {/* This div is where we will inject the user's logo later */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           {/* <img src={userDesignUrl} className="w-[40%] opacity-90" /> */}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" className="font-semibold gap-2">
            <Paintbrush className="w-4 h-4" /> Customize
          </Button>
        </div>
      </div>

      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{product.title}</h3>
            <p className="text-sm text-muted-foreground">
              {product.colors.length} Colors Available
            </p>
          </div>
          <Badge variant="outline" className="text-base font-bold border-primary text-primary">
            ₹{sellingPrice}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pb-4 pt-0">
        <Button onClick={handleCustomize} className="w-full font-bold text-md h-11">
          Start Designing
        </Button>
      </CardFooter>
    </Card>
  );
}