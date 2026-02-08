// src/design-tool/components/ExportButton.jsx
import React from 'react';
import { Download } from 'lucide-react';
import { exportReferenceImage } from '../utils/saveDesign';
import { cn } from "@/lib/utils"; // Assuming you have this, otherwise just use standard template literals

export default function ExportButton({ canvas, className, currentDesignName }) {
  
  const handleExport = () => {
    exportReferenceImage(canvas, currentDesignName || 'my-design');
  };

  return (
    <button
      onClick={handleExport}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all text-xs font-medium active:scale-95",
        className
      )}
      title="Export Design"
    >
      <Download size={16} className="text-indigo-400" />
    </button>
  );
}