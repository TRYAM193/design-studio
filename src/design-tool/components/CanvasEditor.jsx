// src/design-tool/components/CanvasEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as fabric from 'fabric';
import StraightText from '../objectAdders/straightText';
import CircleText from '../objectAdders/CircleText';
import updateObject from '../functions/update';
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { FabricImage } from 'fabric';
import updateExisting from '../utils/updateExisting';
import FloatingMenu from './FloatingMenu';
import { handleCanvasAction } from '../utils/canvasActions';
import ShapeAdder from '../objectAdders/Shapes';

// --- HELPERS ---

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Extend toObject to include custom properties
fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    return toObject.call(
      this,
      (propertiesToInclude || []).concat([
        'customId', 'textStyle', 'textEffect', 'radius', 'effectValue',
        'selectable', 'lockMovementX', 'lockMovementY'
      ])
    );
  };
})(fabric.Object.prototype.toObject);

const isDifferent = (val1, val2) => {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return Math.abs(val1 - val2) > 0.1;
  }
  return val1 !== val2;
};

export default function CanvasEditor({
  setActiveTool,
  setSelectedId,
  setFabricCanvas,
  fabricCanvas,
  printDimensions, // Comes from productData.canvas_size (e.g., 420x560)
  productId,
  activeView,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const wrapperRef = useRef(null);
  const canvasObjects = useSelector((state) => state.canvas.present);
  const previousStatesRef = useRef(new Map());
  const dispatch = useDispatch();

  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedObjectLocked, setSelectedObjectLocked] = useState(false);
  const [selectedObjectUUIDs, setSelectedObjectUUIDs] = useState([]);
  const shapes = ['rect', 'circle', 'triangle', 'star', 'pentagon', 'hexagon', 'line', 'arrow', 'diamond', 'trapezoid', 'heart', 'lightning', 'bubble'];

  // ✅ 1. Determine Logical Canvas Size (The "Real" Size)
  const getLogicalSize = () => {
    if (productId && printDimensions?.width && printDimensions?.height) {
      return { width: printDimensions.width, height: printDimensions.height };
    }
    // Default size if no product selected
    return { width: 800, height: 930 };
  };

  // ✅ 2. RESIZE & CENTER LOGIC (The "Fit" Size)
  const fitCanvasToScreen = (canvas, containerW, containerH) => {
    if (!canvas) return;

    const { width: targetW, height: targetH } = getLogicalSize();
    
    // Calculate Padding
    const padding = containerW < 768 ? 20 : 50;
    const availW = containerW - padding;
    const availH = containerH - padding;

    // Calculate Zoom to fit the Logical Size into Available Screen Space
    const scale = Math.min(1, availW / targetW, availH / targetH);

    // Apply Dimensions & Zoom
    // We resize the canvas element to match the Scaled Size
    canvas.setDimensions({
        width: targetW * scale,
        height: targetH * scale
    });

    // We set Zoom so internal coordinates (e.g. 420px) map to the scaled pixels
    canvas.setZoom(scale);

    // Update Control Handles to stay touchable
    const controlSize = containerW < 768 ? 24 : 12;
    fabric.Object.prototype.set({
        cornerSize: controlSize / scale,
        touchCornerSize: 40 / scale,
        transparentCorners: false,
        borderScaleFactor: 2 / scale,
    });

    canvas.requestRenderAll();
  };

  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();

    if (activeObj) {
      // Calculate screen coordinates relative to canvas DOM element
      const vpt = canvas.getViewportTransform();
      const objectCenter = activeObj.getCenterPoint();
      
      const screenX = objectCenter.x * vpt[0] + vpt[4];
      const screenY = objectCenter.y * vpt[3] + vpt[5];
      const scaledHeight = activeObj.getScaledHeight() * vpt[3];

      setMenuPosition({
        left: screenX,
        top: screenY - (scaledHeight / 2) - 60
      });

      if (activeObj.type === 'activeselection' || activeObj.type === 'group') {
        const ids = activeObj.getObjects().map(o => o.customId);
        setSelectedObjectUUIDs(ids);
        setSelectedObjectLocked(activeObj.getObjects().some(o => o.lockMovementX));
      } else {
        setSelectedObjectUUIDs([activeObj.customId]);
        setSelectedObjectLocked(activeObj.lockMovementX === true);
      }
    } else {
      setMenuPosition(null);
      setSelectedObjectUUIDs([]);
    }
  };

  // ✅ 3. INITIALIZE CANVAS & GESTURES
  useEffect(() => {
    let canvas = fabricCanvasRef.current;
    if (!canvas) {
      canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#ffffff', // White Paper Background
        selection: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      setInitialized(true);

      // --- ADD SHADOW STYLE TO CANVAS CONTAINER ---
      // This makes it look like a paper sheet
      if (canvas.wrapperEl) {
          canvas.wrapperEl.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
          canvas.wrapperEl.style.border = "1px solid #e2e8f0";
      }

      // --- PINCH GESTURES ---
      canvas.on('touch:gesture', function(opt) {
          if (opt.e.touches && opt.e.touches.length === 2) {
              const activeObj = canvas.getActiveObject();
              
              // CASE A: RESIZE OBJECT (Pinch on Object)
              if (activeObj) {
                  if (opt.self.state === 'start') {
                      activeObj._startScaleX = activeObj.scaleX;
                      activeObj._startScaleY = activeObj.scaleY;
                  } else if (opt.self.state === 'change') {
                      const newScale = opt.self.scale; 
                      activeObj.set({
                          scaleX: activeObj._startScaleX * newScale,
                          scaleY: activeObj._startScaleY * newScale
                      });
                      activeObj.setCoords();
                      canvas.requestRenderAll();
                  }
                  opt.e.preventDefault();
                  opt.e.stopPropagation();
              } 
              
              // CASE B: ZOOM PAPER (Pinch on Background)
              else {
                  if (opt.self.state === 'start') {
                      canvas._startZoom = canvas.getZoom();
                  } else if (opt.self.state === 'change') {
                      // Calculate new zoom
                      let newZoom = canvas._startZoom * opt.self.scale;
                      
                      // Clamp limits
                      if (newZoom > 5) newZoom = 5;
                      if (newZoom < 0.2) newZoom = 0.2;

                      const { width: logicalW, height: logicalH } = getLogicalSize();
                      
                      // Update Dimensions & Zoom together to keep it valid
                      canvas.setDimensions({
                          width: logicalW * newZoom,
                          height: logicalH * newZoom
                      });
                      canvas.setZoom(newZoom);
                  }
              }
          }
      });
    }

    const resizeCanvas = () => {
      if (wrapperRef.current && canvas) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        fitCanvasToScreen(canvas, clientWidth, clientHeight);
      }
    };

    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    resizeCanvas();

    return () => ro.disconnect();
  }, [printDimensions, productId]); // Re-run when product changes dimensions

  // ✅ 4. SELECTION EVENTS
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleSelection = (e) => {
      if (isSyncingRef.current) return;
      const selected = e.selected?.[0];
      if (selected) {
        setSelectedId(selected.customId);
        setActiveTool(selected.textEffect === 'circle' ? 'circle-text' : selected.type);
        updateMenuPosition();
      }
    };

    const handleCleared = () => {
      if (isSyncingRef.current) return;
      setSelectedId(null);
      setActiveTool(null);
      setMenuPosition(null);
    };

    const handleMoving = () => {
      if (isSyncingRef.current) return;
      updateMenuPosition();
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);
    canvas.on('object:moving', handleMoving);
    canvas.on('object:scaling', handleMoving);
    canvas.on('object:rotating', handleMoving);
    canvas.on('object:modified', handleMoving);

    return () => {
      canvas.off('selection:created', handleSelection);
      // ... cleanup ...
      canvas.off('object:modified', handleMoving);
    };
  }, [fabricCanvas, setSelectedId, setActiveTool]);

  // ✅ 5. OBJECT MODIFICATION HANDLER
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleObjectModified = (e) => {
      if (isSyncingRef.current) return;
      updateMenuPosition();

      let obj = e.target;
      if (!obj) return;
      
      const type = obj.type ? obj.type.toLowerCase() : '';

      if (type === 'text' || type === 'textbox') {
        const newFontSize = obj.fontSize * obj.scaleX;
        obj.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
        obj.setCoords();
        fabricCanvas.renderAll();
        updateObject(obj.customId, {
          fontSize: newFontSize,
          left: obj.left,
          top: obj.top,
          angle: obj.angle,
        });
        return;
      }

      updateObject(obj.customId, {
        left: obj.left,
        top: obj.top,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        width: obj.width,
        height: obj.height,
      });
    };

    fabricCanvas.on('object:modified', handleObjectModified);
    return () => {
      fabricCanvas.off('object:modified', handleObjectModified);
    };
  }, []);

  // ✅ 6. SYNC REDUX STATE → FABRIC
  useEffect(() => {
    if (!initialized) return;
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    let selectedIds = [];
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.type === 'activeselection') {
      selectedIds = activeObject.getObjects().map(o => o.customId);
      fabricCanvas.discardActiveObject();
    } else if (activeObject) {
      selectedIds = [activeObject.customId];
    }

    isSyncingRef.current = true;
    const fabricObjects = fabricCanvas.getObjects();

    canvasObjects.forEach(async (objData) => {
      const currentString = JSON.stringify(objData);
      const previousString = previousStatesRef.current.get(objData.id);

      if (currentString === previousString) return;

      let existing = fabricObjects.find((o) => o.customId === objData.id);

      // --- TEXT & SHAPES ---
      if (['text', 'textbox', 'i-text'].includes(objData.type) || shapes.includes(objData.type)) {
        const isCircle = objData.props.textEffect === 'circle';
        if (existing && existing.type === objData.type && !isCircle) {
          existing.set(objData.props);
          existing.setCoords();
        } else {
          if (existing) fabricCanvas.remove(existing);
          let newObj;
          if (isCircle) newObj = CircleText(objData);
          else if (shapes.includes(objData.type)) newObj = ShapeAdder(objData);
          else newObj = StraightText(objData);
          
          if (newObj) {
            newObj.customId = objData.id;
            fabricCanvas.add(newObj);
          }
        }
      }

      // --- IMAGES ---
      if (objData.type === 'image') {
         if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
            try {
               const newObj = await FabricImage.fromURL(objData.src, { ...objData.props });
               newObj.set({ customId: objData.id });
               fabricCanvas.add(newObj);
            } catch (err) { console.error(err); }
         } else if (existing) {
            updateExisting(existing, objData, isDifferent);
         }
      }

      previousStatesRef.current.set(objData.id, currentString);
    });

    // Cleanup Orphans
    const reduxIds = new Set(canvasObjects.map(o => o.id));
    fabricObjects.forEach((obj) => {
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

    // Restore Selection
    if (selectedIds.length > 0) {
      const objectsToSelect = fabricCanvas.getObjects().filter(obj => selectedIds.includes(obj.customId));
      if (objectsToSelect.length > 1) {
        const selection = new fabric.ActiveSelection(objectsToSelect, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(selection);
      } else if (objectsToSelect.length === 1) {
        fabricCanvas.setActiveObject(objectsToSelect[0]);
      }
    }

    fabricCanvas.requestRenderAll();
    setTimeout(() => {
      updateMenuPosition();
      isSyncingRef.current = false;
    }, 50);

  }, [canvasObjects, initialized]);

  const onMenuAction = (action) => {
    handleCanvasAction(
      action,
      selectedObjectUUIDs,
      store.getState().canvas.present,
      dispatch,
      setCanvasObjects
    );
  };

  // ✅ CSS: Flex Center Wrapper
  return (
    <div 
      ref={wrapperRef} 
      id="canvas-wrapper" 
      className="relative w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden"
    >
      <canvas ref={canvasRef} id="canvas" />

      {menuPosition && selectedObjectUUIDs.length > 0 && (
        <FloatingMenu
          position={menuPosition}
          onAction={onMenuAction}
          isLocked={selectedObjectLocked}
        />
      )}
    </div>
  );
}