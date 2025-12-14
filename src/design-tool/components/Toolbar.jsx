import React, { useState, useEffect } from 'react';
import {
  FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink,
  FiLoader, FiSlash, FiCircle, FiActivity, FiSunrise, FiFlag
} from 'react-icons/fi';
import WebFont from 'webfontloader';
import CircleText from '../objectAdders/CircleText';
import { Path } from 'fabric';
import {
  getStarPoints, getPolygonPoints, getTrianglePoints, getRoundedPathFromPoints,
  getArrowPoints, getDiamondPoints, getTrapezoidPoints, getLightningPoints
} from '../utils/shapeUtils';
import { useRef } from 'react';


const FONT_OPTIONS = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New'];

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

function extractFontNameFromUrl(url) {
  if (!url) return null;
  const matchFamily = url.match(/family=([^&:]+)/);
  if (matchFamily && matchFamily[1]) {
    return decodeURIComponent(matchFamily[1].replace(/\+/g, ' '));
  }
  return null;
}

// --- LIVE UPDATE LOGIC ---
// Updates Fabric object directly for smooth performance without spamming Redux history
// Function to directly update the Fabric object without touching Redux history
function liveUpdateFabric(fabricCanvas, id, updates, currentLiveProps, object) {
  if (!fabricCanvas) return;
  const existing = fabricCanvas.getObjects().find((o) => o.customId === id);
  if (!existing) return;

  let finalUpdates = { ...updates };

  // 1. Handle Shadow (Existing logic)
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

  // 2. Handle Shape Rounding (Swapping Polygons for Paths) [NEW LOGIC]
  const type = object.type; // Use Redux type (e.g., 'star')
  const shapeTypes = ['star', 'pentagon', 'hexagon', 'triangle', 'arrow', 'diamond', 'trapezoid', 'lightning']; // 🆕

  // Check if we are updating radius for a supported shape
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

    // Generate smoothed path data
    const pathData = getRoundedPathFromPoints(points, r);

    // Create new Path object
    const newPathObj = new Path(pathData, {
      ...existing.toObject(['customId']),
      ...finalUpdates,
      path: pathData
    });

    // Swap Objects on Canvas
    const index = fabricCanvas.getObjects().indexOf(existing);
    fabricCanvas.remove(existing);
    fabricCanvas.add(newPathObj);
    if (index > -1) fabricCanvas.moveObjectTo(newPathObj, index);

    fabricCanvas.setActiveObject(newPathObj);
    newPathObj.setCoords();
    fabricCanvas.requestRenderAll();
    return;
  }

  // 3. Handle Text / Rect / Circle Updates (Existing logic)
  existing.set(finalUpdates);

  if (existing.type === 'text') {
    if (finalUpdates.text !== undefined || finalUpdates.fontFamily !== undefined || finalUpdates.fontSize !== undefined) {
      existing.initDimensions();
    }
  }

  if (existing.textEffect === 'circle') {
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

  // Font State
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [showFontUrlInput, setShowFontUrlInput] = useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [originalFontFamily, setOriginalFontFamily] = useState(props.fontFamily || 'Arial');

  // Unified Radius State (for Rects AND Shapes)
  const [borderRadius, setBorderRadius] = useState(props.rx || props.radius || 0);
  const [circleRadius, setCircleRadius] = useState(props.radius || 150); // Specifically for Text Circle Effect

  const currentEffect = object?.textEffect || props.textEffect || 'none';
  const effectiveType = object?.type || type;
  const isTextObject = effectiveType === 'text' || effectiveType === 'circle-text';
  const isShapeObject = ['rect', 'circle', 'triangle', 'star', 'pentagon', 'hexagon', 'line', 'arrow', 'diamond', 'trapezoid', 'heart', 'lightning', 'bubble'].includes(effectiveType);
  const supportsBorderRadius = ['rect', 'triangle', 'star', 'pentagon', 'hexagon', 'arrow', 'diamond', 'trapezoid', 'lightning'].includes(effectiveType);
  const colorCommitTimer = useRef(null);


  useEffect(() => {
    if (object && object.props) {
      setLiveProps(object.props);
      // Sync local state
      setBorderRadius(object.props.rx || object.props.radius || 0);
      setCircleRadius(object.props.radius || 150);
    }
  }, [object]);

  // --- HANDLERS ---

  const handleApplyFont = (fontName) => {
    if (!fontName || isFontLoading) return;

    if (FONT_OPTIONS.includes(fontName) || fontName === originalFontFamily) {
      liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps, object);
      handleUpdateAndHistory('fontFamily', fontName);
      return;
    }

    setIsFontLoading(true);
    liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps, object);

    WebFont.load({
      google: { families: [fontName] },
      fontactive: (familyName) => {
        setIsFontLoading(false);
        handleUpdateAndHistory('fontFamily', familyName);
      },
      fontinactive: (familyName) => {
        setIsFontLoading(false);
        alert(`Failed to load font: ${familyName}. Please check the spelling.`);
        setLiveProps(prev => ({ ...prev, fontFamily: originalFontFamily }));
        liveUpdateFabric(fabricCanvas, id, { fontFamily: originalFontFamily }, liveProps, object);
        handleUpdateAndHistory('fontFamily', originalFontFamily);
      },
      timeout: 3000
    });
  };

  const handleUrlPaste = () => {
    const fontName = extractFontNameFromUrl(googleFontUrl);
    if (fontName) {
      setLiveProps(prev => ({ ...prev, fontFamily: fontName }));
      setGoogleFontUrl('');
      setShowFontUrlInput(false);
      handleApplyFont(fontName);
    } else {
      alert('Could not extract a valid font name from the link.');
    }
  };

  // ✅ SAVES TO HISTORY (Redux)
  // Call this onMouseUp (sliders), onBlur (inputs), or onClick (buttons)
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

    updateObject(id, updates);
  };

  // ✅ VISUAL ONLY (Fabric)
  // Call this onChange (sliders/color) for smooth updates
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
      propKey = 'fontStyle';
      nextValue = currentProps.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (style === 'bold') {
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
    } else if (effectType === 'none') {
      updates.path = null;
    }
    updateObject(id, updates);
  };

  const handleColorChange = (key, value) => {
    // 🔹 live update (Fabric only)
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps, object);

    // 🔹 clear previous commit
    if (colorCommitTimer.current) {
      clearTimeout(colorCommitTimer.current);
    }

    // 🔹 commit AFTER user stops changing color
    colorCommitTimer.current = setTimeout(() => {
      handleUpdateAndHistory(key, value);
    }, 300); // 250–400ms feels perfect
  };


  // --- RENDER ---
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
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              onChange={(e) => handleLiveUpdate('text', e.target.value)}
              placeholder="Enter your text here"
            />
          </div>

          <h3 className="property-group-subtitle">Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px', display: type === 'circle-text' ? 'none' : 'flex' }}>
            <button className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => toggleTextStyle('bold')} title="Bold"><FiBold size={16} /></button>
            <button className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => toggleTextStyle('italic')} title="Italic"><FiItalic size={16} /></button>
            <button className={`style-button ${liveProps.underline ? 'active' : ''}`} onClick={() => toggleTextStyle('underline')} title="Underline"><FiUnderline size={16} /></button>
          </div>

          {/* Text Effects */}
          <h3 className="property-group-subtitle">Text Effects</h3>
          <div className="control-row-buttons">
            <button className={`style-button ${currentEffect === 'straight' ? 'active' : ''}`} onClick={() => applyTextEffect('straight')} title="Straight"><FiSlash size={16} /></button>
            <button className={`style-button ${currentEffect === 'circle' ? 'active' : ''}`} onClick={() => applyTextEffect('circle')} title="Circle"><FiCircle size={16} /></button>
            <button className={`style-button ${currentEffect === 'semicircle' ? 'active' : ''}`} onClick={() => applyTextEffect('semicircle')} title="Semicircle"><FiSunrise size={16} /></button>
            <button className={`style-button ${currentEffect === 'flag' ? 'active' : ''}`} onClick={() => applyTextEffect('flag')} title="Flag"><FiFlag size={16} /></button>
          </div>

          {currentEffect === 'circle' && (
            <div className="control-row full-width">
              <div className="control-row">
                <label className="control-label">Radius</label>
                <span style={{ fontSize: '12px', color: '#666' }}>{circleRadius}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="50" max="400" step="10"
                value={circleRadius}
                onInput={(e) => {
                  const val = Number(e.target.value);
                  setCircleRadius(val);
                }}
                onMouseUp={(e) => updateObject(id, { radius: Number(e.target.value) })}
                onChange={(e) => handleLiveUpdate('radius', Number(e.target.value))}
              />
            </div>
          )}

          {/* FONT FAMILY SECTION */}
          <h3 className="property-group-subtitle">Font Family</h3>
          <div className="control-row full-width font-control-group">
            <input
              type="text"
              className="text-input font-input"
              value={liveProps.fontFamily || ''}
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)}
              placeholder="Enter font name (e.g., Roboto)"
              disabled={isFontLoading}
            />
            <div className="font-link-helper">
              <button
                className="style-button primary-button apply small-button apply-button"
                onClick={() => handleApplyFont(liveProps.fontFamily)}
                disabled={!liveProps.fontFamily || isFontLoading}
              >
                {isFontLoading ? <FiLoader size={16} className="icon-spin" /> : 'Apply'}
              </button>
              <button className="style-button" onClick={() => setShowFontUrlInput(prev => !prev)} disabled={isFontLoading}><FiSearch size={16} /></button>
              <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer" className="style-button external-link-button"><FiExternalLink size={16} /></a>
            </div>
          </div>

          {showFontUrlInput && (
            <div className="control-row full-width font-url-input-group">
              <p className="font-helper-text">Paste the full Google Fonts **link** or **@import** statement:</p>
              <textarea
                rows="2"
                className="text-input"
                value={googleFontUrl}
                onChange={(e) => setGoogleFontUrl(e.target.value)}
                placeholder="e.g., https://fonts.googleapis.com/css2?family=Roboto..."
              />
              <button
                className="primary-button small-button"
                onClick={handleUrlPaste}
                disabled={!googleFontUrl.trim()}
              >
                Extract & Apply
              </button>
            </div>
          )}

          <h3 className="property-group-subtitle" style={{ marginTop: '15px' }}>System Presets</h3>
          <div className="control-row full-width">
            <select
              className="font-select"
              value={liveProps.fontFamily || 'Arial'}
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)}
              disabled={isFontLoading}
            >
              {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
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

          {/* Fill Color (Skip for lines) */}
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

          {/* 🆕 UNIVERSAL BORDER RADIUS SLIDER */}
          {supportsBorderRadius && (
            <>
              <div className="control-row" style={{ marginTop: '15px' }}>
                <label className="control-label">Corner Radius</label>
                <span style={{ fontSize: '12px', color: '#666' }}>{Math.round(borderRadius)}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="0"
                max={effectiveType === 'rect' ? 100 : 40} // Limit radius for complex shapes
                step="1"
                value={borderRadius}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBorderRadius(val);

                  // Handle Rect vs Other Shapes
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
                  // Save to Redux History
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
          <button className="primary-button full-width">Remove Background (AI)</button>
        </div>
      )}
    </div>
  );
}