import { db as firestore } from '@/firebase'; // Adjust path if needed
import { doc, setDoc, collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// --- HELPER: Build Data Object ---
const buildDesignDoc = (id, currentObjects, viewStates, productData, currentView, isNew, thumbnailDataUrl, name) => {
  const now = Date.now();
  
  // Clean objects
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
      canvasData: finalViewStates, 
      productConfig: {
        productId: productData.productId,
        variantColor: productData.color || null,
        variantSize: productData.size || null,
        activeView: currentView || 'front',
        printAreas: productData.print_areas || {}
      }
    };
  } else {
    // === BLANK MODE ===
    designDoc = {
      type: 'BLANK',
      canvasData: finalViewStates.front || cleanObjects // Default to front/single view
    };
  }

  // Common Fields
  designDoc.id = id;
  designDoc.name = name || "Untitled Design"; // ✅ Save Name
  designDoc.updatedAt = now;
  if (thumbnailDataUrl) designDoc.imageData = thumbnailDataUrl;
  if (isNew) {
    designDoc.createdAt = now;
    designDoc.userId = id.split('_')[0]; // Assuming ID implies user, or pass userId explicitly
  }

  return designDoc;
};

// --- SAVE NEW DESIGN ---
export const saveNewDesign = async (userId, currentObjects, viewStates, productData, currentView, setSaving, thumbnailDataUrl, name) => {
  setSaving(true);
  try {
    const newId = uuidv4(); // Generate new ID
    
    const designDoc = buildDesignDoc(newId, currentObjects, viewStates, productData, currentView, true, thumbnailDataUrl, name);
    designDoc.userId = userId; // Explicitly set User ID

    const designRef = doc(firestore, `users/${userId}/designs`, newId);
    await setDoc(designRef, designDoc);

    return { success: true, message: "Design saved successfully", id: newId };
  } catch (err) {
    console.error("Error saving new design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
  }
};

// --- OVERWRITE EXISTING DESIGN ---
export const overwriteDesign = async (userId, designId, currentObjects, viewStates, productData, currentView, setSaving, thumbnailDataUrl, name) => {
  if (!designId) return { success: false, error: "No Design ID provided" };
  setSaving(true);

  try {
    // ✅ Pass 'name' to the builder
    const designDoc = buildDesignDoc(designId, currentObjects, viewStates, productData, currentView, false, thumbnailDataUrl, name);
    
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