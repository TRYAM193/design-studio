import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPricing() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          Upgrade to Pro
        </motion.h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock premium features and take your designs to the next level.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            name: "Free",
            price: "$0",
            description: "For individuals just getting started.",
            features: ["5 Projects", "Basic Templates", "1GB Storage", "Standard Support"],
            button: "Current Plan",
            highlight: false
          },
          {
            name: "Pro",
            price: "$12",
            description: "For professionals and growing teams.",
            features: ["Unlimited Projects", "Premium Templates", "100GB Storage", "Priority Support", "Brand Kit", "Background Remover"],
            button: "Upgrade to Pro",
            highlight: true
          },
          {
            name: "Enterprise",
            price: "$30",
            description: "For large organizations.",
            features: ["SSO", "Unlimited Storage", "24/7 Support", "Advanced Analytics", "Custom Fonts", "Dedicated Manager"],
            button: "Contact Sales",
            highlight: false
          }
        ].map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`h-full flex flex-col ${plan.highlight ? 'border-primary shadow-lg scale-105' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  {plan.button}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
