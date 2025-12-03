import { motion } from "framer-motion";
import { Folder, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardProjects() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Projects
        </motion.h1>
        <Button>New Folder</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {["Marketing Campaign Q1", "Social Media Assets", "Client Presentations", "Personal Brand"].map((folder, i) => (
          <motion.div
            key={folder}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-secondary/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">{folder}</h3>
                <p className="text-sm text-muted-foreground">Updated 2 days ago</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
