// src/design-tool/mobile/PropertyControlBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Check, Plus, Bold, Italic, Underline,
    Ban, Circle, Smile, Frown, Flag,
    Loader2, Eraser, ArrowUp, ArrowDown,
    ArrowUpFromLine, ArrowDownToLine, ImagePlus,
    Type, Droplets, Move, Sun
} from 'lucide-react'; // Added icons for the new UI
import { AVAILABLE_FONTS } from '@/data/font';
import { COLOR_MAP } from '@/lib/colorMaps';
import { Path } from 'fabric';
import CircleText from '@/design-tool/objectAdders/CircleText';
import { processBackgroundRemoval } from '@/design-tool/utils/imageUtils';
import {
    getStarPoints, getPolygonPoints, getTrianglePoints, getRoundedPathFromPoints,
    getArrowPoints, getDiamondPoints, getTrapezoidPoints, getLightningPoints
} from '@/design-tool/utils/shapeUtils';

// --- 1. LIVE UPDATE LOGIC (UNCHANGED) ---
function liveUpdateFabric(fabricCanvas, id, updates, currentLiveProps, object) {
    if (!fabricCanvas) return;
    const existing = fabricCanvas.getObjects().find((o) => o.customId === id);
    if (!existing) return;

    let finalUpdates = { ...updates };

    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];
    const shadowUpdateKeys = Object.keys(updates).filter(key => shadowKeys.includes(key));

    if (shadowUpdateKeys.length > 0) {
        const mergedProps = { ...currentLiveProps, ...updates };
        finalUpdates.shadow = createFabricShadow(
            mergedProps.shadowColor,
            mergedProps.shadowBlur,
            mergedProps.shadowOffsetX,
            mergedProps.shadowOffsetY
        );
        shadowKeys.forEach(key => delete finalUpdates[key]);
    }

    const type = object.type;
    const shapeTypes = ['star', 'pentagon', 'hexagon', 'triangle', 'arrow', 'diamond', 'trapezoid', 'lightning'];

    if (shapeTypes.includes(type) && (updates.radius !== undefined || updates.rx !== undefined)) {
        const mergedProps = { ...currentLiveProps, ...updates };
        const r = mergedProps.radius !== undefined ? mergedProps.radius : (mergedProps.rx || 0);

        let points = [];
        if (type === 'star') points = getStarPoints(5, 50, 25);
        else if (type === 'pentagon') points = getPolygonPoints(5, 50);
        else if (type === 'hexagon') points = getPolygonPoints(6, 50);
        else if (type === 'triangle') points = getTrianglePoints(100, 100);
        else if (type === 'arrow') points = getArrowPoints(100, 100);
        else if (type === 'diamond') points = getDiamondPoints(100, 150);
        else if (type === 'trapezoid') points = getTrapezoidPoints(100, 80);
        else if (type === 'lightning') points = getLightningPoints(50, 100);

        const pathData = getRoundedPathFromPoints(points, r);

        const newPathObj = new Path(pathData, {
            ...existing.toObject(['customId']),
            ...finalUpdates,
            path: pathData
        });

        const index = fabricCanvas.getObjects().indexOf(existing);
        fabricCanvas.remove(existing);
        fabricCanvas.add(newPathObj);
        if (index > -1) fabricCanvas.moveObjectTo(newPathObj, index);

        fabricCanvas.setActiveObject(newPathObj);
        newPathObj.setCoords();
        fabricCanvas.requestRenderAll();
        return;
    }

    existing.set(finalUpdates);

    if (existing.type === 'text') {
        if (finalUpdates.text !== undefined || finalUpdates.fontFamily !== undefined || finalUpdates.fontSize !== undefined) {
            existing.initDimensions();
        }
    }

    const specialEffects = ['circle', 'semicircle', 'arc-up', 'arc-down', 'flag'];
    const isSpecialEffect = specialEffects.includes(existing.textEffect) || specialEffects.includes(updates.textEffect);

    if (isSpecialEffect) {
        const mergedProps = { ...currentLiveProps, ...updates };
        const newGroup = CircleText({ id: id, props: mergedProps });
        const index = fabricCanvas.getObjects().indexOf(existing);
        fabricCanvas.remove(existing);
        fabricCanvas.add(newGroup);
        if (index > -1) fabricCanvas.moveObjectTo(newGroup, index);

        fabricCanvas.setActiveObject(newGroup);
        newGroup.setCoords();
        fabricCanvas.requestRenderAll();
        return;
    }

    existing.setCoords();
    fabricCanvas.requestRenderAll();
}

// Helper for shadow (needed if not imported)
const createFabricShadow = (color, blur, offsetX, offsetY) => {
    if ((!blur || blur === 0) && (offsetX === 0) && (offsetY === 0)) return null;
    return { color: color || '#000000', blur: blur || 0, offsetX: offsetX || 0, offsetY: offsetY || 0 };
};


// --- 2. NEW SCRUBBABLE SLIDER (MOBILE & TOUCH FRIENDLY) ---
const LiveSlider = ({ label, value, min, max, step, object, propKey, updateObject, fabricCanvas, displayMultiplier = 1, onCommitOverride }) => {
    const startX = useRef(0);
    const startVal = useRef(0);
    const [localVal, setLocalVal] = useState(value ?? 0);

    // Sync external changes
    useEffect(() => { setLocalVal(value ?? 0); }, [value, object.id]);

    const updateValue = (newVal) => {
        // Clamp
        if (min !== undefined) newVal = Math.max(min, newVal);
        if (max !== undefined) newVal = Math.min(max, newVal);

        setLocalVal(newVal);

        // Live Update Fabric
        const fabricValue = newVal / displayMultiplier;
        const props = object.props || object;
        liveUpdateFabric(fabricCanvas, object.id, { [propKey]: fabricValue }, props, object);
    };

    const commitValue = (finalVal) => {
        if (min !== undefined) finalVal = Math.max(min, finalVal);
        if (max !== undefined) finalVal = Math.min(max, finalVal);

        const fabricVal = finalVal / displayMultiplier;

        if (onCommitOverride) {
            onCommitOverride(fabricVal);
        } else {
            updateObject(object.id, { [propKey]: fabricVal });
        }
    };

    // --- MOUSE EVENTS ---
    const handleMouseDown = (e) => {
        e.preventDefault();
        startX.current = e.clientX;
        startVal.current = localVal;
        document.body.style.cursor = 'ew-resize';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const delta = (e.clientX - startX.current) * step;
        updateValue(Math.round(startVal.current + delta));
    };

    const handleMouseUp = (e) => {
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // We can use the current localVal for commit
        // But to be safe (closure staleness), let's calc one last time or use ref
        const delta = (e.clientX - startX.current) * step;
        commitValue(Math.round(startVal.current + delta));
    };

    // --- TOUCH EVENTS (Mobile Scrubbing) ---
    const handleTouchStart = (e) => {
        // Don't prevent default immediately to allow tap, but for drag we need control
        startX.current = e.touches[0].clientX;
        startVal.current = localVal;
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchMove = (e) => {
        e.preventDefault(); // Stop scrolling while scrubbing
        // Slower sensitivity for touch
        const delta = (e.touches[0].clientX - startX.current) * step * 0.8;
        updateValue(Math.round(startVal.current + delta));
    };

    const handleTouchEnd = (e) => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        // Since we don't have event coordinates in touchend, we rely on the last state update
        // However, state might be async. A ref tracker is better.
        // For simplicity, we trigger commit with the last known good calculation if we tracked it, 
        // OR we just assume the live update worked and just sync the DB.
        // Let's re-calculate delta from the touch list if possible? No.
        // Let's just commit the current 'localVal'. Note: closure might see old val.
        // SAFEST: Just trigger the parent update with the value we *pushed* to it? 
        // Actually, updateObject is enough.
        // To be perfectly safe, we'll re-read the last value from a ref in a real app, 
        // but here we can just fire the commit with the value currently in the input (via blur) or just the last calculated.

        // workaround: Since updateValue updated localVal, and React batches, 
        // we might not have it here. But we don't need 'e'. We just need to tell Redux "Save this".
        // We will pass the startVal + delta logic if we tracked delta.
        // Let's simply allow the user to lift finger, and we commit the last live value.
        // We'll update the object with the *calculated* value from the last move.
        // For this code, we'll rely on the input's onBlur/Commit or just firing it.
        // Let's use the 'onCommit' prop style by passing the last value we set.
        // Since we can't easily get it, we'll assume the last 'liveUpdateFabric' call set the visual state, 
        // so we just need to persist it.

        // Actually, let's just use the `value` prop from the parent if it updated? No.
        // We will trigger a commit using the last set value.
        // We can store `lastTouchValue` in a ref.
    };

    // Ref to track latest value for touch end commit
    const latestVal = useRef(value);
    useEffect(() => { latestVal.current = localVal; }, [localVal]);

    const safeTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', safeTouchEnd);
        commitValue(latestVal.current);
    };

    return (
        <div className="flex items-center gap-3 mb-3 animate-in fade-in duration-300">
            {/* 1. Draggable Label */}
            <div
                className="flex items-center gap-1.5 w-20 cursor-ew-resize touch-none select-none text-slate-400 active:text-orange-400 transition-colors"
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                    startX.current = e.touches[0].clientX;
                    startVal.current = localVal;
                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('touchend', safeTouchEnd);
                }}
            >
                {/* Optional Icon mapping based on label could go here */}
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">{label}</span>
            </div>

            {/* 2. Visual Input Bar */}
            <div className="flex-1 relative h-9 bg-slate-800/50 rounded-lg border border-white/5 overflow-hidden group hover:border-white/20 transition-all">
                {/* Progress Fill */}
                <div
                    className="absolute top-0 left-0 h-full bg-orange-500/10 pointer-events-none transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, ((localVal - min) / (max - min)) * 100))}%` }}
                />

                {/* Number Input */}
                <input
                    type="number"
                    className="w-full h-full bg-transparent text-sm font-medium text-white px-3 focus:outline-none text-right relative z-10 appearance-none m-0"
                    value={Math.round(localVal) || 0}
                    onChange={(e) => updateValue(Number(e.target.value))}
                    onBlur={(e) => commitValue(Number(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && commitValue(Number(e.currentTarget.value))}
                />
            </div>
        </div>
    );
};

// --- 3. MAIN COMPONENT ---
export default function PropertyControlBox({ activeProperty, object, updateObject, onClose, fabricCanvas }) {
    if (!activeProperty || !object) return null;

    const fileInputRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const getValue = (key) => object.props?.[key] ?? object[key];
    const handleUpdate = (key, value) => updateObject(object.id, { [key]: value });

    // --- RENDERERS ---

    const renderColorPicker = (targetProp) => {
        const currentFill = getValue(targetProp);
        return (
            <div className="flex gap-3 pb-2 overflow-x-auto no-scrollbar mask-linear-fade">
                {Object.entries(COLOR_MAP).map(([name, hex]) => (
                    <button
                        key={name}
                        onClick={() => handleUpdate(targetProp, hex)}
                        className={`w-10 h-10 rounded-full shrink-0 border-2 transition-transform ${currentFill === hex ? 'border-orange-500 scale-110 shadow-lg shadow-orange-500/20' : 'border-white/10'}`}
                        style={{ backgroundColor: hex }}
                    />
                ))}
                <div className="relative w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 border-2 border-white/20 flex items-center justify-center">
                    <input type="color" className="absolute inset-0 opacity-0 w-full h-full" onChange={(e) => handleUpdate(targetProp, e.target.value)} />
                    <Plus size={16} className="text-white drop-shadow-md" />
                </div>
            </div>
        );
    };

    const renderShadow = () => (
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
            <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">Shadow Color</span>
                {renderColorPicker('shadowColor')}
            </div>
            <LiveSlider label="Blur" value={getValue('shadowBlur') ?? 0} min={0} max={50} step={1} propKey="shadowBlur" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />
            <LiveSlider label="Offset X" value={getValue('shadowOffsetX') ?? 0} min={-20} max={20} step={1} propKey="shadowOffsetX" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />
            <LiveSlider label="Offset Y" value={getValue('shadowOffsetY') ?? 0} min={-20} max={20} step={1} propKey="shadowOffsetY" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />
        </div>
    );

    const handleRemoveBg = async () => {
        if (!object.props?.src || isProcessing) return;
        setIsProcessing(true);
        try {
            const newUrl = await processBackgroundRemoval(object.props.src);
            if (newUrl) {
                updateObject(object.id, { src: newUrl });
                const fabricObj = fabricCanvas.getObjects().find(o => o.customId === object.id);
                if (fabricObj) {
                    fabricObj.setSrc(newUrl, () => {
                        fabricObj.setCoords();
                        fabricCanvas.requestRenderAll();
                        setIsProcessing(false);
                        onClose();
                    });
                } else {
                    setIsProcessing(false);
                }
            }
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
        }
    };

    const renderRemoveBg = () => (
        <div className="flex flex-col gap-4 items-center py-4">
            <div className="text-center mb-2">
                <p className="text-sm text-slate-300 font-medium">AI Background Removal</p>
                <p className="text-[11px] text-slate-500">Automatically removes background from image.</p>
            </div>

            <button
                onClick={handleRemoveBg}
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-white/5 ${isProcessing ? 'bg-slate-800 text-slate-400' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            >
                {isProcessing ? <Loader2 className="animate-spin text-orange-500" size={20} /> : <Eraser size={20} className="text-orange-500" />}
                {isProcessing ? "Processing..." : "Remove Background"}
            </button>
        </div>
    );

    const renderReplace = () => (
        <div className="flex flex-col gap-4 items-center py-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const localUrl = URL.createObjectURL(file); // Use Blob for speed
                        // Update object
                        updateObject(object.id, { src: localUrl });
                        const fabricObj = fabricCanvas.getObjects().find(o => o.customId === object.id);
                        if (fabricObj) {
                            fabricObj.setSrc(localUrl, () => fabricCanvas.requestRenderAll());
                        }
                        onClose();
                    }
                }}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
            >
                <ImagePlus size={20} className="text-blue-400" />
                <span>Upload New Image</span>
            </button>
        </div>
    );

    const renderLayerTools = () => {
        const moveLayer = (direction) => {
            const fabricObj = fabricCanvas.getObjects().find(o => o.customId === object.id);
            if (!fabricObj) return;

            // These methods belong to the canvas, not the object
            if (direction === 'up') fabricCanvas.bringObjectForward(fabricObj);
            if (direction === 'down') fabricCanvas.sendObjectBackwards(fabricObj);
            if (direction === 'front') fabricCanvas.bringObjectToFront(fabricObj);
            if (direction === 'back') fabricCanvas.sendObjectToBack(fabricObj);

            fabricCanvas.requestRenderAll();
        };

        return (
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Forward", icon: ArrowUp, fn: () => moveLayer('up') },
                    { label: "Backward", icon: ArrowDown, fn: () => moveLayer('down') },
                    { label: "To Front", icon: ArrowUpFromLine, fn: () => moveLayer('front') },
                    { label: "To Back", icon: ArrowDownToLine, fn: () => moveLayer('back') },
                ].map((action, i) => (
                    <button key={i} onClick={action.fn} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center gap-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 active:scale-95 transition-all">
                        <action.icon size={20} className="text-slate-400 group-hover:text-white" />
                        {action.label}
                    </button>
                ))}
            </div>
        );
    };

    // --- MAIN SWITCHER ---
    let content = null;
    let title = "";

    switch (activeProperty) {
        case 'fill': title = "Color"; content = renderColorPicker('fill'); break;
        case 'fontSize': title = "Size"; content = <LiveSlider label="Text Size" value={getValue('fontSize')} min={10} max={200} step={1} propKey="fontSize" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />; break;
        case 'opacity': title = "Opacity"; content = <LiveSlider label="Opacity" value={(getValue('opacity') || 1) * 100} min={0} max={100} step={5} propKey="opacity" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} displayMultiplier={100} />; break;

        // Shape Specific
        case 'radius':
            title = "Roundness";
            const isRect = object.type === 'rect';
            content = (
                <LiveSlider
                    label="Radius"
                    value={getValue(isRect ? 'rx' : 'radius') ?? 0}
                    min={0} max={isRect ? 100 : 40} step={1}
                    propKey={isRect ? 'rx' : 'radius'}
                    object={object}
                    updateObject={updateObject}
                    fabricCanvas={fabricCanvas}
                    onCommitOverride={(val) => {
                        if (isRect) updateObject(object.id, { rx: val, ry: val });
                        else updateObject(object.id, { radius: val });
                    }}
                />
            );
            break;

        // Text Specific
        case 'text': title = "Edit Text"; content = <textarea value={getValue('text') || ""} onChange={(e) => handleUpdate('text', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-sm" rows={3} />; break;
        case 'fontFamily': title = "Font"; content = (
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1">
                {AVAILABLE_FONTS.map(font => (
                    <button key={font} onClick={() => handleUpdate('fontFamily', font)} className={`text-left px-4 py-3 rounded-lg border transition-all ${getValue('fontFamily') === font ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 text-slate-300 hover:bg-white/5'}`} style={{ fontFamily: font }}>{font}</button>
                ))}
            </div>
        ); break;
        case 'format': title = "Style"; content = (
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/5">
                {[
                    { key: 'fontWeight', val: 'bold', icon: Bold, active: getValue('fontWeight') === 'bold', fn: () => handleUpdate('fontWeight', getValue('fontWeight') === 'bold' ? 'normal' : 'bold') },
                    { key: 'fontStyle', val: 'italic', icon: Italic, active: getValue('fontStyle') === 'italic', fn: () => handleUpdate('fontStyle', getValue('fontStyle') === 'italic' ? 'normal' : 'italic') },
                    { key: 'underline', val: true, icon: Underline, active: getValue('underline'), fn: () => handleUpdate('underline', !getValue('underline')) },
                ].map((btn, i) => (
                    <button key={i} onClick={btn.fn} className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all ${btn.active ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
                        <btn.icon size={20} />
                    </button>
                ))}
            </div>
        ); break;
        case 'effect': title = "Text Effects"; content = (
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[{ id: 'none', icon: <Ban size={20} />, label: 'None' }, { id: 'circle', icon: <Circle size={20} />, label: 'Circle' }, { id: 'arc-up', icon: <Smile size={20} />, label: 'Arc Up' }, { id: 'arc-down', icon: <Frown size={20} />, label: 'Arc Down' }, { id: 'flag', icon: <Flag size={20} />, label: 'Flag' }].map(e => (
                        <button key={e.id} onClick={() => handleUpdate('textEffect', e.id)} className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-[64px] rounded-xl border transition-all ${getValue('textEffect') === e.id ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}>{e.icon}<span className="text-[9px] font-bold uppercase">{e.label}</span></button>
                    ))}
                </div>
                {['circle', 'arc-up', 'arc-down'].includes(getValue('textEffect')) && <LiveSlider label="Curve" value={getValue('radius') ?? 150} min={10} max={600} step={10} propKey="radius" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
                {['arc-up', 'arc-down'].includes(getValue('textEffect')) && <LiveSlider label="Angle" value={getValue('arcAngle') ?? 120} min={10} max={360} step={5} propKey="arcAngle" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
                {getValue('textEffect') === 'flag' && <LiveSlider label="Wave" value={getValue('flagVelocity') ?? 50} min={0} max={100} step={1} propKey="flagVelocity" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
            </div>
        ); break;

        case 'outline': title = "Outline"; content = (
            <div className="flex flex-col gap-2">
                <div className="mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Color</span>{renderColorPicker('stroke')}</div>
                <LiveSlider label="Thickness" value={getValue('strokeWidth') ?? 0} min={0} max={10} step={0.5} propKey="strokeWidth" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />
            </div>
        ); break;

        case 'remove-bg': title = "Remove Background"; content = renderRemoveBg(); break;
        case 'replace': title = "Replace Image"; content = renderReplace(); break;
        case 'shadow': title = "Shadow"; content = renderShadow(); break;
        case 'layer': title = "Layer Order"; content = renderLayerTools(); break;
        default: return null;
    }

    return (
        <div className="fixed bottom-[90px] left-3 right-3 z-50 bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/5 bg-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
                <button onClick={onClose} className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <Check size={14} />
                </button>
            </div>
            {/* Body */}
            <div className="p-5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {content}
            </div>
        </div>
    );
}