import { db as firestore } from '@/firebase';
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// --- HELPER: Cleans JSON (removes undefined) ---
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

// --- HELPER: Builds the Data Object (Shared Logic) ---
const buildDesignDoc = (id, canvas, productData, viewStates, currentView, isNew) => {
  const imageData = canvas.toDataURL({ format: "png", multiplier: 0.5 });
  const now = Date.now();
  let designDoc = {};

  if (productData && productData.productId) {
    // === PRODUCT MODE ===
    // 1. Get current canvas JSON
    const currentJSON = removeUndefined(canvas.toJSON());
    
    // 2. Merge with stored views (Front + Back + etc.)
    const allViewsJSON = {
      ...viewStates,           // Previous views (e.g., Front)
      [currentView]: currentJSON // The active view (e.g., Back)
    };

    designDoc = {
      type: 'PRODUCT',
      canvasJSON: JSON.stringify(allViewsJSON), // Save ALL views
      productConfig: {
        productId: productData.productId,
        variantColor: productData.color,
        activeView: currentView,
        printAreas: productData.print_areas
      }
    };
  } else {
    // === BLANK MODE ===
    designDoc = {
      type: 'BLANK',
      canvasJSON: removeUndefined(canvas.toJSON()), // Just single JSON
      productConfig: null
    };
  }

  // Common Fields
  designDoc.id = id;
  designDoc.imageData = imageData;
  designDoc.updatedAt = now;

  // Only set name/created for NEW designs
  if (isNew) {
    designDoc.name = "Untitled Design";
    designDoc.createdAt = now;
  }

  return designDoc;
};


// --- FUNCTION 1: SAVE NEW (Save as Copy / First Save) ---
export const saveNewDesign = async (userId, canvas, productData, viewStates, currentView, setSaving) => {
  if (!canvas || !userId) return;
  setSaving(true);

  try {
    const newDesignId = uuidv4();
    
    // Build the full data object
    const designDoc = buildDesignDoc(newDesignId, canvas, productData, viewStates, currentView, true);

    const designRef = doc(firestore, `users/${userId}/designs`, newDesignId);
    await setDoc(designRef, designDoc);

    return { success: true, message: "Saved as new design", id: newDesignId };
  } catch (err) {
    console.error("Error creating design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
  }
};


// --- FUNCTION 2: OVERWRITE (Update Existing) ---
export const overwriteDesign = async (userId, designId, canvas, productData, viewStates, currentView, setSaving) => {
  if (!canvas || !designId) return;
  setSaving(true);

  try {
    // Build the full data object (isNew = false)
    const designDoc = buildDesignDoc(designId, canvas, productData, viewStates, currentView, false);

    const designRef = doc(firestore, `users/${userId}/designs`, designId);
    await setDoc(designRef, designDoc, { merge: true });

    return { success: true, message: "Design overwritten" };
  } catch (err) {
    console.error("Error overwriting design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
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
