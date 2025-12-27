import { db as firestore } from '@/firebase';
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// --- HELPER: Build Data Object (Redux Version) ---
const buildDesignDoc = (id, currentObjects, viewStates, productData, currentView, isNew, thumbnailDataUrl, name) => {
  const now = Date.now();
  
  // 1. Merge Current View Objects into ViewStates
  // We clean the objects to ensure no undefined values or border objects slip in
  const cleanObjects = (currentObjects || []).filter(obj => 
    obj.id !== 'print-area-border' && obj.customId !== 'print-area-border'
  );

  const finalViewStates = {
    ...viewStates,
    [currentView]: cleanObjects
  };

  let designDoc = {};

  if (productData && productData.productId) {
    // === PRODUCT MODE ===
    designDoc = {
      type: 'PRODUCT',
      // We save the raw Redux arrays, NOT the Fabric Canvas JSON
      canvasData: finalViewStates, 
      productConfig: {
        productId: productData.productId,
        variantColor: productData.color || null,
        variantSize: productData.size || null, // ✅ Using the passed URL data
        activeView: currentView || 'front',
        printAreas: productData.print_areas || {}
      }
    };
  } else {
    // === BLANK MODE ===
    designDoc = {
      type: 'BLANK',
      canvasData: cleanObjects, // Just the array for single view
      productConfig: null
    };
  }

  designDoc.id = id;
  designDoc.imageData = thumbnailDataUrl; // We expect Editor to pass the clean snapshot
  designDoc.updatedAt = now;

  if (isNew) {
    designDoc.name = name || 'Untitled Design';
    designDoc.createdAt = now;
  }
  
  // JSON.parse(JSON.stringify) is a dirty but effective way to strip undefineds
  return JSON.parse(JSON.stringify(designDoc));
};

// --- SAVE NEW ---
export const saveNewDesign = async (userId, currentObjects, viewStates, productData, currentView, setSaving, thumbnailDataUrl, name='Untitled Design') => {
  if (!userId) return;
  setSaving(true);

  try {
    const newDesignId = uuidv4();
    const designDoc = buildDesignDoc(newDesignId, currentObjects, viewStates, productData, currentView, true, thumbnailDataUrl, name);

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
export const overwriteDesign = async (userId, designId, currentObjects, viewStates, productData, currentView, setSaving, thumbnailDataUrl) => {
  if (!designId) return;
  setSaving(true);

  try {
    const designDoc = buildDesignDoc(designId, currentObjects, viewStates, productData, currentView, false, thumbnailDataUrl);
    
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