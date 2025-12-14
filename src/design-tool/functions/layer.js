// src/functions/layer.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

/**
 * Replaces the current canvas object array with a new, reordered array.
 * This is used specifically after a drag-and-drop operation.
 * @param {Array} newObjects - The newly ordered array of canvas objects.
 */
export function reorderLayers(newObjects) {
  // Dispatch the new, reordered array to Redux history
  store.dispatch(setCanvasObjects(newObjects));
}