// src/design-tool/components/SaveDesignButton.jsx
import React, { useState } from 'react';
// ✅ Import both functions
import { saveNewDesign, overwriteDesign } from '../saveDesign'; 
import SavePromptModal from './SavePromptModal';
import { FiSave } from 'react-icons/fi';
import { Button } from "@/components/ui/button";

export default function SaveDesignButton({ 
  canvas, userId, editingDesignId, currentDesignName, currentView, viewStates, productData, onGetSnapshot, onSaveSuccess 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (name, saveAsCopy) => {
    // 1. Capture Snapshot
    const snapshot = onGetSnapshot ? onGetSnapshot() : null;
    let result;

    // 2. Decide: New vs Overwrite
    // IF it's a "Save As Copy" OR there is no existing ID -> CREATE NEW
    if (saveAsCopy || !editingDesignId) {
       result = await saveNewDesign(
         userId,
         canvas.present,
         viewStates,
         productData,
         currentView,
         setIsSaving,
         snapshot,
         name // Pass Name
       );
    } 
    // ELSE -> OVERWRITE EXISTING
    else {
       result = await overwriteDesign(
         userId,
         editingDesignId,
         canvas.present,
         viewStates,
         productData,
         currentView,
         setIsSaving,
         snapshot,
         name // Pass Name (allows renaming while overwriting)
       );
    }

    // 3. Handle Result
    if (result && result.success) {
        if (onSaveSuccess) onSaveSuccess(result.id);
        setIsModalOpen(false);
    } else {
        alert("Failed to save design");
    }
  };

  return (
    <>
      <Button onClick={handleSaveClick} variant="outline" size="sm" className="gap-2">
        <FiSave size={16} />
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