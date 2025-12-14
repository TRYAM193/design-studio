// src/components/ContextualSidebar.jsx
import React from 'react';
import ShapesSidebar from './ShapesSidebar';
import { FiType, FiCircle, FiSunrise, FiFlag } from 'react-icons/fi';

export default function ContextualSidebar({ activePanel, setActivePanel, addText, addHeading, addSubheading }) {

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

  switch (activePanel) {
    case 'text':
      title = "Text Styles & Presets";
      ContentComponent = () => (
        <div className="sidebar-content">
          <button
            onClick={() => addText()}
            className="header-button"
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
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Create with DALL-E</h3>
          {/* This is where the DALL-E input component will go (Next step!) */}
          <textarea rows="4" placeholder="Enter prompt here..." style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', resize: 'none' }}></textarea>
          <button className='header-button bg-green-500 hover:bg-green-600' style={{ width: '100%', marginTop: '10px', backgroundColor: '#28a745' }}>Generate</button>
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
    </aside>
  );
}