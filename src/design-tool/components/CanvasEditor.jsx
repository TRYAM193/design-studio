// src/design-tool/components/CanvasEditor.jsx

import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as fabric from "fabric";
import { FabricImage } from "fabric";

import StraightText from "../objectAdders/straightText";
import CircleText from "../objectAdders/CircleText";
import ShapeAdder from "../objectAdders/Shapes";

import updateObject from "../functions/update";
import updateExisting from "../utils/updateExisting";
import { setCanvasObjects } from "../redux/canvasSlice";
import { store } from "../redux/store";
import FloatingMenu from "./FloatingMenu";
import { handleCanvasAction } from "../utils/canvasActions";

const MOBILE_BREAKPOINT = 768;
const shapes = [
  "rect","circle","triangle","star","pentagon","hexagon",
  "line","arrow","diamond","trapezoid","heart","lightning","bubble"
];

export default function CanvasEditor({
  setActiveTool,
  setSelectedId,
  setFabricCanvas,
  printDimensions,
  activeView
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const syncingRef = useRef(false);

  const dispatch = useDispatch();
  const canvasObjects = useSelector((state) => state.canvas.present);

  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [locked, setLocked] = useState(false);

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  /* -------------------------------------------------- */
  /* INITIALIZE CANVAS                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#f3f4f6",
      preserveObjectStacking: true,
      selection: !isMobile
    });

    // Touch improvements
    canvas.perPixelTargetFind = true;
    canvas.targetFindTolerance = 10;

    // Mobile handles
    if (isMobile) {
      fabric.Object.prototype.cornerSize = 26;
      fabric.Object.prototype.touchCornerSize = 40;
      fabric.Object.prototype.transparentCorners = false;
    }

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);

    return () => canvas.dispose();
  }, []);

  /* -------------------------------------------------- */
  /* RESIZE + CENTER CLIP PATH                          */
  /* -------------------------------------------------- */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !wrapperRef.current || !printDimensions?.width) return;

    const resize = () => {
      const { clientWidth, clientHeight } = wrapperRef.current;
      canvas.setDimensions({ width: clientWidth, height: clientHeight });

      const padding = isMobile ? 20 : 60;
      const scale = Math.min(
        (clientWidth - padding) / printDimensions.width,
        (clientHeight - padding) / printDimensions.height
      );

      const offsetX =
        (clientWidth - printDimensions.width * scale) / 2;
      const offsetY =
        (clientHeight - printDimensions.height * scale) / 2;

      canvas.setViewportTransform([
        scale, 0, 0, scale, offsetX, offsetY
      ]);

      canvas.requestRenderAll();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapperRef.current);

    return () => ro.disconnect();
  }, [printDimensions, activeView]);

  /* -------------------------------------------------- */
  /* CLIP PATH (CENTERED)                               */
  /* -------------------------------------------------- */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !printDimensions?.width) return;

    // Remove old border
    canvas.getObjects().forEach(o => {
      if (o.customId === "print-area-border") canvas.remove(o);
    });

    // ClipPath (always at origin, viewport handles centering)
    canvas.clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width: printDimensions.width,
      height: printDimensions.height,
      absolutePositioned: true
    });

    // Visual border
    const border = new fabric.Rect({
      left: 0,
      top: 0,
      width: printDimensions.width,
      height: printDimensions.height,
      fill: "#ffffff",
      stroke: "rgba(0,0,0,0.25)",
      strokeWidth: 3,
      strokeDashArray: [8, 8],
      selectable: false,
      evented: false,
      customId: "print-area-border"
    });

    canvas.add(border);
    border.sendToBack();
    canvas.requestRenderAll();
  }, [printDimensions, activeView]);

  /* -------------------------------------------------- */
  /* SELECTION HANDLING                                 */
  /* -------------------------------------------------- */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const updateMenu = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setMenuPosition(null);
        setSelectedIds([]);
        return;
      }

      const vpt = canvas.viewportTransform;
      const center = obj.getCenterPoint();

      const x = center.x * vpt[0] + vpt[4];
      const y = center.y * vpt[3] + vpt[5];

      setMenuPosition({ left: x, top: y - 60 });

      if (obj.type === "activeselection") {
        const ids = obj.getObjects().map(o => o.customId);
        setSelectedIds(ids);
        setLocked(obj.getObjects().some(o => o.lockMovementX));
      } else {
        setSelectedIds([obj.customId]);
        setLocked(obj.lockMovementX);
      }
    };

    canvas.on("selection:created", updateMenu);
    canvas.on("selection:updated", updateMenu);
    canvas.on("selection:cleared", () => {
      setMenuPosition(null);
      setSelectedIds([]);
      setActiveTool(null);
      setSelectedId(null);
    });

    canvas.on("object:moving", updateMenu);
    canvas.on("object:scaling", updateMenu);
    canvas.on("object:rotating", updateMenu);

    return () => {
      canvas.off("selection:created", updateMenu);
      canvas.off("selection:updated", updateMenu);
      canvas.off("selection:cleared");
      canvas.off("object:moving", updateMenu);
      canvas.off("object:scaling", updateMenu);
      canvas.off("object:rotating", updateMenu);
    };
  }, []);

  /* -------------------------------------------------- */
/* OBJECT MODIFIED → REDUX SYNC                       */
/* -------------------------------------------------- */
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  const handleObjectModified = (e) => {
    if (syncingRef.current) return;

    const obj = e.target;
    if (!obj) return;

    // 🔹 MULTI SELECTION
    if (obj.type === "activeselection") {
      const objects = obj.getObjects();

      objects.forEach(child => {
        if (!child.customId) return;

        // Normalize text scaling
        if (child.type === "text" || child.type === "textbox") {
          const newFontSize = child.fontSize * child.scaleX;
          child.set({
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1
          });
          child.setCoords();

          updateObject(child.customId, {
            fontSize: newFontSize,
            left: child.left,
            top: child.top,
            angle: child.angle
          });
        } else {
          updateObject(child.customId, {
            left: child.left,
            top: child.top,
            angle: child.angle,
            scaleX: child.scaleX,
            scaleY: child.scaleY
          });
        }
      });

      canvas.requestRenderAll();
      return;
    }

    // 🔹 SINGLE OBJECT
    if (obj.customId) {
      if (obj.type === "text" || obj.type === "textbox") {
        const newFontSize = obj.fontSize * obj.scaleX;

        obj.set({
          fontSize: newFontSize,
          scaleX: 1,
          scaleY: 1
        });
        obj.setCoords();

        updateObject(obj.customId, {
          fontSize: newFontSize,
          left: obj.left,
          top: obj.top,
          angle: obj.angle
        });
      } else {
        updateObject(obj.customId, {
          left: obj.left,
          top: obj.top,
          angle: obj.angle,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          width: obj.width,
          height: obj.height
        });
      }
    }
  };

  canvas.on("object:modified", handleObjectModified);

  return () => {
    canvas.off("object:modified", handleObjectModified);
  };
}, []);


  /* -------------------------------------------------- */
  /* FABRIC ← REDUX SYNC                                */
  /* -------------------------------------------------- */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    syncingRef.current = true;
    const fabricObjects = canvas.getObjects();

    canvasObjects.forEach(async (obj) => {
      let existing = fabricObjects.find(o => o.customId === obj.id);

      if (obj.type === "image") {
        if (!existing) {
          const img = await FabricImage.fromURL(obj.src, obj.props);
          img.customId = obj.id;
          canvas.add(img);
        } else {
          updateExisting(existing, obj);
        }
        return;
      }

      if (obj.type === "text") {
        if (!existing) {
          const text = obj.props.textEffect === "circle"
            ? CircleText(obj)
            : StraightText(obj);
          text.customId = obj.id;
          canvas.add(text);
        } else {
          existing.set(obj.props);
        }
        return;
      }

      if (shapes.includes(obj.type)) {
        if (!existing) {
          const shape = ShapeAdder(obj);
          shape.customId = obj.id;
          canvas.add(shape);
        } else {
          existing.set(obj.props);
        }
      }
    });

    // Remove deleted
    fabricObjects.forEach(o => {
      if (
        o.customId &&
        !canvasObjects.some(c => c.id === o.customId) &&
        o.customId !== "print-area-border"
      ) {
        canvas.remove(o);
      }
    });

    canvas.requestRenderAll();
    syncingRef.current = false;
  }, [canvasObjects]);

  /* -------------------------------------------------- */
  /* MENU ACTIONS                                       */
  /* -------------------------------------------------- */
  const onMenuAction = (action) => {
    handleCanvasAction(
      action,
      selectedIds,
      store.getState().canvas.present,
      dispatch,
      setCanvasObjects
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <canvas ref={canvasRef} />

      {menuPosition && selectedIds.length > 0 && (
        <FloatingMenu
          position={menuPosition}
          onAction={onMenuAction}
          isLocked={locked}
        />
      )}
    </div>
  );
}
