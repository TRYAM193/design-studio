import { motion } from "framer-motion";
import { ArrowRight, Clock, Plus, Shirt, Star, Store } from "lucide-react"; // Added Store icon
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom"; // Fixed import
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardHome() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

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
        
        {/* Quick Actions - NOW LINKED TO STORE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "T-Shirt", icon: Plus, query: "tee" },
            { label: "Hoodie", icon: Plus, query: "hoodie" },
            { label: "Long Sleeve", icon: Plus, query: "long" },
            { label: "Tote Bag", icon: Plus, query: "tote" }
          ].map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Link to Store with Search Query */}
              <Link to={`/store?search=${action.query}`}>
                <Button 
                  variant="outline" 
                  className="w-full h-32 flex flex-col gap-4 border-dashed hover:border-solid hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Projects Section */}
      {/* (Logic: If user has projects, show them. Else show 'Start Free') */}
      {isAuthenticated ? (
         <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("dashboard.recent")}</h2>
            <Link to="/dashboard/projects">
              <Button variant="ghost" className="gap-2">
                {t("dashboard.viewAll")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Placeholder for Recent Projects Grid */}
          {/* You can connect this to useUserDesigns() later */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/store">
                <Card className="group cursor-pointer hover:shadow-md transition-all border-dashed bg-muted/30 flex items-center justify-center h-full min-h-[200px]">
                    <div className="text-center space-y-2">
                        <Store className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">Browse Store</p>
                    </div>
                </Card>
            </Link>
            {/* Example Placeholders - Replace with real data */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="group cursor-pointer hover:shadow-md transition-all overflow-hidden">
                <div className="aspect-square bg-secondary relative flex items-center justify-center">
                  <Shirt className="h-16 w-16 text-muted-foreground/20" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{t("dashboard.untitled")} {i}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{i}h {t("dashboard.ago")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
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