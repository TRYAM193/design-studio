// src/functions/text.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function Text(setSelectedId, setActiveTool) {
  // Use a fresh reference to state inside the function call to ensure current data
  const getCanvasObjects = () => store.getState().canvas.present;

  function handleAddText(obj) {
    const currentObjects = getCanvasObjects();
    const newObjects = [...currentObjects, obj];
    store.dispatch(setCanvasObjects(newObjects));
    if (setActiveTool) setActiveTool(obj.type);
    if (setSelectedId) setSelectedId(obj.id);
  }

  const addText = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'New Text',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 30,
        fontFamily: 'Arial',
        opacity: 1,
        textEffect: 'straight'
      },
    };
    handleAddText(newText);
  };

  const addHeading = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'Heading',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 68,
        fontFamily: 'Helvetica Neue',
        fontWeight: 'bold',
        opacity: 1,
        textEffect: 'straight'
      },
    };
    handleAddText(newText);
  };

  const addSubheading = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'Sub Heading',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 50,
        fontFamily: 'Helvetica Neue',
        fontWeight: 'bold',
        opacity: 1,
        textEffect: 'straight'
      },
    };
    handleAddText(newText);
  };

  return { addText, addHeading, addSubheading };
}