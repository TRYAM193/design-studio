// src/design-tool/objectAdders/CircleText.js
import * as fabric from 'fabric';

export default function CircleText(objData) {
  const props = objData.props;

  // Map Redux props to flat structure
  const obj = {
    text: props.text || 'Curved Text',
    radius: props.radius || 150,
    fontSize: props.fontSize || 20,
    fontFamily: props.fontFamily || 'Arial',
    letterSpacing: props.charSpacing || 0,
    color: props.fill || '#000000',
    opacity: props.opacity ?? 1,
    shadow: {
      blur: props.shadowBlur || 0,
      offsetX: props.shadowOffsetX || 0,
      offsetY: props.shadowOffsetY || 0,
      color: props.shadowColor || '#000000'
    },
    strokeWidth: props.strokeWidth || 0,
    strokeColor: props.stroke || '#000000',
    x: props.left,
    y: props.top,
    scaleX: props.scaleX || 1, // ✅ ADDED
    scaleY: props.scaleY || 1, // ✅ ADDED
    angle: props.angle || 0,
    textEffect: props.textEffect || 'circle',
    arcAngle: props.arcAngle || 120, // ✅ GET ARC ANGLE
    id: objData.id
  };

  const chars = obj.text.split('');
  
  // 1. DETERMINE TOTAL ANGLE (Spread)
  let totalAngle, startAngle, isInverted = false;

  switch (obj.textEffect) {
    case 'semicircle':
      totalAngle = Math.PI; // Fixed 180
      startAngle = -Math.PI; // Start Left
      break;
    case 'arc-up':
      // ✅ USE USER ANGLE
      totalAngle = (obj.arcAngle * Math.PI) / 180; 
      // Center the arc at -90 degrees (Top)
      startAngle = -Math.PI / 2 - (totalAngle / 2);
      break;
    case 'arc-down':
      // ✅ USE USER ANGLE
      totalAngle = (obj.arcAngle * Math.PI) / 180;
      // Center the arc at -90 degrees (Top) -- but we will invert logic later
      startAngle = -Math.PI / 2 - (totalAngle / 2);
      isInverted = true;
      break;
    case 'circle':
    default:
      totalAngle = 2 * Math.PI; // 360
      startAngle = -Math.PI / 2;
      break;
  }

  // 2. CALCULATE ANGLE STEP
  // If Circle: divide by N. If Arc: divide by N-1 to spread edge-to-edge.
  const angleStep = obj.textEffect === 'circle' 
    ? totalAngle / chars.length 
    : totalAngle / (chars.length > 1 ? chars.length - 1 : 1); 

  // 3. BUILD CHARS
  const groupItems = chars.map((char, i) => {
    let theta;
    if (obj.textEffect === 'circle') {
       theta = i * angleStep + startAngle;
    } else {
       theta = startAngle + (i * angleStep);
    }

    let charX = obj.radius * Math.cos(theta);
    let charY = obj.radius * Math.sin(theta);
    let charAngle = (theta * 180) / Math.PI + 90; 

    // ✅ INVERT LOGIC FOR ARC DOWN
    if (isInverted) {
        charY = -charY; // Mirror Y
        charAngle = -charAngle + 180; // Mirror Rotation
    }

    const fabricChar = new fabric.FabricText(char, {
      left: charX,
      top: charY,
      originX: 'center',
      originY: 'center',
      fontSize: obj.fontSize,
      fontFamily: obj.fontFamily,
      charSpacing: obj.letterSpacing,
      fill: obj.color,
      opacity: obj.opacity,
      selectable: false,
      angle: charAngle,
    });

    // Apply Styles (Shadow, Stroke)
    if (obj.shadow) {
      fabricChar.set('shadow', {
        color: obj.shadow.color || '#fff',
        blur: obj.shadow.blur,
        offsetX: obj.shadow.offsetX,
        offsetY: obj.shadow.offsetY,
      });
    }

    if (obj.strokeWidth > 0) {
      fabricChar.set('stroke', obj.strokeColor || '#000');
      fabricChar.set('strokeWidth', obj.strokeWidth);
    }

    return fabricChar;
  });

  const group = new fabric.Group(groupItems, {
    left: obj.x,
    top: obj.y,
    originX: 'center',
    originY: 'center',
    angle: obj.angle,
    customId: obj.id,
    hasControls: true,
    textEffect: obj.textEffect, 
    customType: 'text',
    radius: obj.radius,
    arcAngle: obj.arcAngle, // ✅ SAVE PROP
    text: obj.text,
    fontSize: obj.fontSize,
    fontFamily: obj.fontFamily,
    fill: obj.color,
    scaleX: obj.scaleX, // ✅ ADDED
    scaleY: obj.scaleY, // ✅ ADDED
  });

  return group;
}