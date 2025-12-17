import { useBaseProducts } from "@/hooks/use-base-products";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProductSelector() {
  const { products, loading } = useBaseProducts();
  const navigate = useNavigate();

  const handleSelect = (productId: string) => {
    // Navigate to the editor with the selected product ID
    navigate(`/design/new?product=${productId}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Design
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Base Product</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-10">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {products.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelect(product.id)}>
                <CardHeader>
                  <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center relative overflow-hidden">
                     {/* Placeholder visual - ideally replace with real image URLs later */}
                     <img src="/assets/design-001.jpeg" className="object-cover opacity-50" alt={product.title} />
                     <span className="absolute text-xs font-bold bg-white px-2 py-1 rounded shadow">
                       From ₹{product.base_cost_inr}
                     </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.colors.length} Colors Available
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="secondary">Select</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}