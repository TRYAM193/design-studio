// src/design-tool/redux/canvasSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  past: [],
  present: [],
  future: [],
  clipboard: [], // ✅ NEW: Temporary storage for Cut/Copy/Paste
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setCanvasObjects: (state, action) => {
      // Standard action: Save snapshot to past, update present, clear future
      state.past.push([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = action.payload.map(obj => JSON.parse(JSON.stringify(obj)));
      state.future = [];
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      const previous = state.past.pop();
      // Push current to future
      state.future.unshift([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = previous;
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      const next = state.future.shift();
      // Push current to past
      state.past.push([...state.present.map(obj => JSON.parse(JSON.stringify(obj)))]);
      state.present = next;
    },
    setHistory: (state, action) => {
      const { past, present, future } = action.payload;
      state.past = past;
      state.present = present;
      state.future = future;
    },
    // ✅ NEW: Reducer to save copied objects to memory
    setClipboard: (state, action) => {
      state.clipboard = action.payload.map(obj => JSON.parse(JSON.stringify(obj)));
    }
  },
});

// ✅ Export the new setClipboard action
export const { setCanvasObjects, undo, redo, setHistory, setClipboard } = canvasSlice.actions;
export default canvasSlice.reducer;