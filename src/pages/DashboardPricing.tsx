import { motion } from "framer-motion";
import { Check, Clock, Sparkles, Shield, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "@/components/ui/badge";

export default function DashboardPricing() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 relative">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME (Ensures consistency) */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-white"
        >
          {t("pricing.title")}
        </motion.h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          {t("pricing.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            name: t("pricing.plan.free"),
            price: "$0",
            description: "For individuals just getting started.",
            features: ["5 Projects", "Basic Templates", "1GB Storage", "Standard Support"],
            button: t("pricing.button.current"),
            highlight: false,
            comingSoon: false,
            icon: Sparkles
          },
          {
            name: t("pricing.plan.pro"),
            price: "$12", 
            description: "For professionals and growing teams.",
            features: [], 
            button: "Coming Soon",
            highlight: false,
            comingSoon: true,
            icon: Zap
          },
          {
            name: t("pricing.plan.enterprise"),
            price: "$30", 
            description: "For large organizations.",
            features: [], 
            button: "Contact Sales",
            highlight: false,
            comingSoon: true,
            icon: Shield
          }
        ].map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card 
              className={`h-full flex flex-col relative transition-all duration-300 border backdrop-blur-md
                ${plan.highlight 
                  ? 'bg-slate-800/60 border-orange-500/50 shadow-2xl shadow-orange-900/20 scale-105 z-10' 
                  : 'bg-slate-800/40 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
                }`}
            >
              
              {/* Badge for Coming Soon plans */}
              {plan.comingSoon && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-slate-900/80 text-slate-400 border border-white/10 backdrop-blur-sm">
                    <Clock className="w-3 h-3 mr-1.5 text-orange-400" /> Planned
                  </Badge>
                </div>
              )}

              {/* Pro Badge */}
              {plan.highlight && !plan.comingSoon && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 px-4 py-1 shadow-lg">
                       Most Popular
                    </Badge>
                 </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                   <plan.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                
                <div className="mt-4 h-16 flex items-center">
                  {plan.comingSoon ? (
                    <span className="text-2xl font-bold text-slate-500 flex items-center gap-2">
                       <Lock className="w-5 h-5" /> Coming Soon
                    </span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                      <span className="text-slate-400 ml-2 font-medium">{t("pricing.month")}</span>
                    </>
                  )}
                </div>
                
                <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1">
                {plan.comingSoon ? (
                  // ✅ Layout for Coming Soon (Dark Void Style)
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-white/5 rounded-xl bg-black/20">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      We are crafting these premium features in the cosmic forge. Stay tuned for the release!
                    </p>
                  </div>
                ) : (
                  // ✅ Standard Feature List
                  <ul className="space-y-4 mt-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="p-1 rounded-full bg-blue-500/10">
                           <Check className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className={`w-full h-12 text-lg font-medium transition-all duration-300
                    ${plan.highlight 
                        ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/40 border-0" 
                        : "bg-white/5 text-white hover:bg-white/10 border-white/10 hover:border-white/20"
                    }
                    ${plan.comingSoon ? "opacity-50 cursor-not-allowed hover:bg-white/5" : ""}
                  `}
                  disabled={plan.comingSoon}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.comingSoon ? "In Development" : plan.button}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}