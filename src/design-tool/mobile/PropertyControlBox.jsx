import React, { useState, useEffect, useRef } from 'react';
import {
    Check, Minus, Plus, Bold, Italic, Underline,
    Ban, Circle, Smile, Frown, Flag,
    Loader2, Eraser, Layers, ArrowUp, ArrowDown,
    ArrowUpFromLine, ArrowDownToLine, ImagePlus
} from 'lucide-react';
import { AVAILABLE_FONTS } from '@/data/font';
import { COLOR_MAP } from '@/lib/colorMaps';
import { Path } from 'fabric';
import CircleText from '@/design-tool/objectAdders/CircleText';
import { processBackgroundRemoval } from '@/design-tool/utils/imageUtils';
import {
    getStarPoints, getPolygonPoints, getTrianglePoints, getRoundedPathFromPoints,
    getArrowPoints, getDiamondPoints, getTrapezoidPoints, getLightningPoints
} from '@/design-tool/utils/shapeUtils';

// --- 1. LIVE UPDATE LOGIC ---
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

// --- 2. LIVE SLIDER COMPONENT ---
const LiveSlider = ({ label, value, min, max, step, object, propKey, updateObject, fabricCanvas, displayMultiplier = 1, onCommitOverride }) => {
    const [localVal, setLocalVal] = useState(value ?? 0);
    useEffect(() => { setLocalVal(value ?? 0); }, [value, object.id]);

    const handleChange = (e) => {
        const newVal = parseFloat(e.target.value);
        setLocalVal(newVal);
        const fabricValue = newVal / displayMultiplier;
        const props = object.props || object;
        liveUpdateFabric(fabricCanvas, object.id, { [propKey]: fabricValue }, props, object);
    };

    const handleCommit = (e) => {
        const finalVal = parseFloat(e.target.value);
        const fabricVal = finalVal / displayMultiplier;

        if (onCommitOverride) {
            onCommitOverride(fabricVal);
        } else {
            updateObject(object.id, { [propKey]: fabricVal });
        }
    };

    return (
        <div className="px-2 mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>{label}</span>
                <span>{Math.round(localVal)}</span>
            </div>
            <div className="flex items-center gap-4">
                <input
                    type="range" min={min} max={max} step={step}
                    value={localVal} onChange={handleChange} onMouseUp={handleCommit} onTouchEnd={handleCommit}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
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
            <div className="flex gap-3 pb-2 no-scrollbar">
                {Object.entries(COLOR_MAP).map(([name, hex]) => (
                    <button
                        key={name}
                        onClick={() => handleUpdate(targetProp, hex)}
                        className={`w-10 h-10 rounded-full shrink-0 border-2 transition-transform ${currentFill === hex ? 'border-orange-500 scale-110' : 'border-white/10'}`}
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
        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
            <div>
                <span className="text-xs text-slate-400 mb-2 block">Shadow Color</span>
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
                <p className="text-sm text-slate-300">Remove background using AI.</p>
                <p className="text-[10px] text-slate-500">This consumes 1 AI Credit.</p>
            </div>

            <button
                onClick={handleRemoveBg}
                disabled={isProcessing}
                className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${isProcessing ? 'bg-slate-700 text-slate-400' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/40'}`}
            >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Eraser size={20} />}
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
                        const reader = new FileReader();
                        reader.onload = (f) => {
                            updateObject(object.id, { src: f.target.result });
                            const fabricObj = fabricCanvas.getObjects().find(o => o.customId === object.id);
                            if (fabricObj) {
                                fabricObj.setSrc(f.target.result, () => fabricCanvas.requestRenderAll());
                            }
                            onClose();
                        };
                        reader.readAsDataURL(file);
                        e.target.value = null;
                    }
                }}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
            >
                <ImagePlus size={20} />
                <span>Upload New Image</span>
            </button>
        </div>
    );

    const renderLayerTools = () => {
        const moveLayer = (direction) => {
            const fabricObj = fabricCanvas.getObjects().find(o => o.customId === object.id);
            if (!fabricObj) return;
            if (direction === 'up') fabricObj.bringForward();
            if (direction === 'down') fabricObj.sendBackwards();
            if (direction === 'front') fabricObj.bringToFront();
            if (direction === 'back') fabricObj.sendToBack();
            fabricCanvas.requestRenderAll();
        };

        return (
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => moveLayer('up')} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center gap-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5">
                    <ArrowUp size={20} /> Forward
                </button>
                <button onClick={() => moveLayer('down')} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center gap-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5">
                    <ArrowDown size={20} /> Backward
                </button>
                <button onClick={() => moveLayer('front')} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center gap-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5">
                    <ArrowUpFromLine size={20} /> To Front
                </button>
                <button onClick={() => moveLayer('back')} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center gap-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5">
                    <ArrowDownToLine size={20} /> To Back
                </button>
            </div>
        );
    };

    // --- MAIN SWITCHER ---
    let content = null;
    let title = "";

    switch (activeProperty) {
        case 'fill': title = "Color"; content = renderColorPicker('fill'); break;
        case 'fontSize': title = "Size"; content = <LiveSlider label="Text Size" value={getValue('fontSize')} min={10} max={200} step={1} propKey="fontSize" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />; break;
        case 'opacity': title = "Opacity"; content = <LiveSlider label="Opacity (%)" value={(getValue('opacity') || 1) * 100} min={0} max={100} step={5} propKey="opacity" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} displayMultiplier={100} />; break;

        // Shape Specific
        case 'radius':
            title = "Roundness";
            const isRect = object.type === 'rect';
            // Logic: Rect uses rx (0-100), others use radius (0-40)
            content = (
                <LiveSlider
                    label="Corner Radius"
                    value={getValue(isRect ? 'rx' : 'radius') ?? 0}
                    min={0} max={isRect ? 100 : 40} step={1}
                    propKey={isRect ? 'rx' : 'radius'}
                    object={object}
                    updateObject={updateObject}
                    fabricCanvas={fabricCanvas}
                    // Special commit logic for Rect to update both RX and RY
                    onCommitOverride={(val) => {
                        if (isRect) updateObject(object.id, { rx: val, ry: val });
                        else updateObject(object.id, { radius: val });
                    }}
                />
            );
            break;

        // Text Specific
        case 'text': title = "Edit Text"; content = <textarea value={getValue('text') || ""} onChange={(e) => handleUpdate('text', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" rows={3} />; break;
        case 'fontFamily': title = "Font"; content = (
            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                {AVAILABLE_FONTS.map(font => (
                    <button key={font} onClick={() => handleUpdate('fontFamily', font)} className={`text-left px-4 py-3 rounded-lg border ${getValue('fontFamily') === font ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 text-slate-300'}`} style={{ fontFamily: font }}>{font}</button>
                ))}
            </div>
        ); break;
        case 'format': title = "Style"; content = (
            <div className="flex justify-around items-center p-2">
                <button onClick={() => handleUpdate('fontWeight', getValue('fontWeight') === 'bold' ? 'normal' : 'bold')} className={`p-4 rounded-xl border ${getValue('fontWeight') === 'bold' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-white/5'}`}><Bold size={24} /></button>
                <button onClick={() => handleUpdate('fontStyle', getValue('fontStyle') === 'italic' ? 'normal' : 'italic')} className={`p-4 rounded-xl border ${getValue('fontStyle') === 'italic' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-white/5'}`}><Italic size={24} /></button>
                <button onClick={() => handleUpdate('underline', !getValue('underline'))} className={`p-4 rounded-xl border ${getValue('underline') ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-white/5'}`}><Underline size={24} /></button>
            </div>
        ); break;
        case 'effect': title = "Text Effects"; content = (
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[{ id: 'none', icon: <Ban size={20} />, label: 'None' }, { id: 'circle', icon: <Circle size={20} />, label: 'Circle' }, { id: 'arc-up', icon: <Smile size={20} />, label: 'Arc Up' }, { id: 'arc-down', icon: <Frown size={20} />, label: 'Arc Down' }, { id: 'flag', icon: <Flag size={20} />, label: 'Flag' }].map(e => (
                        <button key={e.id} onClick={() => handleUpdate('textEffect', e.id)} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl border ${getValue('textEffect') === e.id ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-slate-800 border-white/5 text-slate-400'}`}>{e.icon}<span className="text-[10px]">{e.label}</span></button>
                    ))}
                </div>
                {['circle', 'arc-up', 'arc-down'].includes(getValue('textEffect')) && <LiveSlider label="Curve Radius" value={getValue('radius') ?? 150} min={10} max={600} step={10} propKey="radius" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
                {['arc-up', 'arc-down'].includes(getValue('textEffect')) && <LiveSlider label="Arc Angle" value={getValue('arcAngle') ?? 120} min={10} max={360} step={5} propKey="arcAngle" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
                {getValue('textEffect') === 'flag' && <LiveSlider label="Wave Speed" value={getValue('flagVelocity') ?? 50} min={0} max={100} step={1} propKey="flagVelocity" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />}
            </div>
        ); break;

        // Shared Outline
        case 'outline': title = "Outline"; content = (
            <div className="flex flex-col gap-4">
                <div><span className="text-xs text-slate-400 mb-2 block">Color</span>{renderColorPicker('stroke')}</div>
                <LiveSlider label="Width" value={getValue('strokeWidth') ?? 0} min={0} max={10} step={0.5} propKey="strokeWidth" object={object} updateObject={updateObject} fabricCanvas={fabricCanvas} />
            </div>
        ); break;

        // Image Specific
        case 'remove-bg': title = "Remove Background"; content = renderRemoveBg(); break;
        case 'replace': title = "Replace Image"; content = renderReplace(); break;

        // Common
        case 'shadow': title = "Shadow"; content = renderShadow(); break;
        case 'layer': title = "Layer Order"; content = renderLayerTools(); break;
        default: return null;
    }

    return (
        <div className="fixed bottom-[90px] left-4 right-4 z-30 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                    <Check size={16} />
                </button>
            </div>
            <div className="p-5 overflow-y-auto">{content}</div>
        </div>
    );
}