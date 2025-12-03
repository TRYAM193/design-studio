import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardTemplates() {
  const categories = ["All", "T-Shirts", "Hoodies", "Sportswear", "Kids", "Accessories"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Templates
        </motion.h1>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-10 h-12 text-base" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Badge 
              key={cat} 
              variant={cat === "All" ? "default" : "secondary"}
              className="px-4 py-2 text-sm cursor-pointer hover:opacity-80"
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-xl bg-secondary mb-3 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-medium">Graphic Tee {i + 1}</h3>
            <p className="text-sm text-muted-foreground">Streetwear</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}