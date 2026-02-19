// src/design-tool/components/ContextMenu.jsx
import React, { useEffect, useRef } from 'react';
import { 
  Scissors, 
  Copy, 
  ClipboardPaste, 
  Trash2, 
  CopyPlus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function ContextMenu({ 
  x, 
  y, 
  isOpen, 
  onClose, 
  actions, 
  hasSelection, 
  hasClipboard 
}) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Use mousedown to catch it before click events fire on canvas
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Prevent menu from going off-screen
  const menuStyle = {
    top: `${y}px`,
    left: `${x}px`,
    // If it's too close to the right/bottom edge, you might want to adjust these, 
    // but fixed absolute positioning works well for standard right-clicks.
  };

  const MenuItem = ({ icon: Icon, label, onClick, disabled, danger }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick();
          onClose();
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed text-slate-500' : 'hover:bg-slate-700 text-slate-200'}
        ${danger && !disabled ? 'hover:text-red-400' : ''}
      `}
    >
      <Icon size={16} />
      <span>{label}</span>
      {/* Keyboard shortcut hints */}
      <span className="ml-auto text-[10px] tracking-widest text-slate-500 opacity-60 font-mono">
        {label === 'Copy' && '⌘C'}
        {label === 'Cut' && '⌘X'}
        {label === 'Paste' && '⌘V'}
      </span>
    </button>
  );

  return (
    <div 
      ref={menuRef}
      style={menuStyle}
      className="fixed z-[9999] w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()} // Prevent native right-click on this menu
    >
      <MenuItem 
        icon={Scissors} 
        label="Cut" 
        onClick={actions.onCut} 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={Copy} 
        label="Copy" 
        onClick={actions.onCopy} 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={ClipboardPaste} 
        label="Paste" 
        onClick={actions.onPaste} 
        disabled={!hasClipboard} 
      />
      
      <div className="h-[1px] bg-white/10 my-1.5 mx-2" />
      
      <MenuItem 
        icon={CopyPlus} 
        label="Duplicate" 
        onClick={actions.onDuplicate} 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={ArrowUp} 
        label="Bring Forward" 
        onClick={actions.onLayerUp} 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={ArrowDown} 
        label="Send Backward" 
        onClick={actions.onLayerDown} 
        disabled={!hasSelection} 
      />

      <div className="h-[1px] bg-white/10 my-1.5 mx-2" />
      
      <MenuItem 
        icon={Trash2} 
        label="Delete" 
        onClick={actions.onDelete} 
        disabled={!hasSelection} 
        danger={true}
      />
    </div>
  );
}