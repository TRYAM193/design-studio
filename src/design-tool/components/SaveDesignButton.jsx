import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign';
import { FiSave, FiRotateCw } from 'react-icons/fi';

export default function SaveDesignButton({ 
  canvas, 
  userId, 
  editingDesignId, 
  className,
  productData, 
  currentObjects,
  viewStates, 
  currentView,
  onGetSnapshot, // 🆕 Function to get clean image
  onSaveSuccess  // 🆕 Function to update parent state
}) {
  const [saving, setSaving] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const classNames = className + ' text-button';

  const performSave = async (isOverwrite) => {
    // 1. Get Clean Snapshot from Editor
    let thumbnail = null;
    if (onGetSnapshot) {
        thumbnail = await onGetSnapshot(); // This returns a DataURL string
    }

    let result;
    if (isOverwrite && editingDesignId) {
       result = await overwriteDesign(
           userId, editingDesignId, canvas, productData, viewStates, currentView, setSaving, thumbnail
       );
    } else {
       result = await saveNewDesign(
           userId, canvas, productData, viewStates, currentView, setSaving, thumbnail
       );
    }

    if (result && result.success) {
        // 2. Notify Parent (Editor.jsx) to update URL and State
        if (onSaveSuccess) onSaveSuccess(result.id);
    }
  };

  const handleSaveClick = () => {
    if (!canvas) return;
    if (!editingDesignId) {
      // New Design -> Save directly
      performSave(false);
    } else {
      // Existing Design -> Ask user
      setShowSavePrompt(true);
    }
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
        onSaveCopy={() => {
            setShowSavePrompt(false);
            performSave(false); // Force new ID
        }}
        onOverwrite={() => {
            setShowSavePrompt(false);
            performSave(true); // Overwrite existing
        }}
      />
    </>
  );
}