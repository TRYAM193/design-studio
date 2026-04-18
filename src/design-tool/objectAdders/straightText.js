import { FabricText, Textbox } from 'fabric';
import { resolveFillForFabric } from '../utils/gradientUtils';

export default function StraightText(obj) {
  if (!obj || !obj.props) return;
  
  const props = obj.props;

  // 🛡️ THE FIX: Guarantee a string is passed to Fabric, fallback to a space if empty
  const safeText = props.text !== undefined && props.text !== null 
    ? String(props.text) 
    : " "; 

  const commonProps = {
    ...props,
    fill: resolveFillForFabric(props.fill),
    stroke: resolveFillForFabric(props.stroke),
    customType: 'text',
    customId: obj.id
  };

  // Create the correct Fabric class based on the Redux type to prevent type-mismatch loops
  if (obj.type === 'textbox') {
    return new Textbox(safeText, commonProps);
  }

  return new FabricText(safeText, commonProps);
}