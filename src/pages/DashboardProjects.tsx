import { motion } from "framer-motion";
import { Lock, Edit, Trash2, Plus, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "@/hooks/use-translation";
import { useUserDesigns, Design } from "@/hooks/use-user-designs";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardProjects() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Fetch real designs
  const { designs, loading } = useUserDesigns(user?.uid);

  const handleDelete = async (e: React.MouseEvent, designId: string) => {
    e.stopPropagation(); // Prevent clicking the card when deleting
    if (!user || !confirm("Are you sure you want to delete this design?")) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/designs`, designId));
      toast.success("Design deleted successfully");
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design");
    }
  };

  const handleEdit = (design: Design) => {
    navigate('/design', { state: { designToLoad: design } });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        {/* Dark Background Overlay for Auth State */}
        <div className="absolute inset-0 bg-[#0f172a] -z-20" />
        
        <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10 shadow-xl shadow-blue-900/20">
          <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("projects.signInTitle")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {t("projects.signInDesc")}
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold border-0 shadow-lg shadow-orange-900/40">
            {t("nav.signin")} / {t("auth.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-white"
        >
          {t("projects.title")}
        </motion.h1>
        <Link to="/design">
          {/* Saffron Button Style */}
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/40 border-20">
            <Plus className="mr-2 h-4 w-4" />
            {t("common.newDesign")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-2xl bg-slate-800/50 border border-white/5" />
          ))}
        </div>
      ) : designs.length === 0 ? (
        // Empty State: Dark Void Style
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 text-center">
          <div className="h-16 w-16 bg-slate-800/80 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-lg">
             <Sparkles className="h-8 w-8 text-orange-400" />
          </div>
          <p className="text-slate-300 mb-2 font-medium">Your canvas is empty.</p>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">Start a new project to bring your cosmic ideas to life.</p>
          <Link to="/design">
            <Button variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700 border border-white/10">
                Create your first design
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {designs.map((design, i) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleEdit(design)}
              className="group relative bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Image Area: White Canvas for Visibility */}
              <div className="aspect-square w-full overflow-hidden bg-white relative flex items-center justify-center">
                {design.imageData ? (
                  <img 
                    src={design.imageData} 
                    alt={design.name} 
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-600 shadow-xl"
                    onClick={(e) => { e.stopPropagation(); handleEdit(design); }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-red-50 hover:text-red-600 shadow-xl"
                    onClick={(e) => handleDelete(e, design.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-white/5 bg-slate-900/30">
                <h3 className="font-bold text-slate-200 truncate text-sm" title={design.name}>
                  {design.name || t("dashboard.untitled")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  {design.createdAt ? "Edited recently" : "New draft"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}