import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

/* ===========================
   SAFE BASE64 TEXTURE LOADER
   =========================== */
function useDesignTexture(base64) {
    const [texture, setTexture] = useState(null);

    useEffect(() => {
        if (!base64 || typeof base64 !== "string") {
            setTexture(null);
            return;
        }

        let cancelled = false;
        const loader = new THREE.TextureLoader();

        loader.load(
            base64,
            (tex) => {
                if (cancelled) return;

                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;

                setTexture(tex);
            },
            undefined,
            () => setTexture(null)
        );

        return () => {
            cancelled = true;
        };
    }, [base64]);

    return texture;
}

/* ===========================
   SHIRT PART + DECAL
   =========================== */
function ShirtPart({
  mesh,
  color,
  texture,
  decalPosition,
  decalRotation,
  decalScale,
}) {
  if (!mesh) return null;

  return (
    <mesh geometry={mesh.geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.6}
        metalness={0.1}
      />
      {texture && (
        <Decal
          map={texture}
          position={decalPosition}
          rotation={decalRotation}
          scale={decalScale}
        />
      )}
    </mesh>
  );
}


/* ===========================
   TSHIRT MODEL
   =========================== */
function TshirtModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType];
  const { nodes } = useGLTF(config.path);

  const frontTex = useDesignTexture(textures.front);
  const backTex = useDesignTexture(textures.back);
  const leftTex = useDesignTexture(textures.leftSleeve);
  const rightTex = useDesignTexture(textures.rightSleeve);

  const m = config.meshes;

  return (
    <group>
      {/* FRONT */}
      <ShirtPart
        mesh={nodes[m.front]}
        color={color}
        texture={frontTex}
        decalPosition={[0, 0.1, 0.2]}   // tune these
        decalRotation={[0, 0, 0]}
        decalScale={[0.4, 0.5, 0.4]}
      />

      {/* BACK */}
      <ShirtPart
        mesh={nodes[m.back]}
        color={color}
        texture={backTex}
        decalPosition={[0, 0.1, -0.2]}
        decalRotation={[0, Math.PI, 0]}
        decalScale={[0.4, 0.5, 0.4]}
      />

      {/* LEFT SLEEVE */}
      <ShirtPart
        mesh={nodes[m.leftSleeve]}
        color={color}
        texture={leftTex}
        decalPosition={[-0.3, 0.15, 0]}
        decalRotation={[0, Math.PI / 2, 0]}
        decalScale={[0.2, 0.2, 0.2]}
      />

      {/* RIGHT SLEEVE */}
      <ShirtPart
        mesh={nodes[m.rightSleeve]}
        color={color}
        texture={rightTex}
        decalPosition={[0.3, 0.15, 0]}
        decalRotation={[0, -Math.PI / 2, 0]}
        decalScale={[0.2, 0.2, 0.2]}
      />
    </group>
  );
}


/* ===========================
   MAIN PREVIEW CANVAS
   =========================== */
export default function Tshirt3DPreview({
  productId,
  textures,
  color = "#ffffff",
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 1.5], fov: 35 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]} intensity={0.8} />
      <TshirtModel productId={productId} textures={textures} color={color} />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
