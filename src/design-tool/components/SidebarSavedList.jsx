// src/design-tool/components/SidebarSavedList.jsx
import React, { useMemo } from 'react';
import useUserDesigns from '../hooks/useUserDesigns';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from "lucide-react";
import { FiTrash2, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function SidebarSavedList({ productId, onDesignSelect }) {
    const { user } = useAuth();
    const { designs, loading, refresh } = useUserDesigns(user?.uid);

    // Filter Logic: Show if 'BLANK' OR if it matches the current Product ID
    const filteredDesigns = useMemo(() => {
        if (!designs) return [];
        return designs.filter(d => {
            const isBlank = d.type === 'BLANK' || !d.type;
            const isCurrentProduct = d.type === 'PRODUCT' && d.productConfig?.productId === productId;
            return isBlank || isCurrentProduct;
        });
    }, [designs, productId]);

    const handleDelete = async (e, designId) => {
        e.stopPropagation(); // Prevent triggering the select action
        if (!window.confirm("Delete this saved design?")) return;
        
        try {
            await deleteDoc(doc(db, `users/${user.uid}/designs`, designId));
            // Trigger a refresh of the list if possible, or let the hook handle subscription updates
        } catch (error) {
            console.error("Error deleting design:", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (filteredDesigns.length === 0) {
        return (
            <div className="p-4 text-center text-slate-500 text-sm">
                <p>No matching designs found.</p>
                <p className="mt-2 text-xs">Save your current work to see it here!</p>
            </div>
        );
    }

    return (
        <div className="sidebar-content p-2 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
            {filteredDesigns.map(design => {
                const isBlank = design.type === 'BLANK' || !design.type;
                
                return (
                    <div 
                        key={design.id} 
                        onClick={() => onDesignSelect(design)}
                        className="group relative border rounded-lg p-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all bg-white"
                    >
                        {/* Thumbnail */}
                        <div className="bg-slate-50 rounded mb-2 overflow-hidden h-32 flex items-center justify-center">
                            {design.imageData ? (
                                <img src={design.imageData} alt={design.name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs text-slate-400">No Preview</span>
                            )}
                        </div>

                        {/* Info & Action Badge */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium truncate w-24" title={design.name || "Untitled"}>
                                {design.name || "Untitled"}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isBlank ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {isBlank ? 'MERGE' : 'REPLACE'}
                            </span>
                        </div>

                        {/* Hover Delete Button */}
                        <button 
                            onClick={(e) => handleDelete(e, design.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            title="Delete Design"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}