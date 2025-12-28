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
    flagVelocity: props.flagVelocity || 50, // ✅ GET FLAG VELOCITY
    id: objData.id
  };

  const chars = obj.text.split('');
  
  // ==========================================
  // 1. CALCULATE POSITIONS (ARC vs FLAG)
  // ==========================================
  
  let groupItems = [];

  // --- A. FLAG EFFECT LOGIC ---
  if (obj.textEffect === 'flag') {
      const step = obj.fontSize * 0.8 + obj.letterSpacing; // Horizontal spacing
      const totalWidth = step * (chars.length - 1);
      const startX = -totalWidth / 2;

      groupItems = chars.map((char, i) => {
          const charX = startX + (i * step);
          
          // Sine Wave Formula: y = A * sin(kx)
          // Adjust frequency (0.5) based on text length if needed
          const charY = Math.sin(i * 0.5) * obj.flagVelocity; 

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
              angle: 0 // Keep upright for simple flag
          });
          return fabricChar;
      });
  } 
  
  // --- B. ARC / CIRCLE LOGIC ---
  else {
      let totalAngle, startAngle, isFrown = false;

      switch (obj.textEffect) {
        case 'semicircle':
          totalAngle = Math.PI; 
          startAngle = -Math.PI; 
          break;
        case 'arc-up': // Smile (U)
          totalAngle = (obj.arcAngle * Math.PI) / 180; 
          startAngle = -Math.PI / 2 - (totalAngle / 2);
          break;
        case 'arc-down': // Frown (n)
          totalAngle = (obj.arcAngle * Math.PI) / 180;
          // For Frown, we start at the same angles but we will position differently
          startAngle = -Math.PI / 2 - (totalAngle / 2);
          isFrown = true; 
          break;
        case 'circle':
        default:
          totalAngle = 2 * Math.PI; 
          startAngle = -Math.PI / 2;
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

        let charX, charY, charAngle;

        if (isFrown) {
            // ✅ FIXED ARC DOWN:
            // Move center "down" relative to text, text curves over it.
            // We use the same math but flip the Y offset direction
            charX = obj.radius * Math.cos(theta);
            charY = -obj.radius * Math.sin(theta); // Flip Y to arch upwards
            
            // Rotation: Tangent + 90 + Flip logic
            // For a frown, letters should fan out top-to-bottom
            charAngle = (-theta * 180) / Math.PI + 90; 
        } else {
            // Standard Smile/Circle
            charX = obj.radius * Math.cos(theta);
            charY = obj.radius * Math.sin(theta);
            charAngle = (theta * 180) / Math.PI + 90; 
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
        return fabricChar;
      });
  }

  // ==========================================
  // 2. APPLY STYLES (Stroke/Shadow)
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

  // ==========================================
  // 3. CREATE GROUP
  // ==========================================
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
    radius: obj.radius,
    arcAngle: obj.arcAngle,
    flagVelocity: obj.flagVelocity, // Save Prop
    text: obj.text,
    fontSize: obj.fontSize,
    fontFamily: obj.fontFamily,
    fill: obj.color
  });

  return group;
}