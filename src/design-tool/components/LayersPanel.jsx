// src/design-tool/components/LayersPanel.jsx
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
                className={`layer-item p-3 flex items-center justify-between rounded-md mb-2 border transition-all cursor-pointer
                    ${isSelected 
                        ? 'bg-orange-500/10 border-orange-500/50' 
                        : 'bg-slate-800/40 border-white/5 hover:bg-white/5 hover:border-white/10'}
                    ${snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}`}
                onClick={() => onSelect(object.id)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/5 overflow-hidden flex-shrink-0">
                        <LayerPreview object={object} />
                    </div>

                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {object.type === 'text'
                            ? object.props?.text?.substring(0, 15) || 'Text'
                            : object.type.charAt(0).toUpperCase() + object.type.slice(1)}
                    </span>
                </div>

                <button
                    title="Delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(object.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                    <FiTrash2 size={14} />
                </button>
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
        if (!destination || source.index === destination.index) return;

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
        <div className="layers-panel-content p-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase text-center mb-4 tracking-wider">
                Layers ({layers.length})
            </h3>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className='layer-list-wrapper'>
                    <Droppable droppableId="layer-list-droppable">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="layer-list">
                                {layers.length === 0 && (
                                    <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-white/10 rounded-lg">
                                        Canvas is empty
                                    </div>
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