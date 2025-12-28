// src/design-tool/components/MainToolbar.jsx
import React from 'react';
import ImageHandler from './Image';
import {
    FiType, FiImage, FiZap, FiSquare, FiTool, FiFolder, FiSmile, FiFrown
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

export default function MainToolbar({ 
    activePanel, 
    onSelectTool, 
    setSelectedId, 
    setActiveTool, 
    navigation, 
    brandDisplay, 
    fabricCanvas,
    productId,
    urlColor,
    urlSize
}) {

    // ✅ UPDATED: Switch tool state instead of navigating
    const handleSavedDesignsClick = () => {
        onSelectTool('saved');
    };

    return (
        <div className="main-toolbar">
            {brandDisplay}

            <button
                title="Saved Designs"
                onClick={handleSavedDesignsClick} 
                className={`tool-button-wrapper saved-designs-link ${activePanel === 'saved' ? 'active' : ''}`}
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
            {/* ... Rest of the existing toolbar code ... */}
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