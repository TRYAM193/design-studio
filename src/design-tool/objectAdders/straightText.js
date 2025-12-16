import { FabricText } from 'fabric';

export default function StraightText(obj) {
  if (!obj) return;
  const props = obj.props;
  const shadows = {
    color: 
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

  if (props.stroke || props.strokeWidth){
    StraightText.set({
      stroke: props.stroke || 'white',
      strokeWidth: props.strokeWidth || 0
    })
  }

  if (props.shadowColor || )
}