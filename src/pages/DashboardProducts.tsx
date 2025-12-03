import { motion } from "framer-motion";
import { Filter, Plus, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardProducts() {
  const products = [
    { name: "Classic Cotton Tee", color: "White", price: "$15", stock: "In Stock" },
    { name: "Premium V-Neck", color: "Black", price: "$22", stock: "Low Stock" },
    { name: "Heavyweight Hoodie", color: "Heather Grey", price: "$45", stock: "In Stock" },
    { name: "Performance Polo", color: "Navy", price: "$30", stock: "In Stock" },
    { name: "Long Sleeve Crew", color: "Charcoal", price: "$25", stock: "Out of Stock" },
    { name: "Ringer Tee", color: "White/Red", price: "$18", stock: "In Stock" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            Products
          </motion.h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-10" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="aspect-square rounded-xl bg-secondary mb-3 overflow-hidden relative flex items-center justify-center">
               <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
               <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.color}</p>
              </div>
              <span className="font-semibold">{product.price}</span>
            </div>
            <div className="mt-2">
              <Badge variant={product.stock === "Out of Stock" ? "destructive" : "secondary"}>
                {product.stock}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
