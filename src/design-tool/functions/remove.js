import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function removeObject(id) {
  if (!id) return;

  const state = store.getState();
  const canvasObjects = state.canvas.present;

  const updatedObjects = canvasObjects.filter((obj) => obj.id !== id);

  store.dispatch(setCanvasObjects(updatedObjects));
}
