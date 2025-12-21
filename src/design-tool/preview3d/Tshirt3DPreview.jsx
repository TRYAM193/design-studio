import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

// Helper to load texture
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
  }, [url]);
  return texture;
}

// 1. NEW COMPONENT: A simple floating plane for the design
function FloatingDesign({ texture, position, rotation, scale }) {
  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      {/* A flat square geometry */}
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent={true} // Allows transparent PNG backgrounds
        side={THREE.DoubleSide} // Visible from both sides
        depthTest={true}
        depthWrite={false} // Prevents it from cutting a hole in the shirt
      />
    </mesh>
  );
}

// 2. SIMPLIFIED SHIRT PART: Just renders the fabric, no decals
function ShirtPart({ geometry, color }) {
  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve);
  const rightTex = useDesignTexture(textures?.rightSleeve);

  const m = config.meshes;

  // 3. MANUAL POSITIONING
  // These values place the planes "outside" the shirt volume.
  // You can tweak these numbers to move the design up/down/in/out.
  
  return (
    <group position={[0, -0.85, 0]} scale={0.8}>
      
      {/* --- THE SHIRT MESHES --- */}
      <ShirtPart geometry={nodes?.[m.front]?.geometry} color={color} />
      <ShirtPart geometry={nodes?.[m.back]?.geometry} color={color} />
      <ShirtPart geometry={nodes?.[m.leftSleeve]?.geometry} color={color} />
      <ShirtPart geometry={nodes?.[m.rightSleeve]?.geometry} color={color} />

      {/* --- THE DESIGNS (Floating Planes) --- */}

      {/* FRONT: Z is roughly 0.3 to be in front of chest */}
      <FloatingDesign
        texture={frontTex}
        position={[0, 1.3, 0.35]} 
        rotation={[0, 0, 0]}
        scale={[0.3, 0.3, 1]} // Adjust size here (Width, Height, Depth)
      />

      {/* BACK: Z is negative. We rotate 180 deg (PI) so image isn't mirrored */}
      <FloatingDesign
        texture={backTex}
        position={[0, 0.1, -0.28]} 
        rotation={[0, Math.PI, 0]} 
        scale={[0.3, 0.3, 1]}
      />

      {/* LEFT SLEEVE: X is negative. Rotate 90 deg (PI/2) to face left */}
      <FloatingDesign
        texture={leftTex}
        position={[-0.45, 0.15, 0]} 
        rotation={[0, -Math.PI / 2, 0]} 
        scale={[0.15, 0.15, 1]}
      />

      {/* RIGHT SLEEVE: X is positive. Rotate -90 deg to face right */}
      <FloatingDesign
        texture={rightTex}
        position={[0.45, 0.15, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        scale={[0.15, 0.15, 1]}
      />
      
    </group>
  );
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <Canvas camera={{ position: [0, 0.1, 1.7], fov: 40 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} />
      <TshirtModel productId={productId} textures={textures} color={color} />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}