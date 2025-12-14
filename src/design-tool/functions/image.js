import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function addImage(obj) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;

  const newImage = {
    id: obj.customId,
    type: 'image',
    src: obj.getSrc(),
    props: {
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      opacity: obj.opacity,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      angle: obj.angle || 0,
    }
  } 

  const newObjects = [...canvasObjects, newImage]
  store.dispatch(setCanvasObjects(newObjects))
}
