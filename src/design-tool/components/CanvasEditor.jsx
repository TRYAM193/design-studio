// src/design-tool/components/CanvasEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as fabric from 'fabric';
import WebFont from 'webfontloader';
import StraightText from '../objectAdders/straightText';
import CircleText from '../objectAdders/CircleText';
import updateObject from '../functions/update';
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { useLocation } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '@/firebase';
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

  // Handle both single view and multi-view JSON structures
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
    // Check for multi-view structure (front, back, etc.)
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
  setEditingDesignId,
  setCurrentDesign,
  printDimensions = { width: 4500, height: 5400 },
  productId,
  activeView,
  setProductData,
  setCanvasBg,
  setViewStates,
  setCurrentView
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const wrapperRef = useRef(null);
  const canvasObjects = useSelector((state) => state.canvas.present);
  const location = useLocation();
  const previousStatesRef = useRef(new Map());
  const dispatch = useDispatch();

  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedObjectLocked, setSelectedObjectLocked] = useState(false);
  const [selectedObjectUUIDs, setSelectedObjectUUIDs] = useState([]);
  const shapes = ['rect', 'circle', 'triangle', 'star', 'pentagon', 'hexagon', 'line', 'arrow', 'diamond', 'trapezoid', 'heart', 'lightning', 'bubble'];

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // --- SCALING & MENU POSITIONING ---
  const calculateScaledSize = (originalWidth, originalHeight) => {
    const currentScreenWidth = window.innerWidth;
    const referenceWidth = 1707; 
    const scaleFactor = currentScreenWidth / referenceWidth;

    return {
      width: originalWidth * scaleFactor,
      height: originalHeight * scaleFactor,
      scaleFactor: scaleFactor
    };
  };

  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();

    if (activeObj) {
      const objectCenter = activeObj.getCenterPoint();
      setMenuPosition({
        left: objectCenter.x,
        top: objectCenter.y - (activeObj.getScaledHeight() / 2) - 60
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

  const { width: printWidth, height: printHeight } = printDimensions;
  const { width: scaledWidth, height: scaledHeight } = calculateScaledSize(printWidth, printHeight);

  // ✅ 1. INITIALIZE CANVAS
  useEffect(() => {
    let canvas = fabricCanvasRef.current;
    if (!canvas) {
      canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        selection: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      setInitialized(true);
    }

    const resizeCanvas = () => {
      if (wrapperRef.current && canvas) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        canvas.setDimensions({ width: clientWidth, height: clientHeight });
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setContainerSize({ width: clientWidth, height: clientHeight });
        canvas.requestRenderAll();
      }
    };

    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    resizeCanvas();

    return () => { };
  }, []);

  // ✅ 2. HANDLE PRINT AREA MASK & BORDER
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (obj.customId === 'print-area-border' || obj.id === 'print-area-border') {
        canvas.remove(obj);
      }
    });

    if (productId && canvas.width > 0 && canvas.height > 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const leftPos = centerX - printWidth / 2;
      const topPos = centerY - printHeight / 2;

      const clipRect = new fabric.Rect({
        left: leftPos,
        top: topPos,
        width: scaledWidth,
        height: scaledHeight,
        absolutePositioned: true,
      });

      canvas.clipPath = clipRect;

      if (scaledHeight && scaledWidth) {
        const visualBorder = new fabric.Rect({
          left: leftPos,
          top: topPos,
          width: scaledWidth,
          height: scaledHeight,
          fill: 'transparent',
          stroke: 'rgba(0,0,0,0.3)',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          customId: 'print-area-border',
          id: 'print-area-border'
        });
        canvas.add(visualBorder);
        canvas.bringObjectToFront(visualBorder);
      }
    } else {
      canvas.clipPath = null;
    }

    canvas.requestRenderAll();
    window.dispatchEvent(new Event('resize_menu_update'));

  }, [printWidth, printHeight, activeView]);

 // ✅ 3. LOAD & MERGE DESIGN LOGIC (FIXED)
  useEffect(() => {
    if (!location.state || !fabricCanvas) return;

    const handleLoad = () => {
      const payload = location.state.designToLoad || location.state.mergeDesign;
      const isMerge = !!location.state.mergeDesign;

      if (!payload) return;

      let parsedJSON = payload.canvasJSON || payload.canvasData;
      if (typeof parsedJSON === 'string') {
        try { parsedJSON = JSON.parse(parsedJSON); } catch (e) { console.error("JSON Parse Error", e); return; }
      }

      // --- Filter out Borders ---
      const filterBorders = (objects) => {
        if (!Array.isArray(objects)) return [];
        return objects.filter(obj => {
          if (obj.id === 'print-area-border' || obj.customId === 'print-area-border') return false;
          if (obj.type === 'rect' && obj.strokeDashArray && obj.fill === 'transparent' && !obj.selectable) return false;
          return true;
        });
      };

      // --- Sync to Redux Helper ---
      const syncToRedux = () => {
        setTimeout(() => {
          const newObjs = fabricCanvas.getObjects().map((obj) => {
            if (obj.customId === 'print-area-border') return null;

            const commonProps = {
              left: obj.left, top: obj.top, angle: obj.angle, fill: obj.fill,
              opacity: obj.opacity, shadowBlur: obj.shadowBlur || 0,
              shadowOffsetX: obj.shadowOffsetX || 0, shadowOffsetY: obj.shadowOffsetY || 0,
              shadowColor: obj.shadowColor || '', stroke: obj.stroke,
              strokeWidth: obj.strokeWidth, scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
              lockMovementX: obj.lockMovementX, lockMovementY: obj.lockMovementY,
            };

            let specificProps = {};
            if (obj.type === 'image') {
              specificProps = { width: obj.width, height: obj.height, cropX: obj.cropX, cropY: obj.cropY };
            } else if (['text', 'textbox', 'i-text', 'circle-text'].includes(obj.type) || obj.textEffect === 'circle') {
              specificProps = {
                text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily,
                charSpacing: obj.charSpacing, textAlign: obj.textAlign,
                textStyle: obj.textStyle, textEffect: obj.textEffect, effectValue: obj.effectValue,
              };
            } else {
              specificProps = { width: obj.width, height: obj.height, radius: obj.radius, rx: obj.rx, ry: obj.ry };
            }

            return {
              id: obj.customId || uuidv4(),
              type: obj.textEffect === 'circle' ? 'circle-text' : obj.type,
              ...(obj.type === 'image' && { src: obj.src }),
              props: { ...commonProps, ...specificProps }
            };
          }).filter(Boolean);

          if (newObjs.length > 0) {
            dispatch(setCanvasObjects(newObjs));
          }
          fabricCanvas.requestRenderAll();
        }, 150);
      };

      // -----------------------------------------------------------
      // FIX A: DETERMINE TARGET VIEW (Don't force 'Front' for Blank)
      // -----------------------------------------------------------
      // If it's a BLANK design, stay on the current view.
      // If it's a PRODUCT design, go to the saved view (e.g., Front).
      const isBlank = payload.type === 'BLANK' || !payload.type;
      const targetView = isBlank ? activeView : (payload.productConfig?.activeView || 'front');
      
      // Only switch view if it's a PRODUCT load and different from current
      if (!isMerge && !isBlank && setCurrentView && targetView !== activeView) {
          setCurrentView(targetView);
      }

      // -----------------------------------------------------------
      // FIX B: HYDRATE ALL VIEW STATES (Prevent Data Loss)
      // -----------------------------------------------------------
      // If we are loading a full product design, we must tell Editor.jsx about 
      // the views we AREN'T currently seeing (e.g. Back), so they don't get deleted on Save.
      if (!isMerge && payload.type === 'PRODUCT' && setViewStates) {
          setViewStates(parsedJSON); 
      }

      // -----------------------------------------------------------
      // PREPARE OBJECTS FOR LOADING/MERGING
      // -----------------------------------------------------------
      // Check if JSON has specific view data (e.g. { front: {}, back: {} })
      let dataToLoad = parsedJSON;
      if (parsedJSON[targetView] && parsedJSON[targetView].objects) {
          dataToLoad = parsedJSON[targetView];
      } else if (parsedJSON.objects) {
          // Standard structure
          dataToLoad = parsedJSON;
      }

      let incomingObjects = dataToLoad.objects || (Array.isArray(dataToLoad) ? dataToLoad : []);
      incomingObjects = filterBorders(incomingObjects);

      // Assign New IDs
      incomingObjects.forEach(obj => {
        const newId = uuidv4();
        obj.id = newId;
        obj.customId = newId;
      });

      // -----------------------------------------------------------
      // EXECUTE LOAD
      // -----------------------------------------------------------

      // 1. PRODUCT RESET
      if (payload.type === 'PRODUCT' && payload.productConfig && !isMerge) {
        if (setProductData) {
            setProductData(prev => ({
                ...prev,
                productId: payload.productConfig.productId,
                options: { ...prev.options, colors: [payload.productConfig.variantColor] }
            }));
        }
        if (setCanvasBg) setCanvasBg(payload.productConfig.variantColor);
        
        // Load objects via Fabric
        const finalJSON = { ...dataToLoad, objects: incomingObjects };
        fabricCanvas.loadFromJSON(finalJSON, () => {
            fabricCanvas.renderAll();
            syncToRedux();
        });
      }
      // 2. MERGE
      else if (isMerge) {
        if (incomingObjects.length === 0) return;
        fabric.util.enlivenObjects(incomingObjects, (enlivenedObjects) => {
            enlivenedObjects.forEach((obj) => {
                fabricCanvas.add(obj);
            });
            fabricCanvas.requestRenderAll();
            syncToRedux();
        }, '');
      }
      // 3. REPLACE (SAVED BLANK / TEMPLATE)
      else {
        let finalJSON = {};
        if (dataToLoad.objects || Array.isArray(dataToLoad)) {
             finalJSON = { ...dataToLoad, objects: incomingObjects };
        } else {
             finalJSON = { objects: incomingObjects };
        }

        fabricCanvas.loadFromJSON(finalJSON, () => {
          fabricCanvas.renderAll();
          syncToRedux();
        });
      }
    };

    handleLoad();
    window.history.replaceState({}, document.title);

  }, [location.state, fabricCanvas]);

  // ✅ 4. HANDLE SELECTION EVENTS
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