import { FabricText } from 'fabric';
import { blur } from 'three/tsl';

export default function StraightText(obj) {
  if (!obj) return;
  const props = obj.props;
  const shadows = {
    color: props.shadowColor,
    blur: props.shadowBlur,
    offsetX: props.shadowOffsetX,
    offsetY: props.shadowOffsetY
  }

  const StraightText = new FabricText(obj.props.text, {
    left: props.left,
    top: props.top,
    width: props.width,
    height: props.height,
    opacity: props.opacity,
    fontFamily: props.fontFamily,
    fontSize: props.fontSize,
    fill: props.fill,
    charSpacing: props.charSpacing || 0, 
    customType: 'text',
    customId: obj.id
  });

  if (obj.strokeWidth > 0) {
      StraightText.set('stroke', props.strokeColor || '#000');
      StraightText.set('strokeWidth', props.strokeWidth);
    }

  if (shadows) {
    StraightText.set('shadow', shadows)
  }
}