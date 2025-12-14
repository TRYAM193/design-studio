import React from "react";
import "../styles/SavePromptModal.css";

const SavePromptModal = ({ open, onClose, onSaveCopy, onOverwrite }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h3>Save Edited Design</h3>
        <p>Do you want to save this as a copy or overwrite the existing design?</p>

        <div className="modal-actions">
          <button className="btn copy" onClick={onSaveCopy}>
            Save as Copy
          </button>
          <button className="btn overwrite" onClick={onOverwrite}>
            Save
          </button>
        </div>

        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default SavePromptModal;
