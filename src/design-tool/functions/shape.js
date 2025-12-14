// src/functions/shape.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { v4 as uuidv4 } from 'uuid'; // Ensure you have uuid installed

function addShape(type, props) {
    const state = store.getState();
    const canvasObjects = state.canvas.present;

    const newShape = {
        id: uuidv4(), 
        type,
        props: {
            left: 300,  // Place in a visible area
            top: 300,
            fill: '#3b82f6', // Default Blue color
            stroke: '#000000',
            strokeWidth: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            ...props // Allow overriding defaults
        }
    };
    
    store.dispatch(setCanvasObjects([...canvasObjects, newShape]));
}

export const addRectangle = () => {
  addShape('rect', { width: 100, height: 100, fill: '#6366f1' }); // Indigo
};

export const addCircle = () => {
  addShape('circle', { radius: 50, width: 100, height: 100, fill: '#ec4899' }); // Pink
};

export const addTriangle = () => {
  addShape('triangle', { width: 100, height: 100, fill: '#10b981' }); // Green
};