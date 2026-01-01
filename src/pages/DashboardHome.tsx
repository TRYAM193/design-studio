import { motion } from "framer-motion";
import { ArrowRight, Clock, Shirt, Store, Sparkles, Crown } from "lucide-react"; // Removed Plus
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "@/hooks/use-translation";
import { useUserDesigns } from "@/hooks/use-user-designs";

// Import Template Data
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
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          {t("dashboard.welcome")}, {user?.displayName?.split(" ")[0] || "Creator"}!
        </motion.h1>
        
        {/* ✅ REPLACED QUICK ACTIONS WITH SINGLE STORE NAVIGATION */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/store">
            <Button 
              size="lg" 
              className="h-16 px-8 text-lg font-medium shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-[1.02]"
            >
              <Store className="mr-3 h-6 w-6" />
              Browse Store Catalog
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Main Content Area */}
      {isAuthenticated ? (
         <div className="space-y-12">
           
          {/* Recent Projects Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {t("dashboard.recent")}
              </h2>
              <Link to="/dashboard/projects">
                <Button variant="ghost" className="gap-2">
                  {t("dashboard.viewAll")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {designsLoading ? (
                 [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[250px] bg-secondary animate-pulse rounded-xl" />
                 ))
              ) : designs.length > 0 ? (
                designs.slice(0, 4).map((design) => (
                  <Link key={design.id} to={`/design?designId=${design.id}`}>
                    <Card className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden border hover:border-primary/50">
                      <div className="aspect-square bg-white relative flex items-center justify-center overflow-hidden">
                        {design.imageData ? (
                          <img src={design.imageData} alt={design.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <Shirt className="h-16 w-16 text-muted-foreground/20" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">{design.name || t("dashboard.untitled")}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
                  <p className="text-muted-foreground mb-4">No recent designs found.</p>
                  <Link to="/design">
                    <Button>Create your first design</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Featured Templates Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                {t("templates.title") || "Featured Templates"}
              </h2>
              <Link to="/dashboard/templates">
                <Button variant="ghost" className="gap-2">
                  View All Templates <ArrowRight className="h-4 w-4" />
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
                  <div className="aspect-[3/4] rounded-xl bg-secondary mb-3 overflow-hidden relative border shadow-sm">
                     <img 
                       src={template.image} 
                       alt={template.name}
                       className="w-full h-full object-contain p-2 bg-white transition-transform duration-500 group-hover:scale-105"
                       onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x500?text=No+Image"; }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     
                     {template.tier === "Pro" && (
                       <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                         <Crown className="h-3 w-3 text-yellow-400" /> Pro
                       </div>
                     )}

                     <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                       <Button 
                         size="sm" 
                         className="w-full bg-white text-black hover:bg-white/90"
                         onClick={() => handleUseTemplate(template)}
                       >
                         Use Template
                       </Button>
                     </div>
                  </div>
                  <h3 className="font-medium truncate">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.category}</p>
                </motion.div>
              ))}
            </div>
          </section>

         </div>
      ) : (
        <section className="bg-secondary/30 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold">{t("dashboard.startFree")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("dashboard.startDesc")}
          </p>
          <Link to="/store">
             <Button size="lg" className="mt-4">
               Go to Catalog
             </Button>
          </Link>
        </section>
      )}
    </div>
  );
}