import React, { useState } from 'react';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign'; 
import SavePromptModal from './SavePromptModal';
import { CloudUpload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // ✅ Import utility for class merging

export default function SaveDesignButton({ 
  canvas, 
  userId, 
  editingDesignId, 
  currentDesignName, 
  currentView, 
  viewStates, 
  productData, 
  onGetSnapshot, 
  onSaveSuccess,
  // ✅ New Props for flexible styling
  className,
  variant = "outline", // Default to desktop style
  size = "sm"         // Default to desktop size
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (name, saveAsCopy) => {
    const snapshot = onGetSnapshot ? onGetSnapshot(1200, true) : null;
    let result;

    if (saveAsCopy || !editingDesignId) {
       result = await saveNewDesign(
         userId,
         canvas.present,
         viewStates,
         productData,
         currentView,
         setIsSaving,
         snapshot,
         name 
       );
    } else {
       result = await overwriteDesign(
         userId,
         editingDesignId,
         canvas.present,
         viewStates,
         productData,
         currentView,
         setIsSaving,
         snapshot,
         name 
       );
    }

    if (result && result.success) {
        if (onSaveSuccess) onSaveSuccess(result.id);
        setIsModalOpen(false);
    } else {
        alert("Failed to save design");
    }
  };

  return (
    <>
      <Button 
        onClick={handleSaveClick} 
        variant={variant} 
        size={size} 
        // ✅ Merge classes: 'gap-2' is base, 'className' overrides (e.g., text color, bg)
        className={cn("gap-2", className)} 
      >
        <CloudUpload size={16} />
        Save
      </Button>

      <SavePromptModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        isExistingDesign={!!editingDesignId}
        currentName={currentDesignName}
      />
    </>
  );
}