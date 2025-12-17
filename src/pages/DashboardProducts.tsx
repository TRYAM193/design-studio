import { motion } from "framer-motion";
import { Filter, Search, ShoppingBag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";

interface UserProduct {
  id: string;
  title: string;
  category: string;
  price_inr: number;
  thumbnail: string;
  status: string;
}

export default function DashboardProducts() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Real State
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 2000]); // Increased range for INR
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- FETCH REAL PRODUCTS ---
  useEffect(() => {
    async function fetchUserDesigns() {
      if (!user) return;

      try {
        const designsRef = collection(db, `users/${user.uid}/designs`);
        const q = query(designsRef, orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);

        const fetchedData: UserProduct[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled Design",
            category: data.product_type || "Apparel",
            price_inr: data.pricing?.inr || 0,
            thumbnail: data.preview_url || "",
            status: "Active" // Default for now
          };
        });

        setProducts(fetchedData);
      } catch (error) {
        console.error("Error fetching designs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDesigns();
  }, [user]);

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice =
        product.price_inr >= priceRange[0] && product.price_inr <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [searchQuery, selectedCategory, priceRange, products]);

  const getCategoryLabel = (cat: string) => cat; // Simplified for now

  return (
    <div className="space-y-6">
      {/* Header with New Product Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("products.title")}</h1>
        <ProductSelector />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("products.searchPlaceholder")}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("products.filter")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">{t("products.filter")}</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your product list
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="mens_cotton_tee">T-Shirts</SelectItem>
                    <SelectItem value="unisex_hoodie">Hoodies</SelectItem>
                    <SelectItem value="womens_crop_top">Crop Tops</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Price Range (₹{priceRange[0]} - ₹{priceRange[1]})</Label>
                <Slider
                  defaultValue={[0, 2000]}
                  max={2000}
                  step={10}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSelectedCategory("All");
                  setPriceRange([0, 2000]);
                  setSearchQuery("");
                  setIsFilterOpen(false);
                }}
              >
                Reset Filters
              </Button>
            </div>
            </PopoverContent>
        </Popover>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-secondary/30 m-1 rounded-lg overflow-hidden relative flex items-center justify-center">
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.title} className="object-cover w-full h-full" />
                  ) : (
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium line-clamp-1">{product.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {product.category.replace(/_/g, " ")}
                      </p>
                    </div>
                    <span className="font-semibold text-sm">₹{product.price_inr}</span>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {product.status}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border border-dashed">
              <div className="flex flex-col items-center gap-3">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-medium text-lg">No designs found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-4">
                  You haven't created any products yet. Click the button below to start designing.
                </p>
                <ProductSelector />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}