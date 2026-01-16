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
  ];

  const handleUseTemplate = (template: any) => {
    window.open(`/design?templateid=${template.id}`)
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 relative px-2 sm:px-0">
      {/* BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Hero Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-white"
          >
            {t("dashboard.welcome")}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
              {user?.displayName?.split(" ")[0] || "Creator"}
            </span>
          </motion.h1>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-300">
            <Moon className="w-3 h-3 text-slate-400" />
            <span>Waxing Phase</span>
          </div>
        </div>

        {/* COMPACT HERO CTA CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          // ⚠️ FIX: Changed h-40 to h-auto for mobile so text doesn't get cut off
          className="relative group rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/40 h-auto md:h-48"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-[#1a2035] to-slate-900" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] group-hover:bg-orange-500/20 transition-all duration-700" />

          <div className="relative z-10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 h-full">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                <Flame className="w-3 h-3" /> Trending
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                Start Your <span className="text-blue-300">Cosmic Collection</span>
              </h2>
              <p className="text-slate-400 text-xs md:text-sm line-clamp-2 md:line-clamp-1">
                Premium hoodies & tees ready for your custom touch.
              </p>

              <div className="pt-2 md:pt-1">
                <Link to="/store">
                  <Button size="sm" className="h-9 px-6 text-sm rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg border-0 w-full md:w-auto">
                    <Store className="mr-2 h-4 w-4" />
                    Browse Catalog
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden md:block relative mr-8">
              <Store className="w-24 h-24 text-slate-700 opacity-50 rotate-12 group-hover:rotate-0 transition-all duration-700" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content Area */}
      {isAuthenticated ? (
        <div className="space-y-8">

          {/* Recent Projects Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                {t("dashboard.recent")}
              </h2>
              <Link to="/dashboard/projects">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5 gap-1 h-8 text-xs">
                  {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* ⚠️ FIX: Grid cols 2 -> 3 -> 4 -> 5 responsive scaling */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {designsLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-40 bg-slate-800/50 animate-pulse rounded-xl border border-white/5" />
                ))
              ) : designs.length > 0 ? (
                designs.slice(0, 5).map((design) => (
                  <div key={design.id} onClick={() => window.open(`/design?designId=${design.id}`)}>
                    <Card className="group cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all overflow-hidden border border-white/10 bg-slate-800/40 backdrop-blur-md rounded-xl h-full">
                      <div className="aspect-square w-full overflow-hidden bg-white relative flex items-center justify-center">
                        {design.imageData ? (
                          <img src={design.imageData} alt={design.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-full">
                            <Zap className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold shadow-md">Edit</span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-bold text-slate-200 truncate text-xs">{design.name || t("dashboard.untitled")}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {design.updatedAt
                              ? new Date(design.updatedAt).toLocaleDateString()
                              : "Just now"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-slate-400 text-sm mb-4">No recent designs found.</p>
                  <Link to="/design">
                    <Button variant="secondary" size="sm" className="bg-slate-800 text-white hover:bg-slate-700 text-xs h-8">Start Creating</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Featured Templates Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                {t("templates.title") || "Featured Templates"}
              </h2>
              <Link to="/dashboard/designs">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5 gap-1 h-8 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* ⚠️ FIX: Grid cols 2 -> 3 -> 4 scaling */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {templates.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[3/4] rounded-2xl bg-slate-800/40 mb-3 h-auto overflow-hidden relative border border-white/10 shadow-lg backdrop-blur-sm">
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x500/ffffff/000000?text=Template"; }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {template.tier === "Pro" && (
                      <div className="absolute top-2 right-2 bg-orange-500/20 backdrop-blur-md border border-orange-500/50 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Crown className="h-2.5 w-2.5" /> Pro
                      </div>
                    )}

                    {/* Mobile: Use button always visible or on tap. Desktop: Hover. */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-sm px-3 md:px-5 md:h-10 text-sm md:text-base bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/40 hover:shadow-orange-700/50 hover:scale-105 active:scale-95 transition-all duration-300 group border-0 relative overflow-hidden"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-medium text-slate-200 truncate px-1 text-xs">{template.name}</h3>
                  <p className="text-[10px] text-slate-500 px-1">{template.category}</p>
                </motion.div>
              ))}
            </div>
          </section>

        </div>
      ) : (
        <section className="bg-slate-800/30 border border-white/5 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">{t("dashboard.startFree")}</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            {t("dashboard.startDesc")}
          </p>
          <Link to="/store">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 h-9 text-sm">
              Go to Catalog
            </Button>
          </Link>
        </section>
      )}
    </div>
  );
}