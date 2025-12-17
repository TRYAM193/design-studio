import { motion } from "framer-motion";
import { Filter, Plus, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { ProductSelector } from "@/components/ProductSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardProducts() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const products = [
    { name: "Classic Cotton Tee", category: "T-Shirts", color: "White", price: "$15", stock: "In Stock" },
    { name: "Premium V-Neck", category: "T-Shirts", color: "Black", price: "$22", stock: "Low Stock" },
    { name: "Heavyweight Hoodie", category: "Hoodies", color: "Heather Grey", price: "$45", stock: "In Stock" },
    { name: "Performance Polo", category: "Polos", color: "Navy", price: "$30", stock: "In Stock" },
    { name: "Long Sleeve Crew", category: "Long Sleeve", color: "Charcoal", price: "$25", stock: "Out of Stock" },
    { name: "Ringer Tee", category: "T-Shirts", color: "White/Red", price: "$18", stock: "In Stock" },
    { name: "Oversized Street Tee", category: "Oversized", color: "Beige", price: "$35", stock: "In Stock" },
    { name: "Zip-Up Hoodie", category: "Hoodies", color: "Black", price: "$55", stock: "Low Stock" },
  ];

  const categories = ["All", "T-Shirts", "Hoodies", "Oversized", "Polos", "Long Sleeve"];

  const getCategoryLabel = (cat: string) => {
    const key = `category.${cat.toLowerCase().replace(/[-\s]/g, "")}`;
    // Special case mapping if needed, or ensure keys match
    if (cat === "T-Shirts") return t("category.tshirts");
    if (cat === "Long Sleeve") return t("category.longsleeve");
    if (cat === "All") return t("category.all");
    return t(key) !== key ? t(key) : cat;
  };

  const getStockLabel = (stock: string) => {
    switch (stock) {
      case "In Stock": return t("products.inStock");
      case "Low Stock": return t("products.lowStock");
      case "Out of Stock": return t("products.outOfStock");
      default: return stock;
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const price = parseInt(product.price.replace("$", ""));
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [searchQuery, selectedCategory, priceRange, products]);

  const activeFiltersCount = (selectedCategory !== "All" ? 1 : 0) + (priceRange[0] !== 0 || priceRange[1] !== 100 ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory("All");
    setPriceRange([0, 100]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            {t("products.title")}
          </motion.h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("products.addProduct")}
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("products.search")}
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant={activeFiltersCount > 0 ? "secondary" : "outline"} className="gap-2">
                <Filter className="h-4 w-4" />
                {t("products.filters")}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">{t("products.filters")}</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={clearFilters}>
                      {t("products.clearAll")}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>{t("products.category")}</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("products.priceRange")}</Label>
                    <span className="text-xs text-muted-foreground">${priceRange[0]} - ${priceRange[1]}</span>
                  </div>
                  <Slider
                    defaultValue={[0, 100]}
                    value={priceRange}
                    max={100}
                    step={1}
                    onValueChange={setPriceRange}
                    className="py-4"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory !== "All" || priceRange[0] !== 0 || priceRange[1] !== 100) && (
          <div className="flex gap-2">
            {selectedCategory !== "All" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                {getCategoryLabel(selectedCategory)}
                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => setSelectedCategory("All")}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(priceRange[0] !== 0 || priceRange[1] !== 100) && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                ${priceRange[0]} - ${priceRange[1]}
                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => setPriceRange([0, 100])}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, i) => (
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
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(product.category)} • {product.color}</p>
                </div>
                <span className="font-semibold">{product.price}</span>
              </div>
              <div className="mt-2">
                <Badge variant={product.stock === "Out of Stock" ? "destructive" : "secondary"}>
                  {getStockLabel(product.stock)}
                </Badge>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t("products.noResults")}
          </div>
        )}
      </div>
    </div>
  );
}