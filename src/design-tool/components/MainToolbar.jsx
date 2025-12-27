import React from 'react';
import ImageHandler from './Image';
import {
    FiType, FiImage, FiZap, FiSquare, FiTool, FiFolder
} from 'react-icons/fi';

const ToolButton = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        title={label}
        onClick={onClick}
        className={`tool-button-wrapper ${isActive ? 'active' : ''}`}
    >
        <Icon size={24} />
        {label}
    </button>
);

// ✅ ADDED productId prop
export default function MainToolbar({ 
    activePanel, 
    onSelectTool, 
    setSelectedId, 
    setActiveTool, 
    navigation, 
    brandDisplay, 
    fabricCanvas,
    productId, // <--- Receive this from Editor.jsx
    urlColor,
    urlSize
}) {

    // ✅ NEW: Handle navigation with context
    const handleSavedDesignsClick = () => {
        navigation('/design/saved', { 
            state: { 
                filterMode: productId ? 'product' : 'blank', 
                filterProductId: productId,
                filterColor: urlColor
                Filter
            } 
        });
    };

    return (
        <div className="main-toolbar">
            {brandDisplay}

            <button
                title="Saved Designs"
                onClick={handleSavedDesignsClick} // <--- Use new handler
                className="tool-button-wrapper saved-designs-link"
            >
                <FiFolder size={24} />
                <span>Saved</span>
            </button>
            
            <hr className="toolbar-divider" />

            <ToolButton
                icon={FiType}
                label="Text"
                isActive={activePanel === 'text'}
                onClick={() => onSelectTool('text')}
            />
            <ImageHandler
                setSelectedId={setSelectedId}
                setActiveTool={onSelectTool}
                className={`tool-button-wrapper ${activePanel === 'image' ? 'active' : ''}`}
                fabricCanvas={fabricCanvas}
            >
                <FiImage size={24} />
                <span>Image</span>
            </ImageHandler>
            <ToolButton
                icon={FiSquare}
                label="Shapes"
                isActive={activePanel === 'shapes'}
                onClick={() => onSelectTool('shapes')}
            />
            <ToolButton
                icon={FiZap}
                label="AI"
                isActive={activePanel === 'ai'}
                onClick={() => onSelectTool('ai')}
            />
            <hr className="toolbar-divider" />
            <ToolButton
                icon={FiTool}
                label="More"
                isActive={activePanel === 'more'}
                onClick={() => onSelectTool('more')}
            />
        </div>
    );
}