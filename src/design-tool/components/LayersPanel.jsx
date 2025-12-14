// src/components/LayersPanel.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiTrash2 } from 'react-icons/fi';

import { reorderLayers } from '../functions/layer';
import removeObject from '../functions/remove';
import LayerPreview from './LayerPreview';

const DraggableLayerItem = ({ object, index, isSelected, onSelect, onDelete }) => (
    <Draggable draggableId={String(object.id)} index={index}>
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`layer-item 
                    ${isSelected ? 'active' : ''} 
                    ${snapshot.isDragging ? 'is-dragging' : ''}`}
                onClick={() => onSelect(object.id)}
            >
                <div className="layer-content-wrapper">
                    <div className="layer-thumbnail-box">
                        <LayerPreview object={object} />
                    </div>

                    <span className="layer-name">
                        {object.type === 'text'
                            ? object.props?.text
                                ? object.props.text.substring(0, 20)
                                : 'Text'
                            : object.type
                                ? object.type.charAt(0).toUpperCase() + object.type.slice(1)
                                : 'Layer'}
                    </span>
                </div>

                <div className="layer-controls">
                    <button
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(object.id);
                        }}
                        className="delete-button"
                    >
                        <FiTrash2 size={14} />
                    </button>
                </div>
            </div>
        )}
    </Draggable>
);

export default function LayersPanel({ selectedId, setSelectedId, fabricCanvas }) {
    const canvasObjects = useSelector(state => state.canvas.present);
    const [layers, setLayers] = useState([]);

    useEffect(() => {
        const reduxLayers = [...canvasObjects].reverse();
        setLayers(reduxLayers);
    }, [canvasObjects]);

    const onDragEnd = (result) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.index === destination.index) return;

        const newDisplayOrder = Array.from(layers);
        const [removed] = newDisplayOrder.splice(source.index, 1);
        newDisplayOrder.splice(destination.index, 0, removed);

        setLayers(newDisplayOrder);

        const newReduxOrder = [...newDisplayOrder].reverse();
        reorderLayers(newReduxOrder);
    };

    const handleSelectLayer = (id) => {
        setSelectedId(id);

        if (fabricCanvas) {
            const obj = fabricCanvas.getObjects().find(o => o.customId === id);
            if (obj) {
                fabricCanvas.setActiveObject(obj);
                fabricCanvas.renderAll();
            }
        }
    };

    const handleDeleteLayer = (id) => {
        removeObject(id);
        setSelectedId(null);
    };

    return (
        <div className="layers-panel-content">
            <h3 style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>Layers Panel</h3>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className='layer-list-wrapper'>
                    <Droppable droppableId="layer-list-droppable">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="layer-list">

                                {layers.length === 0 && (
                                    <p className="property-panel-message">No objects on the canvas.</p>
                                )}

                                {layers.map((obj, index) => (
                                    <DraggableLayerItem
                                        key={String(obj.id)}
                                        object={obj}
                                        index={index}
                                        isSelected={obj.id === selectedId}
                                        onSelect={handleSelectLayer}
                                        onDelete={handleDeleteLayer}
                                    />
                                ))}

                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>
        </div>
    );
}
