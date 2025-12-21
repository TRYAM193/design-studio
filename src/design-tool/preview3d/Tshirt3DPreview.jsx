import React, { useEffect, useState, useMemo } from "react";
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
                tex.flipY = true;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
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
  // We remove the manual "pushOut" math because adding Z only works for the front.
  // Instead, we use polygonOffset to tell the GPU to draw the decal "closer" to the camera.

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />

      {decalTex && (
        <Decal 
          // Use the original position directly. The Decal projection box handles the depth.
          position={decalPosition} 
          rotation={decalRotation} 
          scale={decalScale}
        >
          <meshBasicMaterial
            map={decalTex}
            transparent
            // depthTest must be TRUE so it doesn't show through the back of the shirt
            depthTest={true} 
            depthWrite={false}
            // polygonOffset pulls the pixels forward visually without moving the mesh
            polygonOffset
            polygonOffsetFactor={-4} // A factor of -4 usually clears z-fighting on curved surfaces
          />
        </Decal>
      )}
    </mesh>
  );
}

function DebugPlane({ url }) {
  const tex = useDesignTexture(url);
  if (!tex) return null;

  return (
    <mesh position={[0, 0, 0]} >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent />
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

    console.log("textures:", textures);
    console.log("nodes:", Object.keys(nodes));


    const m = config.meshes;

    return (
        <group position={[0, -0.85, 0]}  // Move model down if too high
            scale={0.8}>
            <ShirtPart
                geometry={nodes?.[m.front]?.geometry}
                color={color}
                decalTex={frontTex}
                decalPosition={[0, 0.08, 0.28]}
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
            <DebugPlane url={textures?.front} />

            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 5, 4]} intensity={0.8} />
            <TshirtModel productId={productId} textures={textures} color={color} />
            <OrbitControls enablePan={false} />
        </Canvas>
    );
}
