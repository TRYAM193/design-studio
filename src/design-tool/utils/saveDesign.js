import { db as firestore } from '@/firebase';
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

// Helper to clean JSON
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

const handleRedux = () => {
 store.dispatch(setCanvasObjects([]))
}

export const saveDesign = async ({ 
  userId, 
  designId, 
  canvas, 
  productData, // New: contains productId, color, category
  viewStates,  // New: contains JSON for other views { front: {...}, back: {...} }
  currentView, // New: "front", "back", etc.
  isNew = false,
  setSaving
}) => {
  if (!canvas || !userId) return;
  setSaving(true);

  try {
    const finalDesignId = designId || uuidv4();
    const now = Date.now();
    
    // 1. CAPTURE IMAGE (Current View)
    // This serves as the main dashboard thumbnail
    const imageData = canvas.toDataURL({ format: "png", multiplier: 0.5 }); // 0.5 for smaller size

    // 2. CAPTURE JSON
    let canvasJSON;
    let designType = 'BLANK';
    let productConfig = null;

    if (productData && productData.productId) {
      // --- PRODUCT MODE ---
      designType = 'PRODUCT';
      
      // Merge: Stored States + Current Canvas State
      const currentJSON = removeUndefined(canvas.toJSON());
      
      const allViews = {
        ...viewStates,           // Previous views (e.g., Front)
        [currentView]: currentJSON // The active view (e.g., Back)
      };

      canvasJSON = allViews; // We save an OBJECT of JSONs, not just one

      productConfig = {
        productId: productData.productId,
        variantColor: productData.color || '#ffffff',
        activeView: currentView, // So we load back into the same view
        printAreas: productData.print_areas // Store dims just in case
      };

    } else {
      // --- BLANK MODE ---
      designType = 'BLANK';
      canvasJSON = removeUndefined(canvas.toJSON()); // Just the single canvas
      
      productConfig = {
        width: canvas.width,
        height: canvas.height,
        backgroundColor: canvas.backgroundColor
      };
    }

    // 3. PREPARE DOCUMENT
    const designDoc = {
      id: finalDesignId,
      name: isNew ? "New Design" : undefined, // Don't overwrite name if updating
      type: designType,
      canvasJSON, // This is now either a single JSON or { front:..., back:... }
      imageData,
      productConfig,
      updatedAt: now,
      ...(isNew && { createdAt: now, name: "Untitled Design" }) // Set defaults for new
    };

    // Remove undefined keys (like name if updating)
    Object.keys(designDoc).forEach(key => designDoc[key] === undefined && delete designDoc[key]);

    // 4. WRITE TO FIRESTORE
    const designRef = doc(firestore, `users/${userId}/designs`, finalDesignId);
    await setDoc(designRef, designDoc, { merge: true });

    return { success: true, id: finalDesignId };

  } catch (err) {
    console.error("Error saving design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
    // Optional: Clear canvas if navigating away, but usually we stay
    // handleRedux(); 
  }
};

export const handleSaveTemp = (canvas) => {
  if (!canvas) return

  const rawJSON = canvas.toJSON();
  const cleanJSON = removeUndefined(rawJSON);

  let fileName = 'design-001.json'

  // 3. Convert to a formatted string
  const jsonString = JSON.stringify(cleanJSON, null, 2);

  // 4. Create a Blob (File-like object)
  const blob = new Blob([jsonString], { type: "application/json" });

  // 5. Create a temporary link to trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  
  // 6. Programmatically click the link
  document.body.appendChild(link);
  link.click();

  // 7. Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 
