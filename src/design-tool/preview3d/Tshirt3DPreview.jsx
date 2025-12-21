import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

// --- 1. Texture Loader Helper ---
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16; // Makes texture crisp at angles
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined, 
      (err) => console.error("Error loading texture:", err)
    );
  }, [url]);

  return texture;
}

// --- 2. The Smart Decal Component ---
// This component handles the "Deep Projection" logic automatically
function SmartDecal({ texture, position, rotation, scale }) {
  if (!texture) return null;

  return (
    <Decal
      position={position}
      rotation={rotation}
      // CRITICAL: We overwrite the Z-scale (3rd value) to 2.0.
      // This makes the projection box very deep so it never "misses" the shirt.
      scale={[scale[0], scale[1], 2]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        depthTest={true}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4} // Forces the design to render ON TOP of the fabric
        side={THREE.FrontSide} // Only draw on the front face of the mesh
      />
    </Decal>
  );
}

// --- 3. The Shirt Mesh Handler ---
function ShirtMesh({ geometry, materialColor, decalConfig }) {
  if (!geometry) return null;

  return (
    <mesh geometry={geometry} dispose={null}>
      {/* The Fabric Material */}
      <meshStandardMaterial 
        color={materialColor} 
        roughness={0.7} 
        metalness={0.1} 
      />

      {/* The Design (if it exists) */}
      {decalConfig && (
        <SmartDecal 
          texture={decalConfig.texture}
          position={decalConfig.position}
          rotation={decalConfig.rotation}
          scale={decalConfig.scale}
        />
      )}
    </mesh>
  );
}

// --- 4. Main Model Composition ---
function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);
  const m = config.meshes;

  // Load all textures
  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve);
  const rightTex = useDesignTexture(textures?.rightSleeve);

  // --- CONFIGURATION ZONE ---
  // Adjust these numbers to move the designs.
  // [X, Y, Z] -> Y is Height, Z is Depth
  const SETTINGS = {
    front: {
      pos: [0, 0.25, 0.15],    // 0.25 puts it on the chest
      rot: [0, 0, 0],
      scale: [0.35, 0.35, 1],
    },
    back: {
      pos: [0, 0.25, -0.15],   // Negative Z for back
      rot: [0, Math.PI, 0],    // 180 degree rotation
      scale: [0.35, 0.35, 1],
    },
    left: {
      pos: [-0.35, 0.25, 0],   // Left Sleeve
      rot: [0, Math.PI / 2, 0],
      scale: [0.2, 0.2, 1],
    },
    right: {
      pos: [0.35, 0.25, 0],    // Right Sleeve
      rot: [0, -Math.PI / 2, 0],
      scale: [0.2, 0.2, 1],
    },
  };

  return (
    <group position={[0, -0.85, 0]} scale={0.8}>
      
      {/* Front Mesh + Front Decal */}
      <ShirtMesh 
        geometry={nodes?.[m.front]?.geometry} 
        materialColor={color}
        decalConfig={frontTex ? { ...SETTINGS.front, texture: frontTex } : null}
      />

      {/* Back Mesh + Back Decal */}
      <ShirtMesh 
        geometry={nodes?.[m.back]?.geometry} 
        materialColor={color}
        decalConfig={backTex ? { ...SETTINGS.back, texture: backTex } : null}
      />

      {/* Left Sleeve + Left Decal */}
      <ShirtMesh 
        geometry={nodes?.[m.leftSleeve]?.geometry} 
        materialColor={color}
        decalConfig={leftTex ? { ...SETTINGS.left, texture: leftTex } : null}
      />

      {/* Right Sleeve + Right Decal */}
      <ShirtMesh 
        geometry={nodes?.[m.rightSleeve]?.geometry} 
        materialColor={color}
        decalConfig={rightTex ? { ...SETTINGS.right, texture: rightTex } : null}
      />

    </group>
  );
}

// --- 5. Exported Component ---
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <Canvas camera={{ position: [0, 0, 1.8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 7]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      
      <TshirtModel productId={productId} textures={textures} color={color} />
      
      <OrbitControls minDistance={1} maxDistance={3} enablePan={false} />
    </Canvas>
  );
}