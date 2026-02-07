// src/design-tool/components/SidebarSavedList.jsx
import React, { useMemo } from 'react';
import useUserDesigns from '../hooks/useUserDesigns';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from "lucide-react";
import { FiTrash2, FiClock } from 'react-icons/fi';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function SidebarSavedList({ productId, onDesignSelect }) {
    const { user } = useAuth();
    const { designs, loading } = useUserDesigns(user?.uid);

    const filteredDesigns = useMemo(() => {
        if (!designs) return [];
        return designs.filter(d => {
            const isBlank = d.type === 'BLANK' || !d.type;
            const isCurrentProduct = d.type === 'PRODUCT' && d.productConfig?.productId === productId;
            return isBlank || isCurrentProduct;
        });
    }, [designs, productId]);

    const handleDelete = async (e, designId) => {
        e.stopPropagation();
        if (!window.confirm("Delete this saved design?")) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/designs`, designId));
        } catch (error) {
            console.error("Error deleting design:", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-orange-500" /></div>;
    }

    if (filteredDesigns.length === 0) {
        return (
            <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 mx-4 mt-4">
                <p className="text-slate-400 text-sm">No saved designs found.</p>
                <p className="mt-2 text-xs text-slate-500">Save your current work to see it here!</p>
            </div>
        );
    }

    return (
        <div className="sidebar-content p-4 space-y-3">
            {filteredDesigns.map(design => {
                const isBlank = design.type === 'BLANK' || !design.type;
                
                return (
                    <div 
                        key={design.id} 
                        onClick={() => onDesignSelect(design)}
                        className="group relative border border-white/10 rounded-lg p-2 cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-900/10 transition-all"
                    >
                        {/* Thumbnail */}
                        <div className="bg-white/5 rounded mb-2 overflow-hidden h-28 flex items-center justify-center border border-white/5 relative">
                            {design.imageData ? (
                                <img src={design.imageData} alt={design.name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs text-slate-500">No Preview</span>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Info & Action Badge */}
                        <div className="flex justify-between items-center px-1">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-white truncate w-32" title={design.name || "Untitled"}>
                                    {design.name || "Untitled"}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <FiClock size={10} /> Saved
                                </span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${isBlank ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {isBlank ? 'MERGE' : 'REPLACE'}
                            </span>
                        </div>

                        {/* Hover Delete Button */}
                        <button 
                            onClick={(e) => handleDelete(e, design.id)}
                            className="absolute top-3 right-3 p-1.5 bg-slate-900 text-red-400 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-900/20 hover:text-red-300"
                            title="Delete Design"
                        >
                            <FiTrash2 size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}