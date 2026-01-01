import { motion } from "framer-motion";
import { ArrowRight, Clock, Store, Sparkles, Crown, Zap, Flame, Moon } from "lucide-react";
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
    // Add more templates as needed
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
    <div className="space-y-12 pb-20 relative">
       {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
       <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Hero Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            {t("dashboard.welcome")}, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
              {user?.displayName?.split(" ")[0] || "Creator"}
            </span>
          </motion.h1>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-slate-300">
             <Moon className="w-4 h-4 text-slate-400" />
             <span>Moon Phase: Waxing</span>
          </div>
        </div>
        
        {/* ✅ HERO CTA: PREMIUM STORE CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        >
           {/* Card Background */}
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-[#1a2035] to-slate-900" />
           
           {/* Glow Effects */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-all duration-700" />
           
           <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-6 max-w-xl">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                    <Flame className="w-3 h-3" /> Trending Now
                 </div>
                 <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    Explore the <span className="text-blue-300">Cosmic Collection</span>
                 </h2>
                 <p className="text-slate-400 text-lg">
                    Premium hoodies, oversized tees, and accessories ready for your custom touch.
                 </p>
                 
                 <Link to="/store">
                    {/* THE "SAFFRON" BUTTON STYLE */}
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-[0_0_30px_rgba(234,88,12,0.3)] hover:shadow-[0_0_50px_rgba(234,88,12,0.5)] hover:-translate-y-1 transition-all duration-300 border-0 group/btn">
                       <Store className="mr-3 h-5 w-5" />
                       Browse Catalog
                    </Button>
                 </Link>
              </div>

              {/* Decorative Icon */}
              <div className="hidden md:block relative">
                 <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                 <Store className="w-32 h-32 text-slate-700 relative z-10 opacity-50 rotate-12 group-hover:rotate-0 transition-all duration-700" />
              </div>
           </div>
        </motion.div>
      </section>

      {/* Main Content Area */}
      {isAuthenticated ? (
         <div className="space-y-12">
           
          {/* Recent Projects Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                {t("dashboard.recent")}
              </h2>
              <Link to="/dashboard/projects">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2">
                  {t("dashboard.viewAll")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {designsLoading ? (
                 [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[280px] bg-slate-800/50 animate-pulse rounded-2xl border border-white/5" />
                 ))
              ) : designs.length > 0 ? (
                designs.slice(0, 4).map((design) => (
                  <Link key={design.id} to={`/design?designId=${design.id}`}>
                    <Card className="group cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 transition-all overflow-hidden border border-white/10 bg-slate-800/40 backdrop-blur-md rounded-2xl">
                      <div className="aspect-square bg-slate-900/50 relative flex items-center justify-center overflow-hidden p-4">
                        {design.imageData ? (
                          <img src={design.imageData} alt={design.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="p-4 bg-white/5 rounded-full">
                             <Zap className="h-8 w-8 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                           <span className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold">Edit</span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-slate-200 truncate">{design.name || t("dashboard.untitled")}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                             {design.createdAt?.seconds 
                               ? new Date(design.createdAt.seconds * 1000).toLocaleDateString() 
                               : "Just now"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                  <p className="text-slate-400 mb-6">No recent designs found in the void.</p>
                  <Link to="/design">
                    <Button variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">Create your first design</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Featured Templates Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                {t("templates.title") || "Featured Templates"}
              </h2>
              <Link to="/dashboard/templates">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
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
                  <div className="aspect-[3/4] rounded-2xl bg-slate-800/50 mb-3 overflow-hidden relative border border-white/10 shadow-lg">
                     <img 
                       src={template.image} 
                       alt={template.name}
                       className="w-full h-full object-contain p-4 bg-slate-900/50 transition-transform duration-500 group-hover:scale-105"
                       onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x500/1e293b/ffffff?text=Template"; }}
                     />
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     
                     {template.tier === "Pro" && (
                       <div className="absolute top-2 right-2 bg-orange-500/20 backdrop-blur-md border border-orange-500/50 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                         <Crown className="h-3 w-3" /> Pro
                       </div>
                     )}

                     <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                       <Button 
                         size="sm" 
                         className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold"
                         onClick={() => handleUseTemplate(template)}
                       >
                         Use Template
                       </Button>
                     </div>
                  </div>
                  <h3 className="font-medium text-slate-200 truncate px-1">{template.name}</h3>
                  <p className="text-xs text-slate-500 px-1">{template.category}</p>
                </motion.div>
              ))}
            </div>
          </section>

         </div>
      ) : (
        <section className="bg-slate-800/30 border border-white/5 rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">{t("dashboard.startFree")}</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {t("dashboard.startDesc")}
          </p>
          <Link to="/store">
             <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8">
               Go to Catalog
             </Button>
          </Link>
        </section>
      )}
    </div>
  );
}