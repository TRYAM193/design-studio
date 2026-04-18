// src/design-tool/utils/aiService.js
import { getFunctions, httpsCallable } from "firebase/functions";

export const warmUpAIBackend = async () => {
  const functions = getFunctions();
  const warmUpAI = httpsCallable(functions, 'warmUpAI');
  try {
    await warmUpAI();
    console.log("AI Backend Warmed Up");
  } catch (err) {
    console.warn("AI Warm-up failed (skipping):", err);
  }
};

export const generateDesignJsonFromPrompt = async (prompt, style, canvasWidth, canvasHeight, productInfo, imageBase64 = null) => {
  const functions = getFunctions();
  const generateFabricJson = httpsCallable(functions, 'generateFabricJson');

  try {
    const result = await generateFabricJson({ prompt, style, canvasWidth, canvasHeight, productInfo, imageBase64 });
    
    if (result.data.success) {
      return {
        objects: result.data.objects,
        suggestedBg: result.data.backgroundColor
      };
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};