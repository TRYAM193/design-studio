
// src/functions/update.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function updateObject(id, updates, shouldDispatch=true) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;
  const updatedObjects = canvasObjects.map((obj) =>
    obj.id === id ? { ...obj, props: { ...obj.props, ...updates } } : obj
  );

  if (shouldDispatch) store.dispatch(setCanvasObjects(updatedObjects));
}
