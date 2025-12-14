// src/components/MainToolbar.jsx
import React from 'react';
import ImageHandler from './Image';
import {
    FiType, FiImage, FiZap, FiSquare, FiTool, FiFolder
} from 'react-icons/fi';

// Component for a single tool button
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

// CHANGED: Added brandDisplay prop
export default function MainToolbar({ activePanel, onSelectTool, setSelectedId, setActiveTool, navigation, brandDisplay, fabricCanvas }) {
    return (
        <div className="main-toolbar">

            {/* FIX: Render Brand Display at the very top */}
            {brandDisplay}

            {/* Saved Designs Link (Now below the brand) */}
            <button
                title="Saved Designs"
                onClick={() => navigation('/saved-designs')}
                className="tool-button-wrapper saved-designs-link"
            >
                <FiFolder size={24} />
                <span>Saved</span>
            </button>
            <hr className="toolbar-divider" />

            {/* ... rest of tools remain the same ... */}
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