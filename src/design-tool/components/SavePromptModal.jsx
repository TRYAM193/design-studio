import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FiFile, FiCopy, FiX, FiSave, FiCornerUpLeft } from 'react-icons/fi';

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
    // "Update" -> Overwrite existing, keep same name
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={!isSaving ? onClose : undefined}
      />

      {/* Modal Box - Cosmic Theme */}
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {mode === 'choice' ? (
                <>
                    <FiSave className="text-orange-500" /> Save Changes
                </>
            ) : (
                <>
                    <FiFile className="text-orange-500" /> {isExistingDesign ? "Save Copy" : "Name Design"}
                </>
            )}
          </h3>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* --- MODE: CHOICE (Existing Design) --- */}
        {mode === 'choice' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              You are editing an existing design. How would you like to proceed?
            </p>
            
            <div className="grid gap-3">
              {/* Option 1: Overwrite */}
              <button 
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-orange-500/50 transition-all group text-left"
                onClick={handleUpdateClick} 
                disabled={isSaving}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-transform">
                  <FiFile size={20} />
                </div>
                <div>
                  <strong className="block text-white text-sm">Update Existing</strong>
                  <span className="text-xs text-slate-500">Overwrite the current file</span>
                </div>
              </button>

              {/* Option 2: Save as Copy */}
              <button 
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-green-500/50 transition-all group text-left"
                onClick={handleSaveAsCopyClick} 
                disabled={isSaving}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-transform">
                  <FiCopy size={20} />
                </div>
                <div>
                  <strong className="block text-white text-sm">Save as New</strong>
                  <span className="text-xs text-slate-500">Create a separate copy</span>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
                <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors" onClick={onClose}>
                    Cancel
                </button>
            </div>
          </div>
        )}

        {/* --- MODE: INPUT (New Design OR Copy) --- */}
        {mode === 'input' && (
          <div className="space-y-5">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {isExistingDesign ? "Name your copy" : "Name your design"}
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-600"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="e.g. My Awesome Shirt"
                  autoFocus
                />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium flex items-center justify-center gap-2"
                onClick={() => isExistingDesign ? setMode('choice') : onClose()}
                disabled={isSaving}
              >
                {isExistingDesign ? <><FiCornerUpLeft /> Back</> : 'Cancel'}
              </button>
              
              <button 
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleFinalConfirm} 
                disabled={isSaving || !designName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Design'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SavePromptModal;