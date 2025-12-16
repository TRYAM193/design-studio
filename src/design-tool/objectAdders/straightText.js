import { FabricText } from 'fabric';

export default function StraightText(obj) {
  if (!obj) return;
  const props = obj.props;
  return new FabricText(obj.props.text, {
    left: props.left,
    
    customType: 'text',
    customId: obj.id
  });
}