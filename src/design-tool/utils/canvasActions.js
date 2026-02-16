// src/utils/canvasActions.js
import { v4 as uuidv4 } from 'uuid';

export const handleCanvasAction = (action, selectedIds, canvasObjects, dispatch, setCanvasObjects, setActiveTool, setSelectedId) => {
  if (!selectedIds || selectedIds.length === 0 || !canvasObjects) return;

  // We operate on a copy of the array
  let newObjects = [...canvasObjects];

  switch (action) {
    // --- DELETE (Multi) ---
    case 'delete':
      // Filter OUT any object that is in the selectedIds list
      newObjects = newObjects.filter(obj => !selectedIds.includes(obj.id));
      setActiveTool(null);
      setSelectedId(null);
      break;

    // --- DUPLICATE (Multi) ---
    case 'duplicate':
      // Find all objects to duplicate
      const objectsToDuplicate = newObjects.filter(obj => selectedIds.includes(obj.id));
      
      const duplicates = objectsToDuplicate.map(obj => ({
        ...obj,
        id: uuidv4(), // New ID
        props: {
          ...obj.props,
          left: (obj.props.left || 0) + 20, // Offset so they don't stack directly on top
          top: (obj.props.top || 0) + 20
        }
      }));
      
      newObjects = [...newObjects, ...duplicates];
      break;

    // --- LOCK/UNLOCK (Multi) ---
    case 'toggleLock':
      // Check if the *first* object is locked to decide target state (toggle)
      const firstObj = newObjects.find(o => o.id === selectedIds[0]);
      if (!firstObj) return;
      
      const targetLockState = !firstObj.props.lockMovementX; // Toggle based on first

      newObjects = newObjects.map(obj => {
        if (selectedIds.includes(obj.id)) {
          return {
            ...obj,
            props: {
              ...obj.props,
              lockMovementX: targetLockState,
              lockMovementY: targetLockState,
              lockRotation: targetLockState,
              lockScalingX: targetLockState,
              lockScalingY: targetLockState,
              hasControls: !targetLockState, // Hide controls if locked
            }
          };
        }
        return obj;
      });
      break;

    // --- FLIP (Multi) ---
    case 'flipHorizontal':
    case 'flipVertical':
      const prop = action === 'flipHorizontal' ? 'flipX' : 'flipY';
      newObjects = newObjects.map(obj => {
        if (selectedIds.includes(obj.id)) {
          return {
            ...obj,
            props: { ...obj.props, [prop]: !obj.props[prop] }
          };
        }
        return obj;
      });
      break;

    // --- LAYERING (Multi - Simplified) ---
    // Handling Z-index for multi-selection is complex. 
    // This logic moves ALL selected items to Front/Back as a block.
    
    case 'bringToFront':
        // 1. Extract selected objects
        const toFront = newObjects.filter(o => selectedIds.includes(o.id));
        // 2. Remove them from original array
        const remainingFront = newObjects.filter(o => !selectedIds.includes(o.id));
        // 3. Push them to the end (top)
        newObjects = [...remainingFront, ...toFront];
        break;

    case 'sendToBack':
        // 1. Extract selected objects
        const toBack = newObjects.filter(o => selectedIds.includes(o.id));
        // 2. Remove them
        const remainingBack = newObjects.filter(o => !selectedIds.includes(o.id));
        // 3. Unshift them to the start (bottom)
        newObjects = [...toBack, ...remainingBack];
        break;
        
    case 'bringForward':
       if(selectedIds.length === 1) {
           const idx = newObjects.findIndex(o => o.id === selectedIds[0]);
           if (idx < newObjects.length - 1) {
               [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
           }
       }
       break;

    case 'sendBackward':
       if(selectedIds.length === 1) {
           const idx = newObjects.findIndex(o => o.id === selectedIds[0]);
           if (idx > 0) {
               [newObjects[idx], newObjects[idx - 1]] = [newObjects[idx - 1], newObjects[idx]];
           }
       }
       break;

    default:
      return;
  }

  // Dispatch update
  dispatch(setCanvasObjects(newObjects));
};