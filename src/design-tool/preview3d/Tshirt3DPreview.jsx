import React, { useEffect, useState } from "react";
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
        console.error("Texture load error:", err);
        setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}

function ShirtPart({ geometry, color, decalTex, decalPosition, decalRotation, decalScale }) {
  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      {decalTex && (
        <Decal position={decalPosition} rotation={decalRotation} scale={decalScale}>
          <meshBasicMaterial
            map={decalTex}
            transparent
            polygonOffset
            polygonOffsetFactor={-10}
            depthTest
            depthWrite={false}
          />
        </Decal>
      )}
    </mesh>
  );
}

function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);

  // TEMP DEBUG (keep for now)
  // console.log("textures:", textures);
  // console.log("nodes:", Object.keys(nodes));

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve);
  const rightTex = useDesignTexture(textures?.rightSleeve);

  const m = config.meshes;

  return (
    <group position={[0, -0.85, 0]}  // Move model down if too high
            scale={0.8}>
      <ShirtPart
        geometry={nodes?.[m.front]?.geometry}
        color={color}
        decalTex={frontTex}
        decalPosition={[0, 0.08, 0.18]}
        decalRotation={[0, 0, 0]}
        decalScale={[0.6, 0.7, 0.6]}
      />

      <ShirtPart
        geometry={nodes?.[m.back]?.geometry}
        color={color}
        decalTex={backTex}
        decalPosition={[0, 0.08, -0.18]}
        decalRotation={[0, Math.PI, 0]}
        decalScale={[0.6, 0.7, 0.6]}
      />

      <ShirtPart
        geometry={nodes?.[m.leftSleeve]?.geometry}
        color={color}
        decalTex={leftTex}
        decalPosition={[-0.32, 0.12, 0.02]}
        decalRotation={[0, Math.PI / 2, 0]}
        decalScale={[0.22, 0.22, 0.22]}
      />

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
