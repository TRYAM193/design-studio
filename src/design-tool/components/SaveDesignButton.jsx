// src/components/SaveDesignButton.jsx
import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign';
import { FiSave, FiRotateCw } from 'react-icons/fi'; // <-- ADDED ICONS

export default function SaveDesignButton({ canvas, userId, editingDesignId, className }) {
  const [saving, setSaving] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const classNames = className + ' text-button'

  const handleSave = () => {
    if (!canvas) return;

    // NEW DESIGN → save directly
    if (!editingDesignId) {
      saveNewDesign(userId, canvas, setSaving); //
      return;
    }

    // EXISTING DESIGN → show save prompt
    setShowSavePrompt(true);
  };

  const handleOverwrite = async () => {
    await overwriteDesign(userId, editingDesignId, canvas, setSaving); //
    setShowSavePrompt(false);
  };

  const handleSaveCopy = async () => {
    await saveNewDesign(userId, canvas, setSaving); //
    setShowSavePrompt(false);
  };

  return (
    <>
      {/* FIX: Render FiSave icon or FiRotateCw spinner based on 'saving' state */}
      <button 
        onClick={handleSave} 
        disabled={saving} 
        title={saving ? 'Saving...' : 'Save Design'}
        className={classNames} 
      >
        {saving ? (
          <FiRotateCw size={20} className="icon-spin" />
        ) : (
          <FiSave size={20} /> // Save icon when ready
        )}
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