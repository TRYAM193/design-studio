import { FabricText } from 'fabric';

export default function StraightText(obj) {
  if (!obj) return;
  const props = obj.props;
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

  if (props.stro)
}