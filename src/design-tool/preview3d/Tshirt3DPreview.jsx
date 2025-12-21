import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, useTexture } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

// 1. ROBUST TEXTURE LOADER
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous"); // Fixes CORS issues
    loader.load(url, (tex) => {
      tex.anisotropy = 16;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
  }, [url]);
  return texture;
}

// 2. DECAL COMPONENT WITH VISUAL DEBUGGER
function SafeDecal({ texture, position, rotation, scale }) {
  // If texture is missing, we STILL render to test position (Green Box)
  // If texture is present, we render it normally
  
  const debugColor = texture ? "white" : "red"; // Red = Missing Texture

  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={[scale[0], scale[1], 1.5]} // Deep projection
      debug={!texture} // Shows a wireframe box if texture is missing!
    >
      <meshBasicMaterial
        map={texture || null}
        color={debugColor} // Red if no texture, White if texture exists
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
        depthTest={true}
        depthWrite={false}
        // If texture is missing, make it semi-transparent red to spot it easily
        opacity={texture ? 1 : 0.5} 
      />
    </Decal>
  );
}

function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);
  const m = config.meshes;

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve);
  const rightTex = useDesignTexture(textures?.rightSleeve);

  // --- FIXED COORDINATES (Moved further OUT to ensure visibility) ---
  const POSITIONS = {
    front:  [0, 0.25, 0.4],      // Z=0.4 is definitely outside the chest
    back:   [0, 0.25, -0.4],     // Z=-0.4 is definitely outside the back
    left:   [-0.45, 0.25, 0],    // X=-0.45 is outside left arm
    right:  [0.45, 0.25, 0],     // X=0.45 is outside right arm
  };

  const SCALES = {
    chest: [0.35, 0.35, 1],
    sleeve: [0.20, 0.20, 1],
  };

  return (
    <group position={[0, -0.85, 0]} scale={0.8}>
      
      {/* FRONT MESH & DECAL */}
      <mesh geometry={nodes?.[m.front]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {frontTex && (
          <SafeDecal 
            texture={frontTex} 
            position={POSITIONS.front} 
            rotation={[0, 0, 0]} 
            scale={SCALES.chest} 
          />
        )}
      </mesh>

      {/* BACK MESH & DECAL */}
      <mesh geometry={nodes?.[m.back]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {backTex && (
          <SafeDecal 
            texture={backTex} 
            position={POSITIONS.back} 
            rotation={[0, Math.PI, 0]} 
            scale={SCALES.chest} 
          />
        )}
      </mesh>

      {/* LEFT SLEEVE */}
      <mesh geometry={nodes?.[m.leftSleeve]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {leftTex && (
          <SafeDecal 
            texture={leftTex} 
            position={POSITIONS.left} 
            rotation={[0, Math.PI / 2, 0]} 
            scale={SCALES.sleeve} 
          />
        )}
      </mesh>

      {/* RIGHT SLEEVE */}
      <mesh geometry={nodes?.[m.rightSleeve]?.geometry}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {rightTex && (
          <SafeDecal 
            texture={rightTex} 
            position={POSITIONS.right} 
            rotation={[0, -Math.PI / 2, 0]} 
            scale={SCALES.sleeve} 
          />
        )}
      </mesh>

    </group>
  );
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      
      <TshirtModel productId={productId} textures={textures} color={color} />
      
      <OrbitControls minDistance={1} maxDistance={4} enablePan={false} />
    </Canvas>
  );
}