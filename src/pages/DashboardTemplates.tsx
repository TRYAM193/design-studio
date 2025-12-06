import { motion } from "framer-motion";
import { Search, Crown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardTemplates() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");

  const categories = ["All", "T-Shirts", "Hoodies", "Sportswear", "Kids", "Accessories"];

  // Mock Data
  const templates = [
    { id: 1, name: "Urban Streetwear", category: "T-Shirts", tier: "Free", image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&auto=format&fit=crop&q=60" },
    { id: 2, name: "Vintage 90s", category: "Hoodies", tier: "Pro", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60" },
    { id: 3, name: "Minimalist Logo", category: "T-Shirts", tier: "Free", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60" },
    { id: 4, name: "Sports Team Jersey", category: "Sportswear", tier: "Pro", image: "https://images.unsplash.com/photo-1577210917260-94280f228e87?w=500&auto=format&fit=crop&q=60" },
    { id: 5, name: "Kids Cartoon", category: "Kids", tier: "Free", image: "https://images.unsplash.com/photo-1519238263496-6361937a2717?w=500&auto=format&fit=crop&q=60" },
    { id: 6, name: "Abstract Art", category: "T-Shirts", tier: "Pro", image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&auto=format&fit=crop&q=60" },
    { id: 7, name: "Gym Performance", category: "Sportswear", tier: "Free", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500&auto=format&fit=crop&q=60" },
    { id: 8, name: "Tote Bag Design", category: "Accessories", tier: "Free", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60" },
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      const matchesTier = selectedTier === "All" || template.tier === selectedTier;
      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchQuery, selectedCategory, selectedTier]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t("templates.title")}
        </motion.h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("templates.search")}
              className="pl-10 h-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder={t("templates.filterTier")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("templates.allTiers")}</SelectItem>
                <SelectItem value="Free">{t("pricing.plan.free")}</SelectItem>
                <SelectItem value="Pro">{t("pricing.plan.pro")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Badge 
              key={cat} 
              variant={selectedCategory === cat ? "default" : "secondary"}
              className="px-4 py-2 text-sm cursor-pointer hover:opacity-80 whitespace-nowrap"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-xl bg-secondary mb-3 overflow-hidden relative">
                 <img 
                   src={template.image} 
                   alt={template.name}
                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 
                 {template.tier === "Pro" && (
                   <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                     <Crown className="h-3 w-3 text-yellow-400" />
                     Pro
                   </div>
                 )}

                 <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                   <Button size="sm" className="w-full bg-white text-black hover:bg-white/90">
                     {t("templates.useTemplate")}
                   </Button>
                 </div>
              </div>
              <h3 className="font-medium truncate">{template.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground">{template.category}</p>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  {template.tier}
                </Badge>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t("templates.noResults")}
          </div>
        )}
      </div>
    </div>
  );
}