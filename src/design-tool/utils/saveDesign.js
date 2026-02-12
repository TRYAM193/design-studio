import { db as firestore } from '@/firebase'; // Adjust path if needed
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
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

export const exportSavedDesignImage = (designData) => {
  if (!designData || !designData.imageData) {
    alert("No preview image available for this design.");
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = designData.imageData; // The Base64 image string
    
    // Sanitize filename
    const safeName = (designData.name || "design").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}-preview.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error("Failed to download image:", error);
    alert("Could not download image.");
  }
};

export const exportReferenceImage = (canvas, fileName = 'design-preview', removeBg=false) => {
  if (!canvas) return;

  // 1. Save current state variables
  const activeObj = canvas.getActiveObject();
  
  // 2. Prepare Canvas for Snapshot
  // Deselect everything to remove the blue bounding boxes/handles
  canvas.discardActiveObject();
  
  // Find and hide the "Print Area Border" (Editor artifact)
  const borderObj = canvas.getObjects().find(obj => 
      obj.id === 'print-area-border' || obj.customId === 'print-area-border'
  );
  const wasBorderVisible = borderObj ? borderObj.visible : false;
  
  if (borderObj) {
      borderObj.visible = false;
  }
  // canvas.backgroundColor = 'transparent' //removeBg ? 'transparent' : canvas.backgroundColor || '#fff';
  canvas.requestRenderAll();

  try {
      // 3. Generate Image Data
      // Multiplier: 2 provides good quality for Retina screens/Reference without creating massive Print files.
      const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2, 
          enableRetinaScaling: true, 
      });

      // 4. Trigger Download
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `${fileName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

  } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export image.");
  } finally {
      // 5. Restore Editor State
      if (borderObj) {
          borderObj.visible = wasBorderVisible;
      }
      if (activeObj) {
          canvas.setActiveObject(activeObj);
      }
      canvas.requestRenderAll();
  }
};

export const saveGlobalTemplate = async (canvas, name, category = "General", objects) => {
  if (!canvas) return;

  try {
    // 1. Generate Thumbnail
    // We use a lower multiplier (1) for thumbnails to save space
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1, 
    });

    const templateData = {
      name: name || "Untitled Template",
      category,
      createdAt: Date.now(),
      type: 'BLANK', // Always BLANK as requested
      thumbnailUrl: dataURL, // In a real app, upload this to Storage and save the URL. For now, Base64 is okay for prototypes.
      canvasData: objects 
    };

    // 3. Save to Root Collection
    await addDoc(collection(firestore, "templates"), templateData);
    alert("Template created successfully!");

  } catch (error) {
    console.error("Error saving template:", error);
    alert("Failed to save template.");
  }
};