import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric"; // Fabric.js v6
import designData from "@/templates/design-001.json"; // Your JSON file

export default function ThumbnailGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize Canvas
    // We set dimensions to match your JSON (3000x3600 is huge, so we scale for display)
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800, // Display width
      height: 800 * (3600 / 3000), // Maintain aspect ratio
      backgroundColor: "#f0f0f0",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const loadAndRender = async () => {
    if (!fabricCanvas) return;

    console.log("Loading JSON...");
    
    // 2. Load the JSON data
    // We parse the JSON string from the file if needed, or use the object directly
    const jsonContent = typeof designData === 'string' 
        ? designData 
        : JSON.stringify(designData);

    await fabricCanvas.loadFromJSON(jsonContent);
    
    // 3. Scale everything to fit our thumbnail view (Optional, just for viewing)
    // The JSON defines a 3000px width. We need to zoom out to see it on our 800px canvas.
    const scale = 800 / 3000;
    fabricCanvas.setZoom(scale);
    
    fabricCanvas.requestRenderAll();
    console.log("Rendered!");
  };

  const generateImage = () => {
    if (!fabricCanvas) return;

    // 4. Export to High-Quality Image
    // We temporarily reset zoom to 1 to get full resolution, or keep it small for thumbnail
    // Let's create a reasonably sized thumbnail (e.g., 600px wide)
    
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 0.8,
      multiplier: 600 / 3000, // Scale down to 600px width for the file
    });

    setGeneratedImage(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-10 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold">Thumbnail Generator</h1>
      
      <div className="flex gap-4">
        <button 
          onClick={loadAndRender}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
        >
          1. Load Template
        </button>

        <button 
          onClick={generateImage}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold"
        >
          2. Generate Image
        </button>
      </div>

      <div className="flex gap-10 items-start">
        {/* The Live Canvas (Hidden or Visible) */}
        <div className="border border-gray-400 shadow-xl bg-white">
          <p className="text-center p-2 bg-gray-200 font-mono text-sm">Live Canvas Preview</p>
          <canvas ref={canvasRef} />
        </div>

        {/* The Output Image */}
        {generatedImage && (
          <div className="flex flex-col gap-2">
            <p className="text-center p-2 bg-yellow-200 font-mono text-sm font-bold">
              Right Click Image Below - Save As...
            </p>
            <img 
              src={generatedImage} 
              alt="Generated Thumbnail" 
              className="border-4 border-green-500 shadow-2xl"
            />
            <p className="text-sm text-gray-500 text-center">
              Save this to: <b>public/templates/design-001.png</b>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}