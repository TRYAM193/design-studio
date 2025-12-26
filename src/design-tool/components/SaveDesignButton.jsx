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