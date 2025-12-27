import { db as firestore } from '@/firebase';
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// --- HELPER: Clean JSON ---
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

// --- HELPER: Build Data Object ---
const buildDesignDoc = (id, canvas, productData, viewStates, currentView, isNew, thumbnailDataUrl) => {
  // Use the passed clean thumbnail, or fallback to canvas capture (which might have borders)
  const imageData = thumbnailDataUrl || canvas.toDataURL({ format: "png", multiplier: 0.5 });
  const now = Date.now();
  let designDoc = {};

  // 1. Clean the current view's objects (remove border object from JSON)
  const currentJSON = removeUndefined(canvas.toJSON());
  if (currentJSON.objects) {
    currentJSON.objects = currentJSON.objects.filter(obj => 
      obj.customId !== 'print-area-border' && obj.id !== 'print-area-border'
    );
  }

  if (productData && productData.productId) {
    // === PRODUCT MODE ===
    const allViewsJSON = {
      ...viewStates,           // Previous views
      [currentView]: currentJSON // Current view (clean)
    };

    designDoc = {
      type: 'PRODUCT',
      canvasJSON: JSON.stringify(allViewsJSON),
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
      canvasJSON: currentJSON,
      productConfig: null
    };
  }

  designDoc.id = id;
  designDoc.imageData = imageData;
  designDoc.updatedAt = now;

  if (isNew) {
    designDoc.name = "Untitled Design";
    designDoc.createdAt = now;
  }
  
  return designDoc;
};

// --- SAVE NEW ---
export const saveNewDesign = async (userId, canvas, productData, viewStates, currentView, setSaving, thumbnailDataUrl) => {
  if (!canvas || !userId) return;
  setSaving(true);

  try {
    const newDesignId = uuidv4();
    const designDoc = buildDesignDoc(newDesignId, canvas, productData, viewStates, currentView, true, thumbnailDataUrl);

    const designRef = doc(firestore, `users/${userId}/designs`, newDesignId);
    await setDoc(designRef, designDoc);

    return { success: true, message: "Saved successfully", id: newDesignId };
  } catch (err) {
    console.error("Error creating design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
  }
};

// --- OVERWRITE ---
export const overwriteDesign = async (userId, designId, canvas, productData, viewStates, currentView, setSaving, thumbnailDataUrl) => {
  if (!canvas || !designId) return;
  setSaving(true);

  try {
    const designDoc = buildDesignDoc(designId, canvas, productData, viewStates, currentView, false, thumbnailDataUrl);
    
    // We strictly use setDoc with merge: true to avoid deleting fields we don't know about
    const designRef = doc(firestore, `users/${userId}/designs`, designId);
    await setDoc(designRef, designDoc, { merge: true });

    return { success: true, message: "Design updated", id: designId };
  } catch (err) {
    console.error("Error overwriting design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
  }
};

// --- EXPORT JSON (Temp) ---
export const handleSaveTemp = (canvas) => {
  if (!canvas) return;
  const rawJSON = canvas.toJSON();
  // Filter border from download too
  if(rawJSON.objects) {
    rawJSON.objects = rawJSON.objects.filter(obj => obj.customId !== 'print-area-border');
  }
  const cleanJSON = removeUndefined(rawJSON);
  const blob = new Blob([JSON.stringify(cleanJSON, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `design-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}