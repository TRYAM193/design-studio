// src/preview3d/Tshirt3DPreview.jsx
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

// --- 2. Calibration Decal (Fixed Visibility) ---
function CalibrationDecal({ texture, x, y, z, scale, rotation = [0, 0, 0] }) {
  if (!texture) return null;

  return (
    <Decal
      position={[x, y, z]} 
      rotation={rotation} 
      scale={[scale, scale, 1.5]} 
    >
      <meshBasicMaterial
        map={texture}
        transparent
        depthTest={true}   
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
  const backTex = useDesignTexture(textures?.back);

  return (
    // ✅ FIX: Added rotation={[0, 0, 0]} to correct tilt.
    // Try small values if it leans:
    // rotation={[0.1, 0, 0]} -> Tilts back slightly
    // rotation={[0, 0, 0.05]} -> Tilts shoulders right slightly
    <group 
      position={[0, -0.85, 0]} 
      scale={0.8} 
      rotation={[0.1, 0, 0]} 
    >
      {/* --- FRONT MESH --- */}
      <mesh geometry={nodes?.[m.front]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        
        {frontTex && (
          <CalibrationDecal 
            texture={frontTex} 
            x={0} 
            y={1.25} 
            z={-0.5} 
            scale={0.5}
            rotation={[0, 0, 0]}
          />
        )}
      </mesh>
      
      {/* --- BACK MESH --- */}
      <mesh geometry={nodes?.[m.back]?.geometry}>
        <meshStandardMaterial color={color} />

        {backTex && (
          <CalibrationDecal 
            texture={backTex} 
            x={controls.x} 
            y={controls.y} 
            z={controls.z} 
            scale={controls.scale}
            rotation={[0, Math.PI, 0]}
          />
        )}
      </mesh>

      {/* --- SLEEVES --- */}
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
    y: 1.25, 
    z: 0.5,
    scale: 0.5
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
        <directionalLight position={[0, 5, -10]} intensity={0.8} /> 

        <TshirtModel 
            productId={productId} 
            textures={textures} 
            color={color} 
            controls={controls} 
        />
        
        {/* ✅ FIX: Locked Top/Bottom Rotation (Side-to-Side only) */}
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 2} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>

      {/* --- CONTROL PANEL OVERLAY --- */}
      {/* <div style={{
        position: "absolute", top: "10px", right: "10px", 
        background: "rgba(0,0,0,0.8)", padding: "15px", 
        color: "white", borderRadius: "8px", width: "250px",
        fontFamily: "sans-serif", fontSize: "12px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Back Calibration</h3>
        
        <div style={{ marginBottom: "10px" }}>
          <label>X (Left/Right): {controls.x.toFixed(2)}</label>
          <input 
            type="range" min="-0.5" max="0.5" step="0.01" 
            value={controls.x} 
            onChange={(e) => updateControl("x", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Y (Up/Down): {controls.y.toFixed(2)}</label>
          <input 
            type="range" min="-1" max="2" step="0.01" 
            value={controls.y} 
            onChange={(e) => updateControl("y", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Z (In/Out): {controls.z.toFixed(2)}</label>
          <input 
            type="range" min="-1" max="1" step="0.01" 
            value={controls.z} 
            onChange={(e) => updateControl("z", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Scale: {controls.scale.toFixed(2)}</label>
          <input 
            type="range" min="0.1" max="2" step="0.01" 
            value={controls.scale} 
            onChange={(e) => updateControl("scale", e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <p style={{ color: "#aaa", fontStyle: "italic" }}>
          *Adjust sliders to fine-tune the <strong>Back</strong> position.
        </p>
      </div> */}

    </div>
  );
}