import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

// --- 1. Texture Loader ---
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
  }, [url]);
  return texture;
}

// --- 2. Calibration Decal (Controlled by Sliders) ---
function CalibrationDecal({ texture, controls }) {
  if (!texture) return null;

  return (
    <Decal
      // We use the slider values here directly
      position={[controls.x, controls.y, controls.z]} 
      rotation={[0, 0, 0]} 
      // Scale is also controlled so you can make it bigger/smaller
      scale={[controls.scale, controls.scale, 1.5]} 
      
      // Keep DEBUG on so you can see the box moving
      debug={true} 
    >
      <meshBasicMaterial
        map={texture}
        transparent
        depthTest={false} // Always visible for calibration
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </Decal>
  );
}

function TshirtModel({ productId, textures, color, controls }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);
  const m = config.meshes;
  const frontTex = useDesignTexture(textures?.front);

  return (
    <group position={[0, -0.85, 0]} scale={0.8}>
      <mesh geometry={nodes?.[m.front]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        
        {/* Only calibrating FRONT for now */}
        {frontTex && (
          <CalibrationDecal 
            texture={frontTex} 
            controls={controls} 
          />
        )}
      </mesh>
      
      {/* Render other parts normally without decals for now */}
      <mesh geometry={nodes?.[m.back]?.geometry}>
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh geometry={nodes?.[m.leftSleeve]?.geometry}>
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh geometry={nodes?.[m.rightSleeve]?.geometry}>
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  // --- SLIDER STATE ---
  const [controls, setControls] = useState({
    x: 0,
    y: 0.25, // Start where we were
    z: 0.15,
    scale: 0.35
  });

  const updateControl = (key, value) => {
    setControls(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* --- CANVAS --- */}
      <Canvas camera={{ position: [0, 0, 2], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <TshirtModel 
            productId={productId} 
            textures={textures} 
            color={color} 
            controls={controls} 
        />
        <OrbitControls enablePan={false} />
      </Canvas>

      {/* --- CONTROL PANEL OVERLAY --- */}
      <div style={{
        position: "absolute", top: "10px", right: "10px", 
        background: "rgba(0,0,0,0.8)", padding: "15px", 
        color: "white", borderRadius: "8px", width: "250px",
        fontFamily: "sans-serif", fontSize: "12px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Calibration Tools</h3>
        
        {/* Y (Up/Down) */}
        <div style={{ marginBottom: "10px" }}>
          <label>Y (Up/Down): {controls.y.toFixed(2)}</label>
          <input 
            type="range" min="-1" max="2" step="0.01" 
            value={controls.y} 
            onChange={(e) => updateControl("y", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Z (In/Out) */}
        <div style={{ marginBottom: "10px" }}>
          <label>Z (In/Out): {controls.z.toFixed(2)}</label>
          <input 
            type="range" min="-1" max="1" step="0.01" 
            value={controls.z} 
            onChange={(e) => updateControl("z", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Scale */}
        <div style={{ marginBottom: "10px" }}>
          <label>Scale (Size): {controls.scale.toFixed(2)}</label>
          <input 
            type="range" min="0.1" max="2" step="0.01" 
            value={controls.scale} 
            onChange={(e) => updateControl("scale", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <p style={{ color: "#aaa", fontStyle: "italic" }}>
          *Move Y slider right until box moves up to chest.
        </p>
      </div>

    </div>
  );
}