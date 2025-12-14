import { motion } from "framer-motion";
import { Lock, Edit, Trash2, Plus, Image as ImageIcon } from "lucide-react";
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
    // Navigate to the editor with the design data
    navigate('/design', { state: { designToLoad: design } });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("projects.signInTitle")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("projects.signInDesc")}
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8">
            {t("nav.signin")} / {t("auth.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t("projects.title")}
        </motion.h1>
        <Link to="/design">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("common.newDesign")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      ) : designs.length === 0 ? (
        <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed">
          <p className="text-muted-foreground mb-4">No designs found. Start creating!</p>
          <Link to="/design">
            <Button variant="outline">Create your first design</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
          {designs.map((design, i) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleEdit(design)}
              className="group relative bg-card rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden border cursor-pointer"
            >
              {/* Image Area */}
              <div className="aspect-square w-full overflow-hidden bg-muted relative flex items-center justify-center">
                {design.imageData ? (
                  <img 
                    src={design.imageData} 
                    alt={design.name} 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                )}

                {/* Overlay Icons (Matches your original CSS hover effect) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 hover:bg-white hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); handleEdit(design); }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDelete(e, design.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t">
                <h3 className="font-medium truncate text-sm" title={design.name}>
                  {design.name || "Untitled Design"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to edit
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}