import { motion } from "framer-motion";
import { Search, Crown, Sparkles, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// FIREBASE IMPORTS
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function DashboardTemplates() {
  
  // State for Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // State for Data
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ["All", "T-Shirts", "Hoodies", "Sportswear", "Kids", "Accessories", "Typography", "Vintage", "Badge"];

  // Fetch Templates from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(results);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching templates:", err);
        setError("Failed to load templates.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtering Logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = (template.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || (template.category || "General") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, templates]);

  // Open in New Tab Logic
  const handleUseTemplate = (template: any) => {
    const url = `/design?templateId=${template.id}`;
    window.open(url, '_blank'); 
  };

  return (
    <div className="space-y-6 md:space-y-8 relative pb-20 p-4 md:p-10 min-h-screen">
      
      {/* Background */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-4 md:gap-6 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
            Designs
          </h1>
          <p className="text-sm md:text-base text-slate-400">Click any template to open it in a new design tab.</p>
        </motion.div>
        
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search templates..."
              className="pl-10 h-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:ring-orange-500/50 focus:border-orange-500/50 rounded-full text-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Category Filter Dropdown (Mobile) */}
          <div className="md:hidden w-full">
             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-slate-800/50 border-white/10 text-slate-200 h-10 rounded-full text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills (Desktop) */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Badge 
              key={cat} 
              variant="outline"
              className={`px-4 py-1.5 md:px-6 md:py-2 text-sm cursor-pointer whitespace-nowrap rounded-full transition-all border ${
                selectedCategory === cat 
                  ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-900/40" 
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="max-w-7xl mx-auto w-full">
        {loading ? (
           // ✅ SKELETON LOADING GRID (Responsive)
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-slate-800/50" />
                  <div className="px-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4 bg-slate-800/50" />
                    <Skeleton className="h-2 w-1/3 bg-slate-800/50" />
                  </div>
                </div>
              ))}
           </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
              onClick={() => handleUseTemplate(template)}
            >
              {/* Minimalist Thumbnail Container */}
              <div className="h-fit rounded-xl bg-slate-800/20 overflow-hidden relative border border-white/5 group-hover:border-orange-500/30 transition-all duration-300">
                 {/* Thumbnail Image */}
                 {template.thumbnailUrl ? (
                     <img 
                       src={template.thumbnailUrl} 
                       alt={template.name}
                       className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                     />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                        <ImageIcon className="text-slate-700 w-10 h-10 md:w-12 md:h-12" />
                    </div>
                 )}
                 
                 {/* Pro Badge */}
                 {(template.isPro || template.tier === "Pro") && (
                   <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-orange-500/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 rounded-full flex items-center gap-1 shadow-sm z-10">
                     <Crown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                     PRO
                   </div>
                 )}
              </div>
              
              {/* Simple Text Below */}
              <div className="mt-2 md:mt-3 px-1">
                <h3 className="font-semibold text-slate-200 truncate text-xs md:text-sm group-hover:text-orange-400 transition-colors">
                    {template.name || "Untitled Template"}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                    {template.category || "General"}
                </p>
              </div>
            </motion.div>
          ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 text-center px-4">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                <ImageIcon className="h-6 w-6 md:h-8 md:w-8 text-slate-500" />
            </div>
            <p className="text-slate-300 text-base md:text-lg font-medium">No templates found</p>
            <Button 
                variant="link" 
                className="text-orange-400 mt-1 md:mt-2"
                onClick={() => {setSearchQuery(""); setSelectedCategory("All");}}
            >
                Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}