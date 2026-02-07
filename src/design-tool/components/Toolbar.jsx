// src/design-tool/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import {
  FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink,
  FiLoader, FiSlash, FiCircle, FiSmile, FiFrown, FiLayers, FiFlag
} from 'react-icons/fi';
import CircleText from '../objectAdders/CircleText';
import { Path } from 'fabric';
import {
  getStarPoints, getPolygonPoints, getTrianglePoints, getRoundedPathFromPoints,
  getArrowPoints, getDiamondPoints, getTrapezoidPoints, getLightningPoints
} from '../utils/shapeUtils';
import { useRef } from 'react';
import { processBackgroundRemoval } from '../utils/imageUtils';
import { AVAILABLE_FONTS } from '@/data/font';
import { FONTS } from '../../data/font.js'

const createFabricShadow = (color, blur, offsetX, offsetY) => {
  if ((!blur || blur === 0) && (offsetX === 0) && (offsetY === 0)) {
    return null;
  }
  return {
    color: color || '#000000',
    blur: blur || 0,
    offsetX: offsetX || 0,
    offsetY: offsetY || 0,
  };
};

// Function to directly update the Fabric object without touching Redux history
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


export default function Toolbar({ id, type, object, updateObject, removeObject, addText, fabricCanvas }) {
  const props = object?.props || {};
  const [liveProps, setLiveProps] = useState(props);

  const [borderRadius, setBorderRadius] = useState(props.rx || props.radius || 0);
  const [circleRadius, setCircleRadius] = useState(props.radius || 150);
  const [arcAngle, setArcAngle] = useState(props.arcAngle || 120);
  const [flagVelocity, setFlagVelocity] = useState(props.flagVelocity || 50);

  const currentEffect = object?.textEffect || props.textEffect || 'none';
  const effectiveType = object?.type || type;
  const isTextObject = effectiveType === 'text' || effectiveType === 'circle-text';
  const isShapeObject = ['rect', 'circle', 'triangle', 'star', 'pentagon', 'hexagon', 'line', 'arrow', 'diamond', 'trapezoid', 'heart', 'lightning', 'bubble'].includes(effectiveType);
  const supportsBorderRadius = ['rect', 'triangle', 'star', 'pentagon', 'hexagon', 'arrow', 'diamond', 'trapezoid', 'lightning'].includes(effectiveType);
  const colorCommitTimer = useRef(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const [currentFont, setCurrentFont] = useState(liveProps.fontFamily || 'Roboto')
  const fontCaps = FONTS[currentFont] || { bold: false, italic: false };

  const canBold = fontCaps.bold;
  const canItalic = fontCaps.italic;


  const handleRemoveBackground = async () => {
    if (!object || type !== 'image' || !fabricCanvas || isRemovingBg) return;

    const currentSrc = object.props.src || ''

    if (!currentSrc) {
      alert('No image source found!')
      return
    }

    try {
      setIsRemovingBg(true);
      const newImageUrl = await processBackgroundRemoval(currentSrc);
      const fabricObj = fabricCanvas.getObjects().find((o) => o.customId === id);

      if (fabricObj && newImageUrl) {
        const imgElement = new Image();
        imgElement.src = newImageUrl;
        imgElement.onload = () => {
          fabricObj.setElement(imgElement);
          fabricObj.setCoords();
          fabricCanvas.requestRenderAll();
          updateObject(id, { src: newImageUrl });
        }
      }
    } catch (error) {
      console.error('Error during background removal:', error);
      alert('Background removal failed. Please try again.');
    } finally {
      setIsRemovingBg(false);
    }
  }

  useEffect(() => {
    if (object && object.props) {
      setLiveProps(object.props);
      setBorderRadius(object.props.rx || object.props.radius || 0);
      setCircleRadius(object.props.radius || 150);
      setArcAngle(object.props.arcAngle || 120);
      setFlagVelocity(object.props.flagVelocity || 50);
    }
  }, [object]);

  const handleUpdateAndHistory = (key, value) => {
    const updates = { [key]: value };
    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];

    if (shadowKeys.includes(key)) {
      updateObject(id, updates);
      const mergedProps = { ...liveProps, [key]: value };
      const shadowObject = createFabricShadow(
        mergedProps.shadowColor,
        mergedProps.shadowBlur,
        mergedProps.shadowOffsetX,
        mergedProps.shadowOffsetY
      );
      updateObject(id, { shadow: shadowObject });
      return;
    }

    if (key === 'fontFamily') setCurrentFont(value)

    updateObject(id, updates);
  };

  const handleLiveUpdate = (key, value) => {
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps, object);
  };

  const toggleTextStyle = (style) => {
    let propKey, nextValue;
    const currentProps = object?.props || {};

    if (style === 'underline') {
      propKey = 'underline';
      nextValue = !currentProps.underline;
    } else if (style === 'italic') {
      if (!canItalic) return
      propKey = 'fontStyle';
      nextValue = currentProps.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (style === 'bold') {
      if (!canBold) return
      propKey = 'fontWeight';
      nextValue = currentProps.fontWeight === 'bold' ? 'normal' : 'bold';
    } else {
      return;
    }
    handleUpdateAndHistory(propKey, nextValue);
  };

  const applyTextEffect = (effectType) => {
    let updates = { textEffect: effectType };
    if (effectType === 'circle') {
      updates.radius = circleRadius;
    } else if (['arc-up', 'arc-down'].includes(effectType)) {
      updates.radius = circleRadius;
      updates.arcAngle = arcAngle;
    } else if (effectType === 'flag') {
      updates.flagVelocity = flagVelocity;
    } else if (effectType === 'none') {
      updates.path = null;
    }
    updateObject(id, updates);
  };

  const handleColorChange = (key, value) => {
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps, object);

    if (colorCommitTimer.current) {
      clearTimeout(colorCommitTimer.current);
    }

    colorCommitTimer.current = setTimeout(() => {
      handleUpdateAndHistory(key, value);
    }, 300);
  };


  if (!object) {
    return (
      <div className="property-panel-message">
        <p>Select an object on the canvas to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="property-panel-content">
      <h2 className="property-panel-title">
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Properties
      </h2>

      {/* ================= TEXT PROPERTIES ================= */}
      {isTextObject && (
        <div className="property-group">
          <h3 className="property-group-title">Text Content & Style</h3>

          <div className="control-row full-width">
            <textarea
              className="text-input"
              rows="3"
              value={liveProps.text || ''}
              onChange={(e) => handleUpdateAndHistory('text', e.target.value)}
              placeholder="Enter your text here"
            // ✅ REMOVED hardcoded black color
            />
          </div>

          <h3 className="property-group-subtitle">Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px', display: type === 'circle-text' ? 'none' : 'flex' }}>
            <button disabled={!canBold} className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => toggleTextStyle('bold')} title="Bold"><FiBold size={16} /></button>
            <button disabled={!canItalic} className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => toggleTextStyle('italic')} title="Italic"><FiItalic size={16} /></button>
            <button className={`style-button ${liveProps.underline ? 'active' : ''}`} onClick={() => toggleTextStyle('underline')} title="Underline"><FiUnderline size={16} /></button>
          </div>

          <h3 className="property-group-subtitle">Text Effects</h3>
          <div className="control-row-buttons">
            <button className={`style-button ${currentEffect === 'straight' ? 'active' : ''}`} onClick={() => applyTextEffect('straight')} title="Straight"><FiSlash size={16} /></button>
            <button className={`style-button ${currentEffect === 'circle' ? 'active' : ''}`} onClick={() => applyTextEffect('circle')} title="Circle"><FiCircle size={16} /></button>
            <button className={`style-button ${currentEffect === 'arc-up' ? 'active' : ''}`} onClick={() => applyTextEffect('arc-up')} title="Arc Up"><FiSmile size={16} /></button>
            <button className={`style-button ${currentEffect === 'arc-down' ? 'active' : ''}`} onClick={() => applyTextEffect('arc-down')} title="Arc Down"><FiFrown size={16} /></button>
            <button className={`style-button ${currentEffect === 'flag' ? 'active' : ''}`} onClick={() => applyTextEffect('flag')} title="Flag"><FiFlag size={16} /></button>
          </div>

          {['circle', 'arc-up', 'arc-down'].includes(currentEffect) && (
            <div className="control-row full-width">
              <div className="control-row">
                <label className="control-label">Radius (Curvature)</label>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{circleRadius}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="10" max="600" step="10"
                value={circleRadius}
                onInput={(e) => setCircleRadius(Number(e.target.value))}
                onChange={(e) => handleLiveUpdate('radius', Number(e.target.value))}
                onMouseUp={(e) => updateObject(id, { radius: Number(e.target.value) })}
              />
            </div>
          )}

          {['arc-up', 'arc-down'].includes(currentEffect) && (
            <div className="control-row full-width">
              <div className="control-row">
                <label className="control-label">Arc Angle (Spread)</label>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{arcAngle}°</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="10" max="360" step="5"
                value={arcAngle}
                onInput={(e) => setArcAngle(Number(e.target.value))}
                onChange={(e) => handleLiveUpdate('arcAngle', Number(e.target.value))}
                onMouseUp={(e) => updateObject(id, { arcAngle: Number(e.target.value) })}
              />
            </div>
          )}

          {currentEffect === 'flag' && (
            <div className="control-row full-width">
              <div className="control-row">
                <label className="control-label">Wave Velocity</label>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{flagVelocity}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="0" max="100" step="1"
                value={flagVelocity}
                onInput={(e) => setFlagVelocity(Number(e.target.value))}
                onChange={(e) => handleLiveUpdate('flagVelocity', Number(e.target.value))}
                onMouseUp={(e) => updateObject(id, { flagVelocity: Number(e.target.value) })}
              />
            </div>
          )}

          <h3 className="property-group-subtitle">Font Family</h3>
          <div className="control-row full-width">
            <select
              className="font-select"
              value={liveProps.fontFamily || 'Arial'}
              onChange={(e) => handleUpdateAndHistory('fontFamily', e.target.value)}
            >
              {AVAILABLE_FONTS.map(font => <option style={{fontFamily: font}} key={font} value={font}>{font}</option>)}
            </select>
          </div>

          <div className="control-row">
            <label className="control-label">Font Size</label>
            <input type="number" className="number-input small" value={Math.round(liveProps.fontSize || 0)} onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))} onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />
          </div>
          <input type="range" className="slider-input" min="10" max="200" value={liveProps.fontSize || 0} onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))} onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />

          <div className="control-row">
            <label className="control-label">Text Color</label>
            <input type="color" className="color-input" value={liveProps.fill || '#000000'} onChange={(e) => handleColorChange('fill', e.target.value)} />
          </div>

          <h3 className="property-group-title">Outline</h3>
          <div className="control-row">
            <label className="control-label">Color</label>
            <input type="color" className="color-input" value={liveProps.stroke || '#000000'} onChange={(e) => handleColorChange('stroke', e.target.value)} />
          </div>
          <div className="control-row">
            <label className="control-label">Width</label>
            <input type="number" className="number-input small" value={Math.round(liveProps.strokeWidth || 0)} onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))} onBlur={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))} />
          </div>
          <input type="range" className="slider-input" min="0" max="10" step="0.5" value={liveProps.strokeWidth || 0} onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))} onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))} />
        </div>
      )}

      {/* ================= SHAPE PROPERTIES ================= */}
      {isShapeObject && (
        <div className="property-group">
          <h3 className="property-group-title">Shape Style</h3>

          {type !== 'line' && (
            <div className="control-row">
              <label className="control-label">Fill Color</label>
              <input
                type="color"
                className="color-input"
                value={liveProps.fill || '#000000'}
                onChange={(e) => handleColorChange('fill', e.target.value)}
              />
            </div>
          )}

          <div className="control-row">
            <label className="control-label">{type === 'line' ? 'Line Color' : 'Border Color'}</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.stroke || '#000000'}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
            />
          </div>
          <div className="control-row">
            <label className="control-label">{type === 'line' ? 'Thickness' : 'Border Width'}</label>
            <input
              type="number"
              className="number-input small"
              value={Math.round(liveProps.strokeWidth || 0)}
              onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
              onBlur={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
            />
          </div>
          <input
            type="range"
            className="slider-input"
            min="0" max={type === 'line' ? 50 : 20} step="1"
            value={liveProps.strokeWidth || 0}
            onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
            onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
          />

          {supportsBorderRadius && (
            <>
              <div className="control-row" style={{ marginTop: '15px' }}>
                <label className="control-label">Corner Radius</label>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{Math.round(borderRadius)}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="0"
                max={effectiveType === 'rect' ? 100 : 40}
                step="1"
                value={borderRadius}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBorderRadius(val);

                  if (effectiveType === 'rect') {
                    setLiveProps(prev => ({ ...prev, rx: val, ry: val }));
                    liveUpdateFabric(fabricCanvas, id, { rx: val, ry: val }, liveProps, object);
                  } else {
                    setLiveProps(prev => ({ ...prev, radius: val }));
                    liveUpdateFabric(fabricCanvas, id, { radius: val }, liveProps, object);
                  }
                }}
                onMouseUp={(e) => {
                  const val = Number(e.target.value);
                  const key = effectiveType === 'rect' ? 'rx' : 'radius';
                  updateObject(id, { [key]: val, ...(effectiveType === 'rect' ? { ry: val } : {}) });
                }}
              />
            </>
          )}
        </div>
      )}

      {/* ================= GENERAL PROPERTIES ================= */}
      <div className="property-group">
        <h3 className="property-group-title">General Appearance</h3>
        <div className="control-row">
          <label className="control-label">Opacity</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round((liveProps.opacity || object.props.opacity || 0) * 100)}
            onChange={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100)}
            onBlur={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="0" max="100" step="1"
          value={Math.round((liveProps.opacity || object.props.opacity || 0) * 100)}
          onChange={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100)}
          onMouseUp={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)}
        />
      </div>

      {/* ================= SHADOW EFFECT ================= */}
      <div className="property-group">
        <h3 className="property-group-title">Shadow Effect</h3>

        <div className="control-row">
          <label className="control-label">Shadow Color</label>
          <input
            type="color"
            className="color-input"
            value={liveProps.shadowColor || '#000000'}
            onChange={(e) => handleColorChange('shadowColor', e.target.value)}
          />
        </div>

        <div className="control-row">
          <label className="control-label">Blur</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowBlur || 0)}
            onChange={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value), object)}
            onBlur={(e) => handleUpdateAndHistory('shadowBlur', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="0"
          max="50"
          step="1"
          value={liveProps.shadowBlur || 0}
          onInput={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowBlur', Number(e.target.value))}
        />

        <div className="control-row">
          <label className="control-label">Offset X</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetX || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value), object)}
            onBlur={(e) => handleUpdateAndHistory('shadowOffsetX', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="-10"
          max="10"
          step="1"
          value={liveProps.shadowOffsetX || 0}
          onInput={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetX', Number(e.target.value))}
        />

        <div className="control-row">
          <label className="control-label">Offset Y</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetY || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value), object)}
            onBlur={(e) => handleUpdateAndHistory('shadowOffsetY', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="-10"
          max="10"
          step="1"
          value={liveProps.shadowOffsetY || 0}
          onInput={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetY', Number(e.target.value))}
        />
      </div>

      {type === 'image' && (
        <div className="property-group">
          <button
            className="primary-button full-width"
            onClick={handleRemoveBackground}
            disabled={isRemovingBg}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isRemovingBg ? (
              <>
                <FiLoader className="icon-spin" /> Processing AI...
              </>
            ) : (
              <>
                <FiLayers /> Remove Background
              </>
            )}
          </button>
          <p style={{ fontSize: '10px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
            *First time may take a moment to load AI models.
          </p>
        </div>
      )}
    </div>
  );
}