// src/components/Image.jsx
import React from 'react';
import { useRef } from 'react';
import Image from '../objectAdders/Image'

// CHANGED: Added 'className' and 'onClick' to props
export default function ImageHandler({setSelectedId, setActiveTool, children, className, fabricCanvas}) { 
  const fileInput = useRef(null);

  const handleClick = () => {
    // 1. Open the file dialog
    fileInput.current.click();
    
    // 2. Trigger the active state in the parent (opens the sidebar)
    if (setActiveTool) {
        setActiveTool('image');
    }
  };

  const handleChange = (event) => {
    const file = event.target.files[0];

    if (file && file.type.substring(0, 5) === 'image') {
      const reader = new FileReader();

      reader.onload = (e) => {
        const src = e.target.result;

        if (src) {
          Image(src, setSelectedId, setActiveTool, fabricCanvas);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* FIX: Apply className directly to the button for correct CSS inheritance */}
      <button onClick={handleClick} className={className}>
        {children || <span>Upload</span>}
      </button>
      <input
        type="file"
        ref={fileInput}
        onChange={handleChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </>
  );
}