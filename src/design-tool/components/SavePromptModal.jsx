import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FiFile, FiCopy, FiX } from 'react-icons/fi';
import "../styles/SavePromptModal.css";

const SavePromptModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSaving, 
  currentName, 
  isExistingDesign 
}) => {
  const [designName, setDesignName] = useState("");
  const [mode, setMode] = useState('initial'); 
  const [mounted, setMounted] = useState(false);

  // Ensure we only use Portal after component mounts (prevents hydration errors)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDesignName(currentName || "Untitled Design");
      // If existing, ask for Choice. If new, ask for Name directly.
      setMode(isExistingDesign ? 'choice' : 'input'); 
    }
  }, [isOpen, currentName, isExistingDesign]);

  if (!isOpen || !mounted) return null;

  // Handlers
  const handleUpdateClick = () => {
    // "Update" -> Overwrite existing, keep same name (or update it if we add that field later)
    onConfirm(designName, false); 
  };

  const handleSaveAsCopyClick = () => {
    setDesignName(`${currentName || 'Untitled'} (Copy)`);
    setMode('input'); 
  };

  const handleFinalConfirm = () => {
    // If we are in input mode for an existing design, it is a Copy.
    const isCopy = isExistingDesign && mode === 'input';
    onConfirm(designName, isCopy);
  };

  const modalContent = (
    <div className="modal-backdrop">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}><FiX /></button>

        <h3>{mode === 'choice' ? 'Save Changes' : 'Name Your Design'}</h3>
        
        {/* --- MODE: CHOICE (Existing Design) --- */}
        {mode === 'choice' && (
          <>
            <p className="text-sm text-gray-500 mb-4">How would you like to save your changes?</p>
            <div className="flex flex-col gap-3">
              <button className="choice-btn" onClick={handleUpdateClick} disabled={isSaving}>
                <div className="choice-icon bg-blue-50 text-blue-600"><FiFile /></div>
                <div className="choice-info">
                  <strong>Update Existing</strong>
                  <span>Overwrite current file</span>
                </div>
              </button>

              <button className="choice-btn" onClick={handleSaveAsCopyClick} disabled={isSaving}>
                <div className="choice-icon bg-green-50 text-green-600"><FiCopy /></div>
                <div className="choice-info">
                  <strong>Save as Copy</strong>
                  <span>Create a new file</span>
                </div>
              </button>
            </div>
            <div className="text-right mt-3">
                <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600" onClick={onClose}>Cancel</span>
            </div>
          </>
        )}

        {/* --- MODE: INPUT (New Design OR Copy) --- */}
        {mode === 'input' && (
          <>
            <p className="text-sm text-gray-500 mb-2">
              {isExistingDesign ? "Enter a name for the copy:" : "Give your design a name:"}
            </p>
            
            <input 
              type="text" 
              className="save-name-input"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter design name..."
              autoFocus
            />

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => isExistingDesign ? setMode('choice') : onClose()}>
                {isExistingDesign ? 'Back' : 'Cancel'}
              </button>
              <button 
                className="btn primary" 
                onClick={handleFinalConfirm} 
                disabled={isSaving || !designName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Design'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ✅ THIS FIXES THE "TOP BAR" ISSUE
  return ReactDOM.createPortal(modalContent, document.body);
};

export default SavePromptModal;