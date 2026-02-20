import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
// Check your import path matches your project structure
import { saveGlobalTemplate } from '../utils/saveDesign'; 
import { Layout, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SaveTemplateButton({ canvas, className, objects, isMobile=false }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingClaim, setLoadingClaim] = useState(true);

  // 🔒 SECURITY CHECK: Check for 'admin' custom claim
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoadingClaim(false);
        return;
      }
      try {
        // Force refresh to get latest claims
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(!!tokenResult.claims.admin);
      } catch (e) {
        console.error("Admin check failed", e);
        setIsAdmin(false);
      } finally {
        setLoadingClaim(false);
      }
    };

    checkAdmin();
  }, [user]);

  // 1. IF NOT ADMIN, RETURN NULL (Hidden from normal users)
  if (loadingClaim || !isAdmin) {
    return null; 
  }

  const handleSaveTemplate = async () => {
    if (!canvas) return;

    // 2. Simple Prompt for Admin Details
    const name = window.prompt("Enter Template Name (e.g., 'Summer Vibes Badge'):");
    if (!name) return;

    const category = window.prompt("Enter Category (e.g., 'Typography', 'Vintage'):", "General");
    if (!category) return;

    setIsSaving(true);
    try {
      // 3. Call the Utility
      await saveGlobalTemplate(canvas, name, category, objects);
      alert("✅ Template Saved Successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save template. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSaveTemplate}
      disabled={isSaving}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 bg-purple-900/50 hover:bg-purple-800 text-purple-100 border border-purple-500/30 transition-all text-xs font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      title="Admin: Save as Global Template"
    >
      {isSaving ? (
        <Loader2 size={16} className="animate-spin text-purple-300" />
      ) : (
        <Layout size={16} className="text-purple-300" />
      )}
      {!isMobile && <span>{isSaving ? 'Saving...' : 'Save Template'}</span>}
    </button>
  );
}