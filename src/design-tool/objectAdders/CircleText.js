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
    angle: props.angle || 0,
    scaleX: props.scaleX || 1,
    scaleY: props.scaleY || 1,
    textEffect: props.textEffect || 'circle',
    arcAngle: props.arcAngle || 120,
    flagVelocity: props.flagVelocity || 50, 
    id: objData.id
  };

  const chars = obj.text.split('');
  let groupItems = [];

  // ==========================================
  // 1. FLAG EFFECT (SINE WAVE)
  // ==========================================
  if (obj.textEffect === 'flag') {
      const step = obj.fontSize * 0.8 + obj.letterSpacing; 
      const totalWidth = step * (chars.length - 1);
      const startX = -totalWidth / 2;

      groupItems = chars.map((char, i) => {
          const charX = startX + (i * step);
          // Sine Wave: y = A * sin(kx)
          // Frequency is fixed (0.5), Amplitude is controlled by velocity
          const charY = Math.sin(i * 0.5) * (obj.flagVelocity || 0); 

          return new fabric.FabricText(char, {
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
              angle: 0
          });
      });
  } 
  
  // ==========================================
  // 2. ARC / CIRCLE LOGIC
  // ==========================================
  else {
      let totalAngle, startAngle;
      let rotationOffset = 90; // Default: Bottoms of letters point to center

      switch (obj.textEffect) {
        case 'semicircle':
          totalAngle = Math.PI; 
          startAngle = -Math.PI; 
          break;
          
        case 'arc-down': // Frown / Rainbow (n)
          // Text sits at TOP of circle (-90 degrees)
          totalAngle = (obj.arcAngle * Math.PI) / 180;
          startAngle = -Math.PI / 2 - (totalAngle / 2);
          rotationOffset = 90; // Standard: Upright at top
          break;

        case 'arc-up': // Smile (u)
          // Text sits at BOTTOM of circle (+90 degrees)
          totalAngle = (obj.arcAngle * Math.PI) / 180;
          startAngle = Math.PI / 2 - (totalAngle / 2);
          rotationOffset = -90; // Inverted: Bottoms point AWAY from center
          break;

        case 'circle':
        default:
          totalAngle = 2 * Math.PI; 
          startAngle = -Math.PI / 2;
          rotationOffset = 90;
          break;
      }

      const angleStep = obj.textEffect === 'circle' 
        ? totalAngle / chars.length 
        : totalAngle / (chars.length > 1 ? chars.length - 1 : 1); 

      groupItems = chars.map((char, i) => {
        let theta;
        if (obj.textEffect === 'circle') {
           theta = i * angleStep + startAngle;
        } else {
           theta = startAngle + (i * angleStep);
        }

        const charX = obj.radius * Math.cos(theta);
        const charY = obj.radius * Math.sin(theta);
        
        // Calculate rotation based on tangent + offset
        const charAngle = (theta * 180) / Math.PI + rotationOffset;

        return new fabric.FabricText(char, {
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
      });
  }

  // ==========================================
  // 3. APPLY STYLES & GROUP
  // ==========================================
  groupItems.forEach(item => {
      if (obj.shadow) {
          item.set('shadow', {
            color: obj.shadow.color || '#fff',
            blur: obj.shadow.blur,
            offsetX: obj.shadow.offsetX,
            offsetY: obj.shadow.offsetY,
          });
      }
      if (obj.strokeWidth > 0) {
          item.set('stroke', obj.strokeColor || '#000');
          item.set('strokeWidth', obj.strokeWidth);
      }
  });

  const group = new fabric.Group(groupItems, {
    left: obj.x,
    top: obj.y,
    originX: 'center',
    originY: 'center',
    angle: obj.angle,
    scaleX: obj.scaleX, 
    scaleY: obj.scaleY,
    
    customId: obj.id,
    hasControls: true,
    textEffect: obj.textEffect, 
    customType: 'text',
    
    // Persist Props
    radius: obj.radius,
    arcAngle: obj.arcAngle,
    flagVelocity: obj.flagVelocity, 
    
    text: obj.text,
    fontSize: obj.fontSize,
    fontFamily: obj.fontFamily,
    fill: obj.color
  });

  return group;
}