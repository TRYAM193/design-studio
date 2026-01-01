import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "@/components/ui/badge";

export default function DashboardPricing() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          {t("pricing.title")}
        </motion.h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
            comingSoon: false
          },
          {
            name: t("pricing.plan.pro"),
            price: "$12", // Won't be shown
            description: "For professionals and growing teams.",
            features: [], // Won't be shown
            button: "Coming Soon",
            highlight: true,
            comingSoon: true // ✅ Flag to hide features
          },
          {
            name: t("pricing.plan.enterprise"),
            price: "$30", // Won't be shown
            description: "For large organizations.",
            features: [], // Won't be shown
            button: "Contact Sales",
            highlight: false,
            comingSoon: true // ✅ Flag to hide features
          }
        ].map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`h-full flex flex-col relative ${plan.highlight ? 'border-indigo-600 shadow-lg scale-105' : ''}`}>
              
              {/* Optional: Badge for Coming Soon plans */}
              {plan.comingSoon && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                    <Clock className="w-3 h-3 mr-1" /> Planned
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                
                <div className="mt-4 h-16 flex items-center">
                  {plan.comingSoon ? (
                    <span className="text-2xl font-bold text-slate-400">Coming Soon</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{t("pricing.month")}</span>
                    </>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1">
                {plan.comingSoon ? (
                  // ✅ Layout for Coming Soon (Hidden features)
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-400">
                      We are working hard to bring you these premium features. Stay tuned!
                    </p>
                  </div>
                ) : (
                  // ✅ Standard Feature List
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-indigo-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.highlight ? "default" : "outline"}
                  disabled={plan.comingSoon}
                >
                  {plan.comingSoon ? "Coming Soon" : plan.button}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}