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
  printDimensions, // e.g. { width: 4500, height: 5400 }
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

  // ✅ SMART FIT FUNCTION: Centers the (0,0) based design in the view
  const fitDesignToScreen = (canvas, containerW, containerH) => {
    if (!canvas || !printDimensions.width || !printDimensions.height) return;

    // Responsive Padding
    const padding = containerW < 768 ? 20 : 60;
    const availW = containerW - padding;
    const availH = containerH - padding;

    // Calculate Zoom to fit Print Dimensions into Container
    const scaleX = availW / printDimensions.width;
    const scaleY = availH / printDimensions.height;
    const zoom = Math.min(scaleX, scaleY);

    // Calculate Center Offsets
    // This shifts the (0,0) point to the middle of the screen
    const centerX = (containerW - printDimensions.width * zoom) / 2;
    const centerY = (containerH - printDimensions.height * zoom) / 2;

    // Apply Transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    canvas.setViewportTransform([zoom, 0, 0, zoom, centerX, centerY]);

    // Update Controls for Mobile/Desktop
    const controlSize = containerW < 768 ? 24 : 12;
    fabric.Object.prototype.set({
        cornerSize: controlSize / zoom,
        touchCornerSize: 40 / zoom,
        transparentCorners: false,
        borderScaleFactor: 2 / zoom,
    });
    
    canvas.requestRenderAll();
  };

  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();

    if (activeObj) {
      const vpt = canvas.getViewportTransform();
      const objectCenter = activeObj.getCenterPoint();
      
      // Convert Canvas Coordinates -> Screen Coordinates
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

  // ✅ 1. INITIALIZE CANVAS
  useEffect(() => {
    let canvas = fabricCanvasRef.current;
    if (!canvas) {
      canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#f3f4f6', // Grey wrapper background
        selection: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true, // Crucial for layering
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      setInitialized(true);

      // TOUCH / PINCH ZOOM
      canvas.on('touch:gesture', function(opt) {
          if (opt.e.touches && opt.e.touches.length === 2) {
              const activeObj = canvas.getActiveObject();
              if (activeObj) {
                  // Resize Object
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
              } else {
                  // Zoom Canvas
                  if (opt.self.state === 'start') {
                      canvas._startZoom = canvas.getZoom();
                  } else if (opt.self.state === 'change') {
                      let zoom = canvas._startZoom * opt.self.scale;
                      if (zoom > 5) zoom = 5;
                      if (zoom < 0.1) zoom = 0.1;
                      const point = new fabric.Point(opt.self.x, opt.self.y);
                      canvas.zoomToPoint(point, zoom);
                  }
              }
          }
      });

      // MOUSE WHEEL ZOOM
      canvas.on('mouse:wheel', function(opt) {
          if (opt.e.ctrlKey || opt.e.metaKey) {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 5) zoom = 5;
            if (zoom < 0.05) zoom = 0.05;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
          }
      });
    }

    const resizeCanvas = () => {
      if (wrapperRef.current && canvas) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        canvas.setDimensions({ width: clientWidth, height: clientHeight });
        
        // ✅ FIT DESIGN TO CENTER
        fitDesignToScreen(canvas, clientWidth, clientHeight);
      }
    };

    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    resizeCanvas();
    return () => ro.disconnect();
  }, [printDimensions]);

  // ✅ 2. HANDLE PRINT AREA MASK & BORDER
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    // Remove old borders
    canvas.getObjects().forEach((obj) => {
      if (obj.customId === 'print-area-border' || obj.id === 'print-area-border') {
        canvas.remove(obj);
      }
    });
    
    if (productId && printDimensions.width > 0) {
      // 1. Create Clip Rect at (0,0) - Matches Design Coordinates
      // absolutePositioned = false so it scales with the viewport (camera)
      const clipRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: printDimensions.width,
        height: printDimensions.height,
        absolutePositioned: false, 
      });
      
      canvas.clipPath = clipRect;
      
      // 2. Create Visual Border at (0,0)
      const visualBorder = new fabric.Rect({
        left: 0,
        top: 0,
        width: printDimensions.width,
        height: printDimensions.height,
        fill: '#ffffff', // White Paper
        stroke: 'rgba(0,0,0,0.1)',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        customId: 'print-area-border',
        id: 'print-area-border',
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 20 })
      });
      
      canvas.add(visualBorder);
      // ✅ Force to Bottom (Index 0)
      canvas.moveObjectTo(visualBorder, 0);

      // Re-fit to ensure new dimensions are centered
      if (wrapperRef.current) {
          fitDesignToScreen(canvas, wrapperRef.current.clientWidth, wrapperRef.current.clientHeight);
      }

    } else {
      canvas.clipPath = null;
    }
    
    canvas.requestRenderAll();
    window.dispatchEvent(new Event('resize_menu_update'));

  }, [printDimensions, productId, activeView]);

  // ✅ 4. HANDLE SELECTION EVENTS (Same as before)
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

  // ✅ 5. HANDLE MODIFICATIONS (Same as before)
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleObjectModified = (e) => {
      if (isSyncingRef.current) return;
      updateMenuPosition();

      let obj = e.target;
      if (!obj) return;
      const type = obj.type ? obj.type.toLowerCase() : '';

      // ... (Keep existing group/text logic) ...
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

  // ✅ 6. SYNC REDUX STATE → FABRIC (Fixed Z-Index Logic)
  useEffect(() => {
    if (!initialized) return;
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    let selectedIds = [];
    const activeObject = fabricCanvas.getActiveObject();
    // Preserve selection
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

      // Sync Objects
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

      if (objData.type === 'image') {
         // ... (Image logic same as before) ...
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

    // Clean up orphans
    const reduxIds = new Set(canvasObjects.map(o => o.id));
    fabricObjects.forEach((obj) => {
      if (obj.customId === 'print-area-border' || obj.id === 'print-area-border') return;
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

    // ✅ RE-ORDER Z-INDEX SAFELY
    const currentFabricObjects = fabricCanvas.getObjects();
    canvasObjects.forEach((reduxObj, index) => {
      const fabricObj = currentFabricObjects.find((obj) => obj.customId === reduxObj.id);
      if (fabricObj) {
        // We ALWAYS want Visual Border at 0.
        // So user objects start effectively at 1.
        // But if Visual Border is present, we must shift index by 1
        const hasBorder = currentFabricObjects.some(o => o.customId === 'print-area-border');
        const targetIndex = hasBorder ? index + 1 : index;

        // Use moveObjectTo to enforce order
        fabricCanvas.moveObjectTo(fabricObj, targetIndex);
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

  return (
    <div ref={wrapperRef} id="canvas-wrapper" className="relative w-full h-full">
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