// src/design-tool/utils/imageUtils.js
import { removeBackground } from "@imgly/background-removal";

export const processBackgroundRemoval = async (imageSource) => {
  try {
    // Configuration to ensure it works with local/blob URLs
    const config = {
      progress: (key, current, total) => {
        console.log(`Downloading ${key}: ${current} of ${total}`);
      },
      // You can host models locally later if needed, but CDN is fine for now
    };

    // process the removal
    const blob = await removeBackground(imageSource, config);
    console.log(URL.createObjectURL(blob))
    
    // Convert the result blob to a URL that Fabric.js can use
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
};