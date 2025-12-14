// src/pages/Editor.jsx
import React from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import { useState, useEffect } from 'react';
import Text from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import RightSidebarTabs from '../components/RightSidebarTabs';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainToolbar from '../components/MainToolbar';
import ContextualSidebar from '../components/ContextualSidebar';
import {
    FiTrash2, FiRotateCcw, FiRotateCw, FiDownload, FiShoppingBag,
    FiSettings, FiX
} from 'react-icons/fi';


export default function EditorPanel() {
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [editingDesignId, setEditingDesignId] = useState(null);

    // Manual control for properties panel
    const [showProperties, setShowProperties] = useState(false);

    // Close properties panel automatically when selection changes
    useEffect(() => {
        setShowProperties(false);
    }, [selectedId]);

    const userId = 'test-user-123';
    const navigation = useNavigate()
    const dispatch = useDispatch();
    const canvasObjects = useSelector((state) => state.canvas.present);
    const past = useSelector((state) => state.canvas.past);
    const future = useSelector((state) => state.canvas.future);

    const { addText, addHeading, addSubheading } = Text(setSelectedId, setActiveTool);

    const [activePanel, setActivePanel] = useState('text');

    const handleToolClick = (tool) => {
        setActivePanel(prev => prev === tool ? null : tool);
    };

    const BrandDisplay = (
        <div className="header-brand toolbar-brand">
            <div className="logo-circle">
                <img
                    src="/assets/LOGO.png"
                    alt="TRYAM Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>
            <h1>TRYAM</h1>
        </div>
    );

    return (
        <div className="main-app-container">
            <div className="main full-height-main">

                <MainToolbar
                    activePanel={activePanel}
                    onSelectTool={handleToolClick}
                    setSelectedId={setSelectedId}
                    setActiveTool={setActiveTool}
                    navigation={navigation}
                    brandDisplay={BrandDisplay}
                    fabricCanvas={fabricCanvas}
                />

                {activePanel && (
                    <ContextualSidebar
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        addText={addText}
                        addHeading={addHeading}
                        addSubheading={addSubheading}
                    />
                )}

                <main className="preview-area">
                    {/* Consolidated Top Bar */}
                    <div className="top-bar consolidated-bar">

                        {/* Undo/Redo Group */}
                        <div className="control-group">
                            <button
                                title="Undo"
                                className="top-bar-button"
                                onClick={() => dispatch(undo())}
                                disabled={past.length === 0}
                                style={{ opacity: past.length === 0 ? 0.25 : 1 }}
                            >
                                <FiRotateCcw size={18} />
                            </button>
                            <button
                                title="Redo"
                                className="top-bar-button"
                                onClick={() => dispatch(redo())}
                                disabled={future.length === 0}
                                style={{ opacity: future.length === 0 ? 0.25 : 1 }}
                            >
                                <FiRotateCw size={18} />
                            </button>
                        </div>

                        <div className="control-group divider">
                            <button title="Delete" className="top-bar-button danger" onClick={() => removeObject(selectedId)} style={{ opacity: !selectedId ? 0.25 : 1 }}>
                                <FiTrash2 size={18} />
                            </button>
                        </div>

                        {/* Edit Properties Button - Removed inline margin so CSS can handle spacing */}
                        {selectedId && !showProperties && (
                            <div className="control-group phone-only">
                                <button
                                    className="top-bar-button accent"
                                    onClick={() => setShowProperties(true)}
                                    title="Edit Properties"
                                >
                                    <FiSettings size={18} />
                                    <span>Edit</span>
                                </button>
                            </div>
                        )}

                        <div className="control-group">
                            {fabricCanvas && (
                                <SaveDesignButton
                                    canvas={fabricCanvas}
                                    userId={userId}
                                    currentDesign={currentDesign}
                                    editingDesignId={editingDesignId}
                                    className="top-bar-button"
                                />
                            )}

                            <button title="Download" className="top-bar-button text-button">
                                <FiDownload size={18} />
                                <span>Export</span>
                            </button>

                            <button
                                title="Order Print"
                                className="top-bar-button text-button accent"
                                onClick={() => navigation('/checkout')}
                            >
                                <FiShoppingBag size={18} />
                                <span>Order</span>
                            </button>
                        </div>

                    </div>

                    <CanvasEditor
                        setFabricCanvas={setFabricCanvas}
                        canvasObjects={canvasObjects}
                        selectedId={selectedId}
                        setActiveTool={setActiveTool}
                        setSelectedId={setSelectedId}
                        fabricCanvas={fabricCanvas}
                        setCurrentDesign={setCurrentDesign}
                        setEditingDesignId={setEditingDesignId}
                        past={past}
                    />
                </main>

                <aside className={`right-panel ${showProperties ? 'active' : ''}`}>
                    <div className="mobile-panel-header">
                        <span className="mobile-panel-title">Edit Properties</span>
                        <button onClick={() => setShowProperties(false)} className="mobile-close-btn">
                            <FiX size={20} />
                        </button>
                    </div>

                    <RightSidebarTabs
                        id={selectedId}
                        type={activeTool}
                        object={canvasObjects.find((obj) => obj.id === selectedId)}
                        updateObject={updateObject}
                        removeObject={removeObject}
                        addText={addText}
                        fabricCanvas={fabricCanvas}
                        setSelectedId={setSelectedId}
                    />
                </aside>
            </div>
        </div>
    );
}

// https://github.com/TRYAM193/DesignPage.git
// powershell -ExecutionPolicy Bypass -File autosync.ps1