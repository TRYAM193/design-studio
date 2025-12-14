
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  past: [],
  present: [],
  future: [],
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setCanvasObjects: (state, action) => {
      // Save a snapshot of current state (not a reference!)
      state.past.push([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = action.payload.map(obj => JSON.parse(JSON.stringify(obj))); // always copy
      state.future = [];
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      const previous = state.past.pop();
      state.future.unshift([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = previous;
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      const next = state.future.shift();
      state.past.push([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = next;
    },
  },
});

export const { setCanvasObjects, undo, redo } = canvasSlice.actions;
export default canvasSlice.reducer;
