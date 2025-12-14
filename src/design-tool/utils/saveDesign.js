import { firestore } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

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

export const saveNewDesign = async (userId, canvas, setSaving) => {
  if (!canvas) return;

  const canvasJSON = removeUndefined(canvas.toJSON());
  const imageData = canvas.toDataURL("image/png");
  const designId = uuidv4();

  setSaving(true);

  try {
    const designRef = doc(
      firestore,
      `users/${userId}/designs`,
      designId
    );

    await setDoc(designRef, {
      id: designId,
      name: "Copy Design",
      canvasJSON,
      imageData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, message: "Saved as new copy", id: designId };
  } catch (err) {
    console.error("Error creating design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
    canvas.clear();
    canvas.renderAll();
  }
};

export const overwriteDesign = async (userId, designId, canvas, setSaving) => {
  if (!canvas || !designId) return;

  const canvasJSON = removeUndefined(canvas.toJSON());
  const imageData = canvas.toDataURL("image/png");

  setSaving(true);

  try {
    const designRef = doc(
      firestore,
      `users/${userId}/designs`,
      designId
    );

    await setDoc(designRef, {
      id: designId,
      name: "Updated Design",
      canvasJSON,
      imageData,
      updatedAt: Date.now(),
    }, { merge: true });

    return { success: true, message: "Design overwritten" };
  } catch (err) {
    console.error("Error overwriting design:", err);
    return { success: false, error: err };
  } finally {
    setSaving(false);
    canvas.clear();
    canvas.renderAll();
  }
};
