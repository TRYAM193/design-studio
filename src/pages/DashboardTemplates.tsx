import { motion } from "framer-motion";
import { Search, Crown, Filter, Sparkles, Image as ImageIcon } from "lucide-react";
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
import { useNavigate } from "react-router"; 

// IMPORT REAL JSON TEMPLATE
import design001Data from "@/templates/design-001.json";

export default function DashboardTemplates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");

  const categories = ["All", "T-Shirts", "Hoodies", "Sportswear", "Kids", "Accessories"];

  const getCategoryLabel = (cat: string) => {
    const key = `category.${cat.toLowerCase().replace(/[-\s]/g, "")}`;
    if (cat === "T-Shirts") return t("category.tshirts");
    if (cat === "All") return t("category.all");
    return t(key) !== key ? t(key) : cat;
  };

  const templates = [
    { 
      id: "template-001",
      name: "Overthinking Typo", 
      category: "T-Shirts", 
      tier: "Free", 
      image: "/templates/design-001.png", 
      isLocal: true, 
      canvasData: design001Data 
    },
    // Add more templates here...
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      const matchesTier = selectedTier === "All" || template.tier === selectedTier;
      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchQuery, selectedCategory, selectedTier, templates]);

  const handleUseTemplate = (template: any) => {
    navigate('/design', { 
      state: { 
        designToLoad: {
          id: null, 
          name: `${template.name} (Copy)`,
          canvasJSON: template.canvasData
        } 
      } 
    });
  };

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-white flex items-center gap-3"
        >
          <Sparkles className="w-8 h-8 text-orange-400" />
          {t("templates.title")}
        </motion.h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={t("templates.search")}
              className="pl-10 h-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:ring-orange-500/50 focus:border-orange-500/50 rounded-full" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[140px] bg-slate-800/50 border-white/10 text-slate-200 h-10 rounded-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder={t("templates.filterTier")} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                <SelectItem value="All">{t("templates.allTiers")}</SelectItem>
                <SelectItem value="Free">{t("pricing.plan.free")}</SelectItem>
                <SelectItem value="Pro">{t("pricing.plan.pro")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Badge 
              key={cat} 
              variant="outline"
              className={`px-6 py-2 text-sm cursor-pointer whitespace-nowrap rounded-full transition-all border ${
                selectedCategory === cat 
                  ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-900/40" 
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {getCategoryLabel(cat)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
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
              {/* ✅ UPDATED: Removed bg-white, using Dark Glassmorphism */}
              <div className="aspect-[3/4] rounded-2xl bg-slate-800/40 mb-3 overflow-hidden relative border border-white/10 shadow-lg backdrop-blur-sm">
                 <img 
                   src={template.image} 
                   alt={template.name}
                   className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://placehold.co/400x500/1e293b/ffffff?text=Template";
                   }}
                 />
                 
                 {/* Dark Overlay on Hover */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 
                 {template.tier === "Pro" && (
                   <div className="absolute top-2 right-2 bg-orange-500/20 backdrop-blur-md border border-orange-500/50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                     <Crown className="h-3 w-3 text-orange-500" />
                     Pro
                   </div>
                 )}

                 <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                   <Button 
                     size="sm" 
                     className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-lg"
                     onClick={() => handleUseTemplate(template)}
                   >
                     {t("templates.useTemplate")}
                   </Button>
                 </div>
              </div>
              
              <div className="px-1">
                <h3 className="font-bold text-slate-200 truncate">{template.name}</h3>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500">{getCategoryLabel(template.category)}</p>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-800 text-slate-400 border border-white/10">
                    {template.tier}
                    </Badge>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 text-center">
            <ImageIcon className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">{t("templates.noResults")}</p>
            <p className="text-slate-600 text-sm">Try searching for something else.</p>
          </div>
        )}
      </div>
    </div>
  );
}