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

const extractFontsFromJSON = (json) => {
  const fonts = new Set();
  const data = typeof json === 'string' ? JSON.parse(json) : json;

  const scanObjects = (objs) => {
    if (!objs) return;
    objs.forEach((obj) => {
      if (obj.fontFamily && obj.fontFamily !== 'Times New Roman' && obj.fontFamily !== 'Arial') {
        fonts.add(obj.fontFamily);
      }
    });
  };

  if (data.objects) {
    scanObjects(data.objects);
  } else {
    Object.values(data).forEach(view => {
      if (view && view.objects) scanObjects(view.objects);
    });
  }
  
  return Array.from(fonts);
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
  printDimensions,
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

  // ✅ 1. SMART FIT FUNCTION
  // Calculates the exact zoom needed to fit your Print Area (e.g. 4500px) into the Container (e.g. 350px)
  const fitDesignToScreen = (canvas, containerWidth, containerHeight) => {
    if (!canvas || !printDimensions.width) return;

    const padding = containerWidth < 768 ? 20 : 60; // Less padding on mobile
    const availWidth = containerWidth - padding;
    const availHeight = containerHeight - padding;

    // Calculate Zoom
    const scaleX = availWidth / printDimensions.width;
    const scaleY = availHeight / printDimensions.height;
    const zoom = Math.min(scaleX, scaleY);

    // Center the content
    const centerX = (containerWidth - printDimensions.width * zoom) / 2;
    const centerY = (containerHeight - printDimensions.height * zoom) / 2;

    // Apply Transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    canvas.setViewportTransform([zoom, 0, 0, zoom, centerX, centerY]);
    
    // Update Control Handles size based on zoom (Inverse scaling)
    // This ensures handles are big enough to touch even when zoomed out far
    const controlSize = containerWidth < 768 ? 24 : 12; 
    fabric.Object.prototype.set({
        cornerSize: controlSize / zoom, 
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#333333',
        borderColor: '#4f46e5',
        borderScaleFactor: 2 / zoom, 
        touchCornerSize: 40 / zoom, 
    });
    
    canvas.requestRenderAll();
  };

  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();

    if (activeObj) {
      // ✅ Fix Menu Position accounting for Viewport Transform (Zoom/Pan)
      const vpt = canvas.getViewportTransform();
      const objectCenter = activeObj.getCenterPoint();
      
      // Transform canvas coordinates to screen coordinates
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

  // ✅ 2. INITIALIZE CANVAS & TOUCH GESTURES
  useEffect(() => {
    let canvas = fabricCanvasRef.current;
    if (!canvas) {
      canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#f3f4f6', // Light gray to distinguish canvas area
        selection: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      setInitialized(true);
      
      // ✅ Enable Touch Zoom (Pinch) & Mouse Wheel Zoom
      canvas.on('mouse:wheel', function(opt) {
          if (opt.e.ctrlKey || opt.e.metaKey) { // Zoom
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 5) zoom = 5;
            if (zoom < 0.05) zoom = 0.05;
            
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
            
            // Adjust handles after zoom
            const controlSize = window.innerWidth < 768 ? 24 : 12;
            fabric.Object.prototype.set({
                cornerSize: controlSize / zoom,
                touchCornerSize: 40 / zoom,
                borderScaleFactor: 2 / zoom
            });
          }
      });
    }

    const resizeCanvas = () => {
      if (wrapperRef.current && canvas) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        canvas.setDimensions({ width: clientWidth, height: clientHeight });
        // Use our smart fit function
        fitDesignToScreen(canvas, clientWidth, clientHeight);
      }
    };

    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    resizeCanvas();

    return () => { 
        // Cleanup if needed
    };
  }, [printDimensions]); // Re-run when dimensions change

  // ✅ 3. HANDLE BORDER & CLIP PATH
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !printDimensions.width) return;
    
    // Remove old borders
    canvas.getObjects().forEach((obj) => {
      if (obj.customId === 'print-area-border' || obj.id === 'print-area-border') {
        canvas.remove(obj);
      }
    });
    
    // Set Clip Path (The actual print size)
    const printAreaRect = new fabric.Rect({
        left: 0, top: 0,
        width: printDimensions.width,
        height: printDimensions.height,
        absolutePositioned: true,
    });
    canvas.clipPath = printAreaRect;
    
    // Visual Border (Dashed line)
    const visualBorder = new fabric.Rect({
        left: 0, top: 0,
        width: printDimensions.width,
        height: printDimensions.height,
        fill: '#ffffff', // White paper area
        stroke: 'rgba(0,0,0,0.2)',
        strokeWidth: 4,
        strokeDashArray: [20, 20],
        selectable: false,
        evented: false,
        customId: 'print-area-border',
        id: 'print-area-border'
    });
    
    canvas.add(visualBorder);
    canvas.sendToBack(visualBorder);
    canvas.requestRenderAll();
    
    // Force a re-fit to ensure it looks good immediately
    if (wrapperRef.current) {
       fitDesignToScreen(canvas, wrapperRef.current.clientWidth, wrapperRef.current.clientHeight);
    }
  }, [printDimensions, activeView]);

  // ✅ 4. HANDLE SELECTION & SMART FOCUS
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

        // 🔥 SMART FOCUS: On Mobile, Zoom to the object automatically
        if (window.innerWidth < 768) {
           const objCenter = selected.getCenterPoint();
           const currentZoom = canvas.getZoom();
           const targetZoom = Math.max(currentZoom * 2, 0.5); // Zoom in, but not insanely close
           
           // Animate Viewport to center the object
           canvas.animate({
                viewportTransform: [targetZoom, 0, 0, targetZoom, 
                    (canvas.width / 2) - (objCenter.x * targetZoom), 
                    (canvas.height / 2) - (objCenter.y * targetZoom)
                ]
           }, {
               duration: 400,
               onChange: canvas.renderAll.bind(canvas),
               easing: fabric.util.ease.easeOutExpo,
               onComplete: () => {
                   // Rescale handles for the new zoom level
                   const controlSize = 24;
                   fabric.Object.prototype.set({
                        cornerSize: controlSize / targetZoom,
                        touchCornerSize: 40 / targetZoom,
                        borderScaleFactor: 2 / targetZoom
                   });
               }
           });
        }
      }
    };

    const handleCleared = () => {
      if (isSyncingRef.current) return;
      setSelectedId(null);
      setActiveTool(null);
      setMenuPosition(null);

      // 🔥 SMART RESTORE: Zoom back out to fit screen
      if (window.innerWidth < 768 && wrapperRef.current) {
          fitDesignToScreen(canvas, wrapperRef.current.clientWidth, wrapperRef.current.clientHeight);
      }
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
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      canvas.off('object:moving', handleMoving);
      canvas.off('object:scaling', handleMoving);
      canvas.off('object:rotating', handleMoving);
      canvas.off('object:modified', handleMoving);
    };
  }, [fabricCanvas, setSelectedId, setActiveTool]);

  // ✅ 5. HANDLE MODIFICATIONS
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleObjectModified = (e) => {
      if (isSyncingRef.current) return;
      updateMenuPosition();

      let obj = e.target;
      if (!obj) return;

      const type = obj.type ? obj.type.toLowerCase() : '';

      if (type === 'activeselection') {
        const children = [...obj.getObjects()];
        setTimeout(() => {
          fabricCanvas.discardActiveObject();
          const present = store.getState().canvas.present;
          let updatedPresent = present.map((o) => JSON.parse(JSON.stringify(o)));
          let hasChanges = false;

          children.forEach((child) => {
            const index = updatedPresent.findIndex((o) => o.id === child.customId);
            if (index === -1) return;

            if (child.type === 'text' || child.type === 'textbox' || child.customType === 'text') {
              const newFontSize = child.fontSize * child.scaleX;
              child.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
              child.setCoords();
              updatedPresent[index].props = {
                ...updatedPresent[index].props,
                fontSize: newFontSize,
                left: child.left,
                top: child.top,
                angle: child.angle,
                scaleX: 1,
                scaleY: 1
              };
            } else {
              updatedPresent[index].props = {
                ...updatedPresent[index].props,
                left: child.left,
                top: child.top,
                angle: child.angle,
                scaleX: child.scaleX,
                scaleY: child.scaleY,
              };
            }
            hasChanges = true;
          });
          if (hasChanges) store.dispatch(setCanvasObjects(updatedPresent));

          if (children.length > 0) {
            const sel = new fabric.ActiveSelection(children, { canvas: fabricCanvas });
            fabricCanvas.setActiveObject(sel);
            fabricCanvas.requestRenderAll();
          }
        }, 0);
        return;
      }

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
    const isMultiSelect = activeObject && activeObject.type?.toLowerCase() === 'activeselection';

    if (isMultiSelect) {
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

      if (objData.type === 'text' || shapes.includes(objData.type)) {
        const isCircle = objData.props.textEffect === 'circle';

        if (existing && existing.type === objData.type && !isCircle) {
          existing.set(objData.props);
          existing.setCoords();
        } else {
          if (existing) fabricCanvas.remove(existing);
          let newObj;
          if (isCircle) newObj = CircleText(objData);
          else if (shapes.includes(objData.type)) newObj = ShapeAdder(objData);
          else if (objData.type === 'text') newObj = StraightText(objData);

          if (newObj) {
            newObj.customId = objData.id;
            fabricCanvas.add(newObj);
          }
        }
      }

      if (objData.type === 'image') {
        if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
          try {
            const newObj = await FabricImage.fromURL(objData.src, { ...objData.props });
            newObj.set({ customId: objData.id });
            fabricCanvas.add(newObj);
          } catch (err) {
            console.error("Error loading image:", err);
          }
        } else if (existing) {
          updateExisting(existing, objData, isDifferent);
        }
      }

      previousStatesRef.current.set(objData.id, currentString);
    });

    const reduxIds = new Set(canvasObjects.map(o => o.id));
    fabricObjects.forEach((obj) => {
      if (obj.customId === 'print-area-border' || obj.id === 'print-area-border') return;
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

    // Re-order Z-index
    const currentFabricObjects = fabricCanvas.getObjects();
    let fabricObjectsArray = fabricCanvas._objects;
    canvasObjects.forEach((reduxObj, index) => {
      const fabricObj = currentFabricObjects.find((obj) => obj.customId === reduxObj.id);
      if (fabricObj) {
        const currentIndex = fabricObjectsArray.indexOf(fabricObj);
        if (currentIndex !== index) {
          fabricCanvas.moveObjectTo(fabricObj, index);
        }
      }
    });

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
    <div ref={wrapperRef} id="canvas-wrapper" className="relative w-full h-full overflow-hidden">
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