import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { saveGlobalTemplate } from '../utils/saveDesign';
import { Layout, Loader2, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { object } from 'zod';

// 🔒 REPLACE THIS WITH YOUR ACTUAL FIREBASE USER ID
// You can find this in the Firebase Console -> Authentication -> User UID
const ADMIN_UIDS = [
  "mFezQyeohXUsRFYhQqgg2jbod0i1", 
  "ANOTHER_ADMIN_UID_IF_NEEDED"
];

export default function SaveTemplateButton({ canvas, className, objects }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // 1. SECURITY CHECK: If user is not admin, return nothing (hidden)
  if (!user || !ADMIN_UIDS.includes(user.uid)) {
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
      <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
    </button>
  );
}