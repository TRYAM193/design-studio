// src/design-tool/utils/dpiCalculator.js

export const calculateImageDPI = (
    fabricObject, 
    canvasWidth, 
    canvasHeight, 
    printAreaWidthPx, 
    printAreaHeightPx
) => {
    // 1. Safety Checks
    if (!fabricObject || fabricObject.type !== 'image') return null;
    if (!canvasWidth || !canvasHeight || !printAreaWidthPx || !printAreaHeightPx) return null;

    // 2. Get the "Source of Truth" (The Raw High-Res Pixels)
    // We use .width/.height directly from the Fabric object.
    // This represents the original file dimensions before any scaling.
    const sourceWidth = fabricObject.width; 
    const sourceHeight = fabricObject.height;

    // 3. Get the "Target Spread" (The Size on the Canvas)
    // getScaledWidth() = width * scaleX (This is the size you see on screen)
    const onScreenPixelWidth = fabricObject.getScaledWidth();
    const onScreenPixelHeight = fabricObject.getScaledHeight();

    // 4. Calculate the Physical Ratio (Inches per Screen Pixel)
    // Example: If Print Area is 4500px (15 inches) and Canvas is 500px...
    // Then 1 Screen Pixel = 0.03 Physical Inches.
    const physicalWidthInches = printAreaWidthPx / 300; // e.g. 15"
    const physicalHeightInches = printAreaHeightPx / 300; // e.g. 18"
    
    const inchesPerPixelX = physicalWidthInches / canvasWidth;
    const inchesPerPixelY = physicalHeightInches / canvasHeight;

    // 5. Calculate Physical Dimensions of the Image on the Shirt
    // "How many inches wide is this image right now?"
    const physicalObjectW = onScreenPixelWidth * inchesPerPixelX;
    const physicalObjectH = onScreenPixelHeight * inchesPerPixelY;

    // 6. Calculate DPI (Dots Per Inch)
    // Formula: Raw Source Pixels / Physical Inches
    // As you shrink the image (make physical inches smaller), the DPI goes UP.
    const dpiX = sourceWidth / physicalObjectW;
    const dpiY = sourceHeight / physicalObjectH;

    // 7. Safety: Take the lowest DPI (in case the image is stretched weirdly)
    const finalDpi = Math.round(Math.min(dpiX, dpiY));

    // 8. Determine Status
    let status = 'good';
    let color = '#22c55e'; // Green
    let message = 'Great Quality';

    if (finalDpi < 150) {
        status = 'poor';
        color = '#ef4444'; // Red
        message = 'Low Quality';
    } else if (finalDpi < 300) {
        status = 'warning';
        color = '#eab308'; // Yellow
        message = 'Fair Quality';
    }

    return { dpi: finalDpi, status, color, message };
};