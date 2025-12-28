// src/components/ContextualSidebar.jsx
import React, { useState } from 'react';
import ShapesSidebar from './ShapesSidebar';
import SidebarSavedList from './SidebarSavedList';
import { AiGeneratorModal } from './AiGeneratorModal'; // ✅ Import Modal
import addImageToCanvas from '../objectAdders/Image';
import { FiCpu } from 'react-icons/fi';

export default function ContextualSidebar({ activePanel, setActivePanel, addText, addHeading, addSubheading, productId, handleLoadSavedDesign, fabricCanvas,   // ✅ New Prop
  setSelectedId,  // ✅ New Prop
  setActiveTool }) {

  let ContentComponent = null;
  let title = "";

  const presetStyle = {
    padding: '12px',
    border: '1px solid #eee',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    backgroundColor: '#fff',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  };

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleAiImageGenerated = (imageUrl) => {
    // Add the generated image to the canvas using your existing logic
    if (imageUrl && fabricCanvas) {
        addImageToCanvas(imageUrl, setSelectedId, setActiveTool, fabricCanvas);
    }
  };

  switch (activePanel) {
    case 'saved':  // <--- ADD THIS CASE
      title = "Your Saved Designs";
      ContentComponent = () => (
        <SidebarSavedList
          productId={productId}
          onDesignSelect={handleLoadSavedDesign}
        />
      );
      break;
    case 'text':
      title = "Text Styles & Presets";
      ContentComponent = () => (
        <div className="sidebar-content">
          <button
            onClick={() => addText()}
            className="header-button button"
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', color: '#fff' }}
          >
            Add a Text Box
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Font Presets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className='p-3 border rounded-md cursor-pointer hover:bg-gray-100' style={{ padding: '3px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }} onClick={() => addHeading()}><h1 style={{ margin: '0' }}> Add Heading </h1></div>
            <div className='p-3 border rounded-md cursor-pointer hover:bg-gray-100' style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }} onClick={() => addSubheading()}><h3 style={{ margin: '0' }}> Add Subheading </h3></div>
          </div>
        </div>
      );
      break;
    case 'image':
      title = "Image Upload & Library";
      ContentComponent = () => (
        <div className="sidebar-content">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Recent Uploads</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>The upload button is in the left toolbar.</p>
          {/* Future: Grid of recent images */}
        </div>
      );
      break;
    case 'ai':
      title = "AI Design Generator";
      ContentComponent = () => (
        <div className="sidebar-content">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
            <FiCpu size={32} className="mx-auto text-indigo-500 mb-2" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>AI Generator</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px', lineHeight: '1.4' }}>
              Describe what you want and let AI generate unique artwork for your design.
            </p>
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className='header-button' 
                style={{ 
                    width: '100%', 
                    backgroundColor: '#4f46e5', 
                    color: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: 'none',
                    fontWeight: '600'
                }}
            >
                Open Generator
            </button>
          </div>
        </div>
      );
      break;
    case 'shapes':
      title = "Shapes & Lines";
      ContentComponent = ShapesSidebar;
      break;
    default:
      ContentComponent = null;
      title = "";
  }

  // Final content wrapper
  const FinalContent = ContentComponent ? <ContentComponent onClose={() => setActivePanel(null)} /> : null;

  return (
    <aside className="contextual-sidebar">
      {/* Header with Close Button */}
      <div className="sidebar-header">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>{title}</h2>
        <button
          onClick={() => setActivePanel(null)}
          style={{ padding: '8px', borderRadius: '50%', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          title="Close Sidebar"
        >
          &times;
        </button>
      </div>

      {/* Dynamic Content Area */}
      {FinalContent}
      <AiGeneratorModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onImageGenerated={handleAiImageGenerated}
      />
    </aside>
  );
}