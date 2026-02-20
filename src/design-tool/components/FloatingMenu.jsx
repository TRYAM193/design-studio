// src/components/FloatingMenu.jsx
import React, { useState, useEffect } from 'react';
import {
  FiTrash2, FiMoreHorizontal, FiUnlock, FiLock,
  FiArrowUp, FiArrowDown, FiChevronsUp, FiChevronsDown,
} from 'react-icons/fi';
import { LuFlipHorizontal, LuFlipVertical } from "react-icons/lu";
import { PaintRoller, Scissors, ClipboardPaste, CopyPlus } from 'lucide-react';

export default function FloatingMenu({ position, onAction, isLocked, isPasteAvailable }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!position) return null;

  // --- STYLE OBJECTS ---
  const style = {
    position: 'absolute',
    left: position.left,
    top: position.top - 60,
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    gap: '8px',
    zIndex: 1000,
    alignItems: 'center',
    flexWrap: 'nowrap'
  };

  const btnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
    fontSize: '18px',
  };

  // --- ACTIONS ---
  const actions = [
    {
      id: 'duplicate',
      icon: <CopyPlus />,
      label: 'Duplicate',
      mobilePriority: 1
    },
    {
      id: 'delete',
      icon: <FiTrash2 color="red" />,
      label: 'Delete',
      mobilePriority: 2
    },
    {
      id: 'toggleLock',
      // ⚡ FIX: Dynamically switch icon based on isLocked prop
      icon: isLocked ? <FiLock color="orange" /> : <FiUnlock />,
      label: isLocked ? 'Unlock' : 'Lock',
      mobilePriority: 3
    },
    { id: 'copy', icon: <PaintRoller size={18} />, label: 'Copy Design' },
    { id: 'cut', icon: <Scissors size={18} />, label: 'Cut' },
    { id: 'paste', icon: <ClipboardPaste size={18} />, label: 'Paste' },
    { id: 'bringForward', icon: <FiArrowUp />, label: 'Bring Forward' },
    { id: 'sendBackward', icon: <FiArrowDown />, label: 'Send Backward' },
    { id: 'bringToFront', icon: <FiChevronsUp />, label: 'To Front' },
    { id: 'sendToBack', icon: <FiChevronsDown />, label: 'To Back' },
    { id: 'flipHorizontal', icon: <LuFlipHorizontal />, label: 'Flip H' },
    { id: 'flipVertical', icon: <LuFlipVertical />, label: 'Flip V' },
  ];

  // --- RENDER LOGIC ---
  let visibleActions = actions;
  let hiddenActions = [];

  if (isMobile) {
    visibleActions = actions.filter(a => a.mobilePriority);
    hiddenActions = actions.filter(a => !a.mobilePriority);
  }

  return (
    <div style={style} className="floating-menu animate-fade-in">
      {visibleActions.map((action) => (
        <button
          key={action.id}
          style={btnStyle}
          onClick={() => onAction(action.id)}
          title={action.label}
          className={action.id === 'paste' ? isPasteAvailable ? 'opacity-100' : 'opacity-20' : ''}
          disabled={action.id === 'paste' ? !isPasteAvailable : false}
        >
          {action.icon}
        </button>
      ))}

      {isMobile && (
        <div style={{ position: 'relative' }} >
          <button style={btnStyle} onClick={() => setShowMore(!showMore)}>
            <FiMoreHorizontal />
          </button>
          {showMore && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: 'max-content',
              marginTop: '8px',
              maxHeight: '33vh',
              overflowX: 'auto'
            }}>
              {hiddenActions.map((action) => (
                <button
                  key={action.id}
                  style={{ ...btnStyle, justifyContent: 'flex-start', fontSize: '14px', width: '100%', color:'black' }}
                  onClick={() => {
                    onAction(action.id);
                    setShowMore(false);
                  }}
                >
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}