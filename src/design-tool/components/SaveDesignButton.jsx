import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign';
import { FiSave, FiRotateCw } from 'react-icons/fi';

export default function SaveDesignButton({ 
  canvas, 
  userId, 
  editingDesignId, 
  className,
  // New Props
  productData, 
  viewStates, 
  currentView 
}) {
  const [saving, setSaving] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const classNames = className + ' text-button';

  const getCleanDataURL = () => {
        if (!fabricCanvas) return null;

        const originalBg = fabricCanvas.backgroundColor;
        const originalClip = fabricCanvas.clipPath;

        // Hide background/border logic similar to your capture function
        if (productData.title?.includes("Mug")) {
            fabricCanvas.backgroundColor = "#FFFFFF";
        } else {
            fabricCanvas.backgroundColor = null;
        }
        fabricCanvas.clipPath = null;

        const borderObj = fabricCanvas.getObjects().find(obj => obj.customId === 'print-area-border' || obj.id === 'print-area-border');
        let wasBorderVisible = false;
        if (borderObj) {
            wasBorderVisible = borderObj.visible;
            borderObj.visible = false;
        }

        fabricCanvas.renderAll();
        
        // Capture
        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 0.8,
            multiplier: 0.5, // Smaller thumbnail
            enableRetinaScaling: false
        });

        // Restore
        fabricCanvas.backgroundColor = originalBg;
        fabricCanvas.clipPath = originalClip;
        if (borderObj) borderObj.visible = wasBorderVisible;
        fabricCanvas.renderAll();

        return dataUrl;
    };

  const handleSaveClick = () => {
    if (!canvas) return;
    if (!editingDesignId) {
      // New Design -> Save directly
      saveNewDesign(userId, canvas, productData, viewStates, currentView, setSaving);
    } else {
      // Existing Design -> Ask user
      setShowSavePrompt(true);
    }
  };

  const handleOverwrite = async () => {
    await overwriteDesign(userId, editingDesignId, canvas, productData, viewStates, currentView, setSaving);
    setShowSavePrompt(false);
  };

  const handleSaveCopy = async () => {
    await saveNewDesign(userId, canvas, productData, viewStates, currentView, setSaving);
    setShowSavePrompt(false);
  };

  return (
    <>
      <button onClick={handleSaveClick} disabled={saving} className={classNames}>
        {saving ? <FiRotateCw size={20} className="icon-spin" /> : <FiSave size={20} />}
        <span>Save</span>
      </button>

      <SavePromptModal
        open={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveCopy={handleSaveCopy}
        onOverwrite={handleOverwrite}
      />
    </>
  );
}