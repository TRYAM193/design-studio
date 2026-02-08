// src/design-tool/functions/update.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

/**
 * Helper to check if two values are actually different.
 * Handles primitives and simple objects (like Shadow {blur, color...})
 */
const isValueDifferent = (prev, next) => {
  // 1. Strict equality check (Primitives & Reference)
  if (prev === next) return false;

  // 2. Null checks
  if (prev === null || next === null || prev === undefined || next === undefined) {
    return prev !== next;
  }

  // 3. Object Comparison (e.g. Shadow objects)
  if (typeof prev === 'object' && typeof next === 'object') {
    const keysA = Object.keys(prev);
    const keysB = Object.keys(next);

    // Different number of keys = Different object
    if (keysA.length !== keysB.length) return true;

    // Compare values of every key (Shallow Compare)
    for (const key of keysA) {
      if (prev[key] !== next[key]) return true;
    }
    return false; // Objects look identical
  }

  // 4. Default: They are different
  return true;
};

export default function updateObject(id, updates, shouldDispatch = true) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;

  // 1. Find the target object
  const targetObj = canvasObjects.find((obj) => obj.id === id);
  if (!targetObj) return;

  // 2. 🛡️ CHECK FOR CHANGES:
  // Iterate through keys in 'updates' and compare with existing 'props'.
  // We only proceed if at least ONE key has a DIFFERENT value.
  const hasChanges = Object.keys(updates).some((key) => {
    const existingVal = targetObj.props[key];
    const newVal = updates[key];
    return isValueDifferent(existingVal, newVal);
  });

  // 3. Stop if no changes (Prevents Duplicate History)
  if (!hasChanges) {
    return; 
  }

  // 4. Apply Update & Dispatch
  const updatedObjects = canvasObjects.map((obj) =>
    obj.id === id ? { ...obj, props: { ...obj.props, ...updates } } : obj
  );

  if (shouldDispatch) {
    store.dispatch(setCanvasObjects(updatedObjects));
  }
}