import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './canvasSlice';

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
  },
});
