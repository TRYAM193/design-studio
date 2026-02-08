// src/design-tool/components/RightSidebarTabs.jsx
import React, { useState } from 'react';
import Toolbar from './Toolbar';
import { FiLayers, FiSliders, FiSave } from 'react-icons/fi';
import LayersPanel from './LayersPanel';
import { handleSaveTemp } from '../utils/saveDesign';

export default function RightSidebarTabs(props) {
  const [activeTab, setActiveTab] = useState('properties');
  if (!props.object && !props.type && !props.id) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/30 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden group">
             {/* Subtle Shine Effect */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             
             <FiLayers size={32} className="text-slate-600 group-hover:text-indigo-400 transition-colors duration-300" />
          </div>
          
          <h3 className="text-sm font-bold text-slate-300 mb-1 tracking-wide">No Selection</h3>
          <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
              Click on any element in the canvas to customize its properties, style, and effects.
          </p>
        </div>
      );
    }

  return (
    <div className="right-sidebar-tabs h-full flex flex-col">

      {/* Tab Selector Bar */}
      <div className="tab-selector-bar flex border-b border-white/10 bg-slate-900/50">
        <button
          className={`tab-button flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
            ${activeTab === 'properties' 
              ? 'text-orange-500 border-b-2 border-orange-500 bg-white/5' 
              : 'text-slate-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent'}`}
          onClick={() => setActiveTab('properties')}
        >
          <FiSliders size={16} />
          <span>Properties</span>
        </button>
        <button
          className={`tab-button flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
            ${activeTab === 'layers' 
              ? 'text-orange-500 border-b-2 border-orange-500 bg-white/5' 
              : 'text-slate-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent'}`}
          onClick={() => setActiveTab('layers')}
        >
          <FiLayers size={16} />
          <span>Layers</span>
        </button>
      </div>

      {/* Dev/Debug Button - Styled nicely now */}
      <div className="p-2 border-b border-white/5">
        <button 
            onClick={() => handleSaveTemp(props.fabricCanvas)}
            className="w-full text-xs py-1.5 px-3 rounded border border-dashed border-slate-600 text-slate-500 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-2"
        >
            <FiSave size={12} /> Save JSON Debug
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="tab-content-area flex-grow overflow-y-auto no-scrollbar">
        {activeTab === 'properties' && (
          <Toolbar
            id={props.id}
            type={props.type}
            object={props.object}
            updateObject={props.updateObject}
            removeObject={props.removeObject}
            addText={props.addText}
            fabricCanvas={props.fabricCanvas}
          />
        )}

        {activeTab === 'layers' && (
          <LayersPanel
            selectedId={props.id}
            setSelectedId={props.setSelectedId}
            fabricCanvas={props.fabricCanvas}
          />
        )}
      </div>
    </div>
  );
}