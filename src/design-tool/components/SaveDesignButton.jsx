import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign';
import { FiSave, FiRotateCw } from 'react-icons/fi';

export default function SaveDesignButton({ 
  userId, 
  editingDesignId, 
  className,
  productData, 
  viewStates, 
  currentView,
  currentObjects, // ✅ NEW: Receiving Redux Array directly
  onGetSnapshot, 
  onSaveSuccess 
}) {
  const [saving, setSaving] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const classNames = className + ' text-button';

  const performSave = async (isOverwrite) => {
    let thumbnail = null;
    if (onGetSnapshot) thumbnail = await onGetSnapshot();

    let result;
    if (isOverwrite && editingDesignId) {
       result = await overwriteDesign(
           userId, 
           editingDesignId, 
           currentObjects, // Passing Redux
           viewStates, 
           productData, 
           currentView, 
           setSaving, 
           thumbnail
       );
    } else {
       result = await saveNewDesign(
           userId, 
           currentObjects, // Passing Redux
           viewStates, 
           productData, 
           currentView, 
           setSaving, 
           thumbnail
       );
    }

    if (result && result.success && onSaveSuccess) {
        onSaveSuccess(result.id);
    }
  };

  const handleSaveClick = () => {
    if (!currentObjects) return; // Guard
    if (!editingDesignId) performSave(false);
    else setShowSavePrompt(true);
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
        onSaveCopy={() => { setShowSavePrompt(false); performSave(false); }}
        onOverwrite={() => { setShowSavePrompt(false); performSave(true); }}
      />
    </>
  );
}