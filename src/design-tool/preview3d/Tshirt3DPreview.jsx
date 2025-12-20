import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url || typeof url !== "string") {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (tex) => {
        if (cancelled) return;
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("Texture load failed:", err);
        setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}

function ShirtPart({
  geometry,
  color,
  decalTex,
  decalPosition,
  decalRotation,
  decalScale,
}) {
  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      {decalTex && (
        <Decal
          map={decalTex}
          position={decalPosition}
          rotation={decalRotation}
          scale={decalScale}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      )}
    </mesh>
  );
}

function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];

  const { nodes } = useGLTF(config.path);

  // Debug: confirm you are receiving URLs
  // console.log("textures:", textures);

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve);
  const rightTex = useDesignTexture(textures?.rightSleeve);

  const m = config.meshes;

  // Debug: check node names from GLB (should contain m.front, m.back, etc.)
  // console.log("GLB nodes:", Object.keys(nodes));

  return (
    <group position={[0, -0.85, 0]}  // Move model down if too high
            scale={0.8}  >
      {/* FRONT */}
      <ShirtPart
        geometry={nodes?.[m.front]?.geometry}
        color={color}
        decalTex={frontTex}
        decalPosition={[0, 0.08, 0.18]}
        decalRotation={[0, 0, 0]}
        decalScale={[0.55, 0.65, 0.55]}
      />

      {/* BACK */}
      <ShirtPart
        geometry={nodes?.[m.back]?.geometry}
        color={color}
        decalTex={backTex}
        decalPosition={[0, 0.08, -0.18]}
        decalRotation={[0, Math.PI, 0]}
        decalScale={[0.55, 0.65, 0.55]}
      />

      {/* LEFT SLEEVE */}
      <ShirtPart
        geometry={nodes?.[m.leftSleeve]?.geometry}
        color={color}
        decalTex={leftTex}
        decalPosition={[-0.32, 0.12, 0.02]}
        decalRotation={[0, Math.PI / 2, 0]}
        decalScale={[0.22, 0.22, 0.22]}
      />

      {/* RIGHT SLEEVE */}
      <ShirtPart
        geometry={nodes?.[m.rightSleeve]?.geometry}
        color={color}
        decalTex={rightTex}
        decalPosition={[0.32, 0.12, 0.02]}
        decalRotation={[0, -Math.PI / 2, 0]}
        decalScale={[0.22, 0.22, 0.22]}
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

// Optional: preload
useGLTF.preload("/assets/t-shirt.glb");
