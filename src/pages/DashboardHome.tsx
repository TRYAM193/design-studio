import { motion } from "framer-motion";
import { ArrowRight, Clock, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardHome() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          What will you design today?
        </motion.h1>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Social Media", "Presentation", "Document", "Whiteboard"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full h-24 flex flex-col gap-2 text-lg font-normal hover:border-primary hover:bg-secondary/50 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                {item}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Designs */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recent designs</h2>
          <Button variant="link" className="text-muted-foreground">View all <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="group cursor-pointer border-0 shadow-none bg-transparent">
              <div className="aspect-[4/3] rounded-xl bg-secondary mb-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                <h3 className="font-medium truncate">Untitled Design {i}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Edited {i}h ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
