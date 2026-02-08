// src/design-tool/components/SidebarSavedList.jsx
import React, { useState, useEffect, useRef } from 'react';
import useUserDesigns from '../hooks/useUserDesigns';
import { exportSavedDesignImage } from '../utils/saveDesign';
import { 
  MoreVertical, Edit, Merge, Trash2, 
  Loader2, FileJson, Clock, Image as ImageIcon 
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore'; // 👈 Import Firestore helpers
import { db } from '@/firebase'; // 👈 Import DB instance

export default function SidebarSavedList({ 
  userId,
  productId, 
  onLoadDesign, 
  onMergeDesign 
}) {
  // 👇 FIX: Only take what the hook actually provides
  const { designs, loading } = useUserDesigns(userId);
  
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 👇 NEW: Handle Delete Locally since hook doesn't provide it
  const handleDeleteDesign = async (designId) => {
    if (!userId || !designId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/designs`, designId));
      // Note: If useUserDesigns uses onSnapshot, the list will update automatically.
    } catch (err) {
      console.error("Error deleting design:", err);
      alert("Failed to delete design.");
    }
  };

  const handleAction = async (action, design, e) => {
    e.stopPropagation(); 
    setOpenMenuId(null); 

    if (action === 'merge') {
      if (onMergeDesign) onMergeDesign(design);
    } 
    else if (action === 'edit') {
      if (onLoadDesign) onLoadDesign(design);
    } 
    else if (action === 'export') {
      exportSavedDesignImage(design);
    }
    else if (action === 'delete') {
      if (window.confirm(`Delete "${design.name}"? This cannot be undone.`)) {
        await handleDeleteDesign(design.id);
      }
    }
  };
  console.log(designs)

  // FILTERING
  const filteredDesigns = (designs || []).filter(design => {
    if (productId) return true; 
    return design.type === 'BLANK' || !design.type; 
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-xs">Loading designs...</span>
      </div>
    );
  }

  if (filteredDesigns.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        {productId ? "No saved designs found." : "No blank designs found."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto custom-scrollbar pb-20">
      {filteredDesigns.map((design) => {
        const isBlankDesign = design.type === 'BLANK' || !design.type;

        return (
          <div 
            key={design.id} 
            className="group relative flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition-all"
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
              {design.imageData ? (
                <img src={design.imageData} alt={design.name} className="w-full h-full object-cover" />
              ) : (
                <FileJson size={20} className="text-slate-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-slate-200 truncate" title={design.name}>
                {design.name || "Untitled"}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 truncate">
                  {design.updatedAt ? new Date(design.updatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === design.id ? null : design.id);
                }}
                className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${openMenuId === design.id ? 'bg-slate-700 text-white' : ''}`}
              >
                <MoreVertical size={16} />
              </button>

              {openMenuId === design.id && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-8 w-40 bg-slate-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                >
                  <div className="flex flex-col py-1">
                    
                    {/* MERGE: Only for Blank designs */}
                    {isBlankDesign && (
                      <button 
                        onClick={(e) => handleAction('merge', design, e)}
                        className="flex items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors border-b border-white/5"
                      >
                        <Merge size={14} /> 
                        <span>Merge to Canvas</span>
                      </button>
                    )}

                    <button 
                      onClick={(e) => handleAction('edit', design, e)}
                      className="flex items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                    >
                      <Edit size={14} /> 
                      <span>Edit Design</span>
                    </button>

                    <button 
                      onClick={(e) => handleAction('export', design, e)}
                      className="flex items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                    >
                      <ImageIcon size={14} /> 
                      <span>Export Image</span>
                    </button>

                    <div className="h-px bg-white/5 my-1 mx-2" />

                    <button 
                      onClick={(e) => handleAction('delete', design, e)}
                      className="flex items-center gap-2 px-3 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} /> 
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}