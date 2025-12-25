// src/design-tool/components/CanvasEditor.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as fabric from 'fabric';
import WebFont from 'webfontloader'; // 1. Import WebFontLoader
import StraightText from '../objectAdders/straightText';
import CircleText from '../objectAdders/CircleText';
import updateObject from '../functions/update';
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { useLocation } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '@/firebase';
import { FabricImage } from 'fabric';
import updateExisting from '../utils/updateExisting'
import FloatingMenu from './FloatingMenu';
import { handleCanvasAction } from '../utils/canvasActions';
import ShapeAdder from '../objectAdders/Shapes';

// 2. Helper to find fonts in the JSON
const extractFontsFromJSON = (json) => {
  const fonts = new Set();
  const data = typeof json === 'string' ? JSON.parse(json) : json;

  if (data.objects) {
    data.objects.forEach((obj) => {
      // Filter out system fonts or empty values
      if (obj.fontFamily && obj.fontFamily !== 'Times New Roman' && obj.fontFamily !== 'Arial') {
        fonts.add(obj.fontFamily);
      }
    });
  }
  return Array.from(fonts);
};

fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    return toObject.call(
      this,
      (propertiesToInclude || []).concat(['customId', 'textStyle', 'textEffect', 'radius', 'effectValue', 'selectable', 'lockMovementX', 'lockMovementY'])
    );
  };
})(fabric.Object.prototype.toObject);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

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
  printDimensions = { width: 4500, height: 5400 }
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

  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    const canvasContainer = document.getElementById('canvas-wrapper');

    if (activeObj && canvasContainer) {
      // 1. Get the Object's center in "Scene Coordinates" (e.g., 2250px)
      const objectCenter = activeObj.getCenterPoint();

      // 2. Convert to "Screen Coordinates" using the Viewport Transform
      // This applies the Zoom and Offset we set in Step 1
      const vpt = canvas.viewportTransform;
      const screenX = objectCenter.x * vpt[0] + vpt[4];
      const screenY = objectCenter.y * vpt[3] + vpt[5];

      // 3. Get Canvas Absolute Position on Page
      const containerRect = canvasContainer.getBoundingClientRect();

      // 4. Set Final Position
      setMenuPosition({
        left: containerRect.left + screenX,
        top: containerRect.top + screenY - (activeObj.getScaledHeight() * vpt[3] / 2) - 60
      });

      if (activeObj.type === 'activeselection' || activeObj.type === 'group') {
        const ids = activeObj.getObjects().map(o => o.customId);
        setSelectedObjectUUIDs(ids);
        const isAnyLocked = activeObj.getObjects().some(o => o.lockMovementX);
        setSelectedObjectLocked(isAnyLocked);
      } else {
        setSelectedObjectUUIDs([activeObj.customId]);
        setSelectedObjectLocked(activeObj.lockMovementX === true);
      }
    } else {
      setMenuPosition(null);
      setSelectedObjectUUIDs([]);
    }
  };

  // src/design-tool/components/CanvasEditor.jsx

  // 1. Accepts dimensions directly from props
  const { width: canvasWidth, height: canvasHeight } = printDimensions; 

  useEffect(() => {
    // A. Initialize (or get) Canvas
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

    // B. ⭐️ DIRECT RESIZE (No math, no zoom, just set it)
    canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    
    // C. Reset Viewport (Crucial: Remove any old zoom if it existed)
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); 
    
    canvas.requestRenderAll();
    
    // Update menu position immediately in case size changed
    const updateEvent = new Event('resize_menu_update');
    window.dispatchEvent(updateEvent);

    // Cleanup not needed for dimensions change, only on unmount
    return () => {
      // Don't dispose here, or it flickers on slider change. 
      // Dispose only on component unmount (handled by empty dependency [] usually)
    };
  }, [canvasWidth, canvasHeight]); // 👈 Re-run ONLY when you move sliders

  // 🟩 Load Saved Designs (From Navigation State)
  useEffect(() => {
    if (location.state?.designToLoad && fabricCanvas) {
      const design = location.state.designToLoad;
      setCurrentDesign(design);

      if (design.id) setEditingDesignId(design.id);
      else setEditingDesignId(null)

      let parsedData;
      let jsonContent = design.canvasJSON || design.canvasData;

      if (jsonContent) {
        parsedData = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
      }

      if (parsedData) {
        // 3a. Extract fonts
        const fontsToLoad = extractFontsFromJSON(parsedData);

        // Define the logic to run once fonts are ready
        const loadCanvasData = () => {
          fabricCanvas.loadFromJSON(parsedData, () => {
            // Callback loop to sync Redux
          });

          setTimeout(() => {
            const newObjs = fabricCanvas.getObjects().map((obj, i) => {
              // 1. COMMON PROPS (Applied to ALL objects)
              const commonProps = {
                left: obj.left,
                top: obj.top,
                angle: obj.angle,
                fill: obj.fill,
                opacity: obj.opacity,
                shadowBlur: obj.shadowBlur || 0,
                shadowOffsetX: obj.shadowOffsetX || 0,
                shadowOffsetY: obj.shadowOffsetY || 0,
                shadowColor: obj.shadowColor || '',
                stroke: obj.stroke,
                strokeWidth: obj.strokeWidth,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                lockMovementX: obj.lockMovementX,
                lockMovementY: obj.lockMovementY,
              };

              // 2. SPECIFIC PROPS (Based on Type)
              let specificProps = {};

              // IMAGE: Only Width/Height in props. SRC is handled outside.
              if (obj.type === 'image') {
                specificProps = {
                  width: obj.width,
                  height: obj.height,
                  cropX: obj.cropX,
                  cropY: obj.cropY,
                };
              }
              // TEXT: Text-specific fields. No Width/Height/Src.
              else if (['text', 'textbox', 'i-text', 'circle-text'].includes(obj.type) || obj.textEffect === 'circle') {
                specificProps = {
                  text: obj.text,
                  fontSize: obj.fontSize,
                  fontFamily: obj.fontFamily,
                  charSpacing: obj.charSpacing,
                  textAlign: obj.textAlign,
                  textStyle: obj.textStyle,
                  textEffect: obj.textEffect,
                  effectValue: obj.effectValue,
                };
              }
              // SHAPES: Width/Height/Radius. No Text/Src.
              else {
                specificProps = {
                  width: obj.width,
                  height: obj.height,
                  radius: obj.radius,
                  rx: obj.rx,
                  ry: obj.ry,
                };
              }

              // 3. FINAL OBJECT CONSTRUCTION
              return {
                id: obj.customId || Date.now() + i,
                type: obj.textEffect === 'circle' ? 'circle-text' : obj.type,

                // ⭐️ SRC IS HERE ONLY (Top Level)
                ...(obj.type === 'image' && { src: obj.src }),

                props: { ...commonProps, ...specificProps }
              };
            });
            if (newObjs) {
              store.dispatch(setCanvasObjects(newObjs))
              console.log('Redux Synced')
            }
            fabricCanvas.requestRenderAll();
          }, 100);
        };

        // 3b. Load fonts if needed, otherwise just load canvas
        if (fontsToLoad.length > 0) {
          WebFont.load({
            google: { families: fontsToLoad },
            active: () => {
              console.log("Fonts loaded for new design.");
              loadCanvasData();
            },
            inactive: loadCanvasData // Fallback if fonts fail
          });
        } else {
          loadCanvasData();
        }
      }
    }
  }, [location.state, fabricCanvas]);

  // 🟩 Load from Persistence (LocalStorage/Firestore)
  useEffect(() => {
    if (!fabricCanvas || !initialized) return;

    const loadDesign = async () => {
      let designToLoad = null;
      let designId = null;

      try {
        const sessionData = sessionStorage.getItem('editingDesign');
        if (sessionData) {
          designToLoad = JSON.parse(sessionData);
          sessionStorage.removeItem('editingDesign');
        }
      } catch (e) { console.warn(e); }

      if (!designToLoad) {
        try {
          const localData = localStorage.getItem('editingDesign');
          if (localData) {
            designToLoad = JSON.parse(localData);
            localStorage.removeItem('editingDesign');
          }
        } catch (e) { console.warn(e); }
      }

      if (!designToLoad) {
        const urlParams = new URLSearchParams(window.location.search);
        designId = urlParams.get('designId');
      }

      if (!designToLoad && !designId) {
        designId = getCookie('editingDesignId');
        if (designId) {
          document.cookie = 'editingDesignId=; path=/; max-age=0';
        }
      }

      if (!designToLoad && designId) {
        try {
          const designRef = doc(firestore, `users/test-user-123/designs`, designId);
          const designSnap = await getDoc(designRef);
          if (designSnap.exists()) {
            designToLoad = { id: designId, ...designSnap.data() };
          }
        } catch (e) { console.error(e); }
      }

      if (designToLoad) {
        setCurrentDesign(designToLoad);
        setEditingDesignId(designToLoad.id);

        if (designToLoad.canvasJSON) {
          // 3c. Extract fonts for persistence load
          const parsedData = typeof designToLoad.canvasJSON === 'string'
            ? JSON.parse(designToLoad.canvasJSON)
            : designToLoad.canvasJSON;

          const fontsToLoad = extractFontsFromJSON(parsedData);

          const loadCanvasPersistence = () => {
            fabricCanvas.loadFromJSON(designToLoad.canvasJSON, () => {
              setTimeout(() => {
                fabricCanvas.requestRenderAll();
                fabricCanvas.getObjects().forEach(obj => {
                  const state = store.getState();
                  const currentObjs = state.canvas.present;
                  // Simple duplication check before adding
                  if (!currentObjs.find(o => o.id === obj.customId)) {
                    // Add logic here if needed
                  }
                });
              }, 90);
            });
          };

          if (fontsToLoad.length > 0) {
            WebFont.load({
              google: { families: fontsToLoad },
              active: () => {
                console.log("Fonts loaded from persistence.");
                loadCanvasPersistence();
              },
              inactive: loadCanvasPersistence
            });
          } else {
            loadCanvasPersistence();
          }
        }
      }
    };
    loadDesign();
  }, [fabricCanvas, initialized]);

  // 🟩 Handle Selection Events
  useEffect(() => {
    // ... (No changes needed here) ...
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
  }, [fabricCanvas, setSelectedId, setActiveTool]); // ✅ Re-runs when canvas is ready

  // 🟩 Touch / Pinch Logic (Preserved)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
  }, [initialized]);

  // 🟩 Handle Modifications (User Actions)
  useEffect(() => {
    // ... (No changes needed here) ...
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

          if (hasChanges) {
            store.dispatch(setCanvasObjects(updatedPresent));
          }

          if (children.length > 0) {
            const sel = new fabric.ActiveSelection(children, {
              canvas: fabricCanvas,
            });
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

  // 🟩 Sync Redux state → Fabric
  useEffect(() => {
    // ... (No changes needed here) ...
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

      if (currentString === previousString) {
        return;
      }

      let existing = fabricObjects.find((o) => o.customId === objData.id);

      if (objData.type === 'text' || shapes.includes(objData.type)) {
        const isCircle = objData.props.textEffect === 'circle';

        if (existing && existing.type === objData.type && !isCircle) {
          existing.set(objData.props);
          existing.setCoords();
        }
        else {
          if (existing) fabricCanvas.remove(existing);

          let newObj;
          if (isCircle) {
            newObj = CircleText(objData);
          }
          else if (shapes.includes(objData.type)) {
            newObj = ShapeAdder(objData);
          }
          else if (objData.type === 'text') {
            newObj = StraightText(objData);
          }

          if (newObj) {
            newObj.customId = objData.id;
            fabricCanvas.add(newObj);
          }
        }
      }

      if (objData.type === 'image') {
        if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
          try {
            const newObj = await FabricImage.fromURL(objData.src, { ...objData.props, customId: objData.id });
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
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

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
    <div ref={wrapperRef} id="canvas-wrapper">
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