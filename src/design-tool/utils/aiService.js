// src/design-tool/utils/aiService.js
import { getFunctions, httpsCallable } from "firebase/functions";

export const generateImageFromPrompt = async (prompt, style) => {
  const functions = getFunctions();
  const generateAiImage = httpsCallable(functions, 'generateAiImage');

  try {
    const result = await generateAiImage({ prompt, style });
    
    if (result.data.success) {
      return result.data.image; // Returns the Data URI
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};