import { motion } from "framer-motion";
import { ArrowRight, Clock, Shirt, Store, Sparkles, Crown, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "@/hooks/use-translation";
import { useUserDesigns } from "@/hooks/use-user-designs";
import design001Data from "@/templates/design-001.json";

export default function DashboardHome() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { designs, loading: designsLoading } = useUserDesigns(user?.uid);

  // Featured Templates Data
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
    { 
      id: "template-002",
      name: "Urban Streetwear", 
      category: "Hoodies", 
      tier: "Pro", 
      image: "https://placehold.co/400x500/18181b/ffffff?text=Urban+Hoodie", 
      isLocal: false, 
      canvasData: null 
    },
  ];

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
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION: The "Studio Entry" */}
      <section className="relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900">
                {t("dashboard.welcome")}, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-black">
                  {user?.displayName?.split(" ")[0] || "Creator"}
                </span>
              </h1>
              <p className="text-slate-500 mt-2 text-lg">Ready to create your next masterpiece?</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex gap-3"
            >
               <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-sm text-slate-600">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Pro Member</span>
               </div>
            </motion.div>
        </div>

        {/* The "Magical" Entry Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200"
        >
          <Link to="/store">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-zinc-800 to-slate-900 transition-transform duration-700 group-hover:scale-105" />
            
            {/* Animated Mesh Gradient Overlay */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] rounded-full bg-white/10 blur-[100px] animate-[pulse_8s_infinite]" />
                <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[120%] rounded-full bg-indigo-500/20 blur-[120px] animate-[pulse_6s_infinite]" />
            </div>

            <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="max-w-xl space-y-6 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-medium uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> New Collection Live
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                    Start a New <br/>
                    <span className="text-indigo-300">Apparel Line</span>
                  </h2>
                  <p className="text-slate-300 text-lg md:text-xl font-light">
                    Choose from premium heavy-weight tees, hoodies, and more. 
                    Customize with AI and print on demand.
                  </p>
                  <Button size="lg" className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-indigo-50 font-bold shadow-xl transition-all hover:scale-105">
                    <Store className="w-5 h-5 mr-2" /> Browse Catalog
                  </Button>
               </div>

               {/* Decorative Visual */}
               <div className="relative w-64 h-64 md:w-80 md:h-80 hidden md:block">
                  <div className="absolute inset-0 bg-white/5 rounded-full backdrop-blur-3xl animate-pulse" />
                  <img 
                    src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                    alt="Create" 
                    className="w-full h-full object-contain drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform duration-700"
                  />
               </div>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* 2. RECENT DESIGNS SECTION */}
      {isAuthenticated && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-400" />
              Continue Designing
            </h3>
            <Link to="/dashboard/projects">
              <Button variant="ghost" className="text-slate-500 hover:text-slate-900">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {designsLoading ? (
               [1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-slate-100 animate-pulse rounded-2xl" />
               ))
            ) : designs.length > 0 ? (
              designs.slice(0, 4).map((design, i) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/design?designId=${design.id}`}>
                    <Card className="group h-full cursor-pointer hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 border-none bg-white ring-1 ring-slate-100 overflow-hidden rounded-2xl">
                      <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-6 overflow-hidden">
                        {design.imageData ? (
                          <img src={design.imageData} alt={design.name} className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Shirt className="h-16 w-16 text-slate-200" />
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                           <Button variant="secondary" size="sm" className="font-bold rounded-full">Edit Design</Button>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h4 className="font-bold text-slate-900 truncate">{design.name || "Untitled Project"}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                           Edited {design.createdAt?.seconds 
                             ? new Date(design.createdAt.seconds * 1000).toLocaleDateString() 
                             : "Just now"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                   <Palette className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium mb-4">You haven't started any designs yet.</p>
                <Link to="/store">
                  <Button variant="outline" className="rounded-full">Start Your First Project</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. TEMPLATES SHOWCASE */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Trending Templates
          </h3>
          <Link to="/dashboard/templates">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900">Explore</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-2xl bg-white ring-1 ring-slate-100 mb-3 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                 <img 
                   src={template.image} 
                   alt={template.name}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                   onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x500?text=Preview"; }}
                 />
                 
                 {/* Gradient Overlay on Hover */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 
                 {template.tier === "Pro" && (
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                     <Crown className="h-3 w-3 text-amber-500" /> PRO
                   </div>
                 )}

                 <div className="absolute bottom-4 left-4 right-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                   <Button 
                     size="sm" 
                     className="w-full bg-white text-black hover:bg-slate-100 font-bold rounded-full"
                     onClick={() => handleUseTemplate(template)}
                   >
                     Use Template
                   </Button>
                 </div>
              </div>
              
              <div className="px-1">
                <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{template.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}