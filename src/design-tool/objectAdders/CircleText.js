import * as fabric from 'fabric';
import { blur } from 'three/tsl';

export default function CircleText(objData) {
  const props = objData.props;

  // Map Redux props to the flat structure your logic expects
  const obj = {
    text: props.text || 'Circle Text',
    radius: props.radius || 150,
    fontSize: props.fontSize || 20,
    fontFamily: props.fontFamily || 'Arial',
    letterSpacing: props.charSpacing || 0, // Mapped charSpacing -> letterSpacing
    color: props.fill || '#000000',
    opacity: props.opacity ?? 1,
    shadow:{
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
    width: props.width,
    height: props.height,
    id: objData.id
  };

  // --- YOUR PROVIDED LOGIC START ---
  const chars = obj.text.split('');
  const angleStep = (2 * Math.PI) / chars.length;

  const groupItems = chars.map((char, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const charX = obj.radius * Math.cos(angle);
    const charY = obj.radius * Math.sin(angle);

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
      angle: (angle * 180) / Math.PI + 90,
    });

    // Shadow
    if (obj.shadow) {
      fabricChar.set('shadow', {
        color: obj.shadow.color || '#fff',
        blur: obj.shadow.blur,
        offsetX: obj.shadow.offsetX,
        offsetY: obj.shadow.offsetY,
      });
    }

    // Stroke
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
    width: obj.width,
    height: obj.height,
    customId: obj.id,
    hasControls: true,
    textEffect: 'circle',
    customType: 'text',
    radius: obj.radius,
    text: obj.text,
    fontSize: obj.fontSize,
    fontFamily: obj.fontFamily,
    fill: obj.color // Save color on group for reference
  });
  // --- YOUR PROVIDED LOGIC END ---

  return group;
}