// src/design-tool/components/SavePromptModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/SavePromptModal.css';
import { FiFile, FiCopy } from 'react-icons/fi';

export default function SavePromptModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSaving, 
  currentName, 
  isExistingDesign 
}) {
  const [designName, setDesignName] = useState("");
  const [mode, setMode] = useState('initial'); // 'initial' or 'input'

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDesignName(currentName || "Untitled Design");
      // If it's new, go straight to input. If existing, show choices.
      setMode(isExistingDesign ? 'choice' : 'input'); 
    }
  }, [isOpen, currentName, isExistingDesign]);

  if (!isOpen) return null;

  const handleUpdateClick = () => {
    // Save as Update (keep ID, keep name)
    onConfirm(designName, false); 
  };

  const handleSaveAsCopyClick = () => {
    // Switch to input mode to rename the copy
    setDesignName(`${currentName} (Copy)`);
    setMode('input');
  };

  const handleFinalConfirm = () => {
    // If we are in input mode & existing design, it implies "Save As Copy"
    // If we are in input mode & new design, it implies "Create New"
    const isCopy = isExistingDesign && mode === 'input';
    onConfirm(designName, isCopy);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '400px' }}>
        <h3 className="mb-4 text-lg font-bold">
          {mode === 'choice' ? 'Save Design' : 'Name Your Design'}
        </h3>
        
        {/* MODE A: CHOICE (Update or Copy) */}
        {mode === 'choice' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 mb-2">You are editing an existing design.</p>
            
            <button 
              onClick={handleUpdateClick}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-all text-left group"
              disabled={isSaving}
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-200">
                <FiFile size={20}/>
              </div>
              <div>
                <span className="block font-semibold text-slate-700">Update Existing</span>
                <span className="text-xs text-slate-500">Overwrite "{currentName}"</span>
              </div>
            </button>

            <button 
              onClick={handleSaveAsCopyClick}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-all text-left group"
              disabled={isSaving}
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-full group-hover:bg-green-200">
                <FiCopy size={20}/>
              </div>
              <div>
                <span className="block font-semibold text-slate-700">Save as Copy</span>
                <span className="text-xs text-slate-500">Create a new file</span>
              </div>
            </button>
          </div>
        )}

        {/* MODE B: INPUT (Rename for Copy or New) */}
        {mode === 'input' && (
          <div>
            <p className="text-sm text-slate-500 mb-3">
              {isExistingDesign ? "Enter a name for the copy:" : "Give your design a name to find it easily later."}
            </p>
            
            <input 
              type="text" 
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter design name..."
              className="save-name-input w-full p-2 border rounded mb-4 focus:ring-2 ring-indigo-500 outline-none"
              autoFocus
            />

            <div className="modal-actions flex justify-end gap-2">
              <button 
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded" 
                onClick={() => isExistingDesign ? setMode('choice') : onClose()} 
                disabled={isSaving}
              >
                {isExistingDesign ? 'Back' : 'Cancel'}
              </button>
              <button 
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50" 
                onClick={handleFinalConfirm} 
                disabled={isSaving || !designName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Design'}
              </button>
            </div>
          </div>
        )}
        
        {/* Cancel button for Choice Mode */}
        {mode === 'choice' && (
             <div className="mt-4 text-right">
                <button className="text-xs text-slate-400 hover:text-slate-600" onClick={onClose}>Cancel</button>
             </div>
        )}
      </div>
    </div>
    return ReactDOM.createPortal(modalContent, document.body);
  );
}