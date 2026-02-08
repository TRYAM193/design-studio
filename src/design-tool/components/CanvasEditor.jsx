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

// ✅ HELPER: Calculate distance between two touch points
const getDistance = (touch1, touch2) => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export default function CanvasEditor({
  setActiveTool,
  setSelectedId,
  setFabricCanvas,
  fabricCanvas,
  printDimensions,
  productId,
  isMobile
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

  // ✅ REF for Gesture State (Avoiding Re-renders)
  const gestureState = useRef({
    isGesture: false,
    startDist: 0,
    startScale: 1, // For Object
    startZoom: 1   // For Canvas
  });

  // ✅ 1. LOGICAL SIZE
  const getLogicalSize = () => {
    if (productId && printDimensions?.width && printDimensions?.height) {
      return { width: printDimensions.width, height: printDimensions.height };
    }
    return { width: 500, height: 500 };
  };

  // ✅ 2. FIT TO SCREEN
  const fitCanvasToScreen = (canvas, containerW, containerH) => {
    if (!canvas) return;

    const { width: targetW, height: targetH } = getLogicalSize();
    let scale;

    if (isMobile) {
      // 🎯 USER REQUIREMENT: Small square, approx 30% of screen
      // We calculate a bounding box that is roughly 60% of width/height
      // (0.6 * 0.6 = 0.36 = 36% area)

      // Use a stricter limit for width to create that "card" feel
      const maxMobileWidth = containerW * 0.65;
      const maxMobileHeight = containerH * 0.5;

      // Calculate scale to fit entirely within this small box
      scale = Math.min(maxMobileWidth / targetW, maxMobileHeight / targetH);

      // Optional: Add a subtle shadow or border to make it pop as a "square"
      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.boxShadow = "0 20px 50px -10px rgba(0,0,0,0.5)";
        canvas.wrapperEl.style.borderRadius = "12px";
        canvas.wrapperEl.style.border = "1px solid rgba(255,255,255,0.1)";
      }
    } else {
      // Desktop Standard Logic (Full Fit)
      const padding = 50;
      const availW = containerW - padding;
      const availH = containerH - padding;
      scale = Math.min(1, availW / targetW, availH / targetH);

      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
        canvas.wrapperEl.style.borderRadius = "0px";
      }
    }

    canvas.setDimensions({
      width: targetW * scale,
      height: targetH * scale
    });

    canvas.setZoom(scale);

    const controlSize = isMobile ? 24 : 12; // Larger controls for mobile touch
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
    // We need the wrapper to calculate relative offset
    if (!canvas || !wrapperRef.current) return;

    const activeObj = canvas.getActiveObject();

    if (activeObj) {
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      // 1. Get positions in DOM
      const canvasEl = canvas.getElement(); // The lower-canvas element
      const canvasRect = canvasEl.getBoundingClientRect();
      const wrapperRect = wrapperRef.current.getBoundingClientRect();

      // 2. Calculate offset (Because canvas is centered in flex wrapper)
      const offsetX = canvasRect.left - wrapperRect.left;
      const offsetY = canvasRect.top - wrapperRect.top;

      // 3. Object center in Canvas Coordinates
      const objectCenter = activeObj.getCenterPoint();

      // 4. Convert to "Inside Canvas" pixel coordinates (Scaling/Pan applied)
      const objPixelX = objectCenter.x * vpt[0] + vpt[4];
      const objPixelY = objectCenter.y * vpt[3] + vpt[5];

      // 5. Add the DOM Offset to get True Relative Coordinates
      const screenX = objPixelX + offsetX;
      const screenY = objPixelY + offsetY;

      // 6. Object Dimensions on Screen
      const scaledWidth = activeObj.getScaledWidth() * vpt[0];
      const scaledHeight = activeObj.getScaledHeight() * vpt[3];

      let finalLeft, finalTop;

      if (isMobile) {
        // ✅ FIX: Position to the RIGHT side of the object
        // Logic: Object Center X + Half Width + Padding
        finalLeft = screenX + (scaledWidth / 2) + 20;

        // Align top with the top of the object
        finalTop = screenY - (scaledHeight / 2);

        // Safety Check: If it pushes off the right screen edge, flip to left? 
        // (For now, user explicitly asked for Right Side, so we keep it there. 
        // Since canvas is small (30%), there is likely empty space on the right.)
      } else {
        // Desktop: Original logic
        finalLeft = screenX + 100; // Hardcoded offset from center
        finalTop = screenY - (scaledHeight / 2) - 40;
      }

      setMenuPosition({
        left: finalLeft,
        top: finalTop
      });

      if (activeObj.type === 'activeselection') {
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

  // ✅ 3. INITIALIZE & MANUAL GESTURES
  useEffect(() => {
    let canvas = fabricCanvasRef.current;
    if (!canvas) {
      canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        selection: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
        allowTouchScrolling: false, // Critical for our manual logic
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      setInitialized(true);

      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
        canvas.wrapperEl.style.border = "1px solid #e2e8f0";
      }

      // -------------------------------------------------------------
      // 🔥 MANUAL GESTURE HANDLERS (Replacing Fabric's touch:gesture)
      // -------------------------------------------------------------

      // We attach these to the UPPER CANVAS (Interaction Layer)
      const upperCanvas = canvas.upperCanvasEl;

      const onTouchStart = (e) => {
        if (e.touches && e.touches.length === 2) {
          e.preventDefault(); // Stop browser zoom
          const dist = getDistance(e.touches[0], e.touches[1]);

          gestureState.current.isGesture = true;
          gestureState.current.startDist = dist;

          const activeObj = canvas.getActiveObject();
          if (activeObj) {
            // Mode A: Object Resize
            gestureState.current.startScale = activeObj.scaleX; // Assuming uniform scale
          } else {
            // Mode B: Canvas Zoom
            gestureState.current.startZoom = canvas.getZoom();
          }
        }
      };

      const onTouchMove = (e) => {
        if (!gestureState.current.isGesture || e.touches.length !== 2) return;
        e.preventDefault(); // CRITICAL: Stops page pinch

        const dist = getDistance(e.touches[0], e.touches[1]);
        const startDist = gestureState.current.startDist;

        // Calculate scale factor relative to start of pinch
        const scaleFactor = dist / startDist;

        const activeObj = canvas.getActiveObject();

        if (activeObj) {
          // --- RESIZE OBJECT ---
          const newScale = gestureState.current.startScale * scaleFactor;
          activeObj.set({ scaleX: newScale, scaleY: newScale });
          activeObj.setCoords();
          canvas.requestRenderAll();
        } else {
          // --- ZOOM CANVAS (PAPER) ---
          let newZoom = gestureState.current.startZoom * scaleFactor;

          // Constraints
          if (newZoom > 5) newZoom = 5;
          if (newZoom < 0.2) newZoom = 0.2;

          const { width: logicalW, height: logicalH } = getLogicalSize();

          // Update dimensions dynamically
          canvas.setDimensions({
            width: logicalW * newZoom,
            height: logicalH * newZoom
          });
          canvas.setZoom(newZoom);
        }
      };

      const onTouchEnd = (e) => {
        if (e.touches.length < 2) {
          gestureState.current.isGesture = false;
        }
      };

      // Attach Listeners
      upperCanvas.addEventListener('touchstart', onTouchStart, { passive: false });
      upperCanvas.addEventListener('touchmove', onTouchMove, { passive: false });
      upperCanvas.addEventListener('touchend', onTouchEnd);
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
  }, [printDimensions, productId, isMobile]);

  // ✅ 4. SELECTION
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

    canvas.on('object:added', (e) => {
      const obj = e.target;
      if (!obj) return;

      // 1. Force Caching ON (Fixes Opacity/Three-Layer Issue)
      obj.set('objectCaching', true);

      // 2. Fix SHAPES (Rect, Circle, Triangle, etc.)
      // We override '_renderPaintInOrder' instead of '_render'.
      // This keeps the shape's path definition intact (fixing the invisible bug)
      // but forces the stroke to draw BEHIND the fill (fixing the shrinking bug).
      if (obj._renderPaintInOrder) {
        obj._renderPaintInOrder = function (ctx) {
          // A. Draw Fill First
          this._renderFill(ctx);

          // B. Draw Stroke (forced BEHIND using destination-over)
          if (this.stroke && this.strokeWidth > 0) {
            const savedComp = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'destination-over';
            this._renderStroke(ctx);
            ctx.globalCompositeOperation = savedComp;
          }
        };
      }

      // 3. Fix TEXT (i-text, textbox)
      // We simply enforce 'stroke' first. Overriding render for text is risky/complex.
      // This ensures text remains visible while keeping the border behind.
      if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        obj.set('paintFirst', 'stroke');
      }
    });

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

  // ✅ 5. MODIFICATION
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

  // ✅ 6. SYNC
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

      if (['text', 'textbox', 'i-text'].includes(objData.type) || shapes.includes(objData.type)) {
        const curvedEffects = ['circle', 'semicircle', 'arc-up', 'arc-down', 'flag'];
        const isCurved = curvedEffects.includes(objData.props.textEffect);
        if (existing && existing.type === objData.type && !isCurved) {
          existing.set(objData.props);
          existing.setCoords();
        } else {
          if (existing) fabricCanvas.remove(existing);
          let newObj;
          if (isCurved) newObj = CircleText(objData);
          else if (shapes.includes(objData.type)) newObj = ShapeAdder(objData);
          else newObj = StraightText(objData);

          if (newObj) {
            newObj.customId = objData.id;
            fabricCanvas.add(newObj);
          }
        }
      }

      if (objData.type === 'image') {
        if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
          try {
            const newObj = await FabricImage.fromURL(objData.props.src, { ...objData.props });
            newObj.set({ customId: objData.id });
            fabricCanvas.add(newObj);
          } catch (err) { console.error(err); }
        } else if (existing) {
          updateExisting(existing, objData, isDifferent);
        }
      }

      previousStatesRef.current.set(objData.id, currentString);
    });

    const reduxIds = new Set(canvasObjects.map(o => o.id));
    fabricObjects.forEach((obj) => {
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

    canvasObjects.forEach((objData, index) => {
      const fabricObj = fabricCanvas.getObjects().find(o => o.customId === objData.id);
      if (fabricObj) {
        fabricCanvas.moveObjectTo(fabricObj, index);
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
    <div
      ref={wrapperRef}
      id="canvas-wrapper"
      // ✅ TOUCH ACTION: NONE is critical to stop browser zooming
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
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