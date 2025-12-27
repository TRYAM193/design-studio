// src/design-tool/components/SaveDesignButton.jsx
import React, { useState } from 'react';
import { saveDesign } from '../utils/saveDesign';
import SavePromptModal from './SavePromptModal';
import { FiSave } from 'react-icons/fi';
import { Button } from "@/components/ui/button";

export default function SaveDesignButton({ 
  canvas, userId, editingDesignId, currentDesignName, currentView, viewStates, productData, onGetSnapshot, onSaveSuccess 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Logic: 
  // If editingDesignId exists -> Modal shows "Update" vs "Copy"
  // If null -> Modal shows Input only

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (name, saveAsCopy) => {
    setIsSaving(true);
    try {
        const snapshot = onGetSnapshot ? onGetSnapshot() : null;
        
        // Prepare current state
        const currentCanvasObjects = canvas.present;
        const finalViewStates = {
            ...viewStates,
            [currentView]: currentCanvasObjects
        };

        // DETERMINISTIC ID LOGIC:
        // If saveAsCopy is TRUE -> Pass null (Create New)
        // If saveAsCopy is FALSE -> Pass editingDesignId (Update Existing)
        const targetDesignId = saveAsCopy ? null : editingDesignId;

        const savedId = await saveDesign({
            userId,
            designId: targetDesignId, 
            canvasObjects: currentCanvasObjects,
            viewStates: finalViewStates,
            previewImage: snapshot,
            productConfig: {
                productId: productData.productId,
                variantColor: productData.color,
                variantSize: productData.size
            },
            name: name
        });

        if (onSaveSuccess) onSaveSuccess(savedId);
        setIsModalOpen(false);
    } catch (error) {
        console.error("Save failed:", error);
        alert("Failed to save design");
    } finally {
        setIsSaving(false);
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
        // ✅ Pass Context to Modal
        isExistingDesign={!!editingDesignId}
        currentName={currentDesignName}
      />
    </>
  );
}