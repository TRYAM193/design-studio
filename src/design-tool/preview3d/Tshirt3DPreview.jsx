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
    decalScale
}) {
    if (!mesh) return null;

    return (
        <mesh geometry={mesh.geometry} castShadow receiveShadow>
            <meshStandardMaterial
                color={color || "#ffffff"}
                roughness={0.75}
                metalness={0.05}
            />

            {texture && (
                <Decal
                    position={decalPosition}
                    rotation={decalRotation}
                    scale={decalScale}
                    map={texture}
                    polygonOffset
                    polygonOffsetFactor={-10}
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

    return (
        <group dispose={null}>
            {/* FRONT */}
            <ShirtPart
                mesh={nodes[config.meshes.front]}
                color={color}
                texture={frontTex}
                decalPosition={[0, 0.1, 0.15]}
                decalRotation={[0, 0, 0]}
                decalScale={[1.2, 1.2, 1]}
            />

            {/* BACK */}
            <ShirtPart
                mesh={nodes[config.meshes.back]}
                color={color}
                texture={backTex}
                decalPosition={[0, 0.1, -0.15]}
                decalRotation={[0, Math.PI, 0]}
                decalScale={[1.2, 1.2, 1]}
            />

            {/* LEFT SLEEVE */}
            <ShirtPart
                mesh={nodes[config.meshes.leftSleeve]}
                color={color}
                texture={leftTex}
                decalPosition={[-0.35, 0.15, 0]}
                decalRotation={[0, Math.PI / 2, 0]}
                decalScale={[0.6, 0.6, 0.6]}
            />

            {/* RIGHT SLEEVE */}
            <ShirtPart
                mesh={nodes[config.meshes.rightSleeve]}
                color={color}
                texture={rightTex}
                decalPosition={[0.35, 0.15, 0]}
                decalRotation={[0, -Math.PI / 2, 0]}
                decalScale={[0.6, 0.6, 0.6]}
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
    color = "#ffffff"
}) {
    return (
        <Canvas
            camera={{ position: [0, 1.4, 3], fov: 45 }}
            gl={{ preserveDrawingBuffer: true }}
        >
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 4, 3]} intensity={0.9} />

            <TshirtModel
                productId={productId}
                textures={textures}
                color={color}
            />

            <OrbitControls
                enablePan={false}
                minDistance={2}
                maxDistance={4}
                enableDamping
            />
        </Canvas>
    );
}
