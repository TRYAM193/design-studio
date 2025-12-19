import React, { useEffect } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, Decal } from "@react-three/drei";
import { MODEL_REGISTRY, resolveProductType } from "./modelRegistry";

function useDesignTexture(base64) {
    const [texture, setTexture] = React.useState(null);

    React.useEffect(() => {
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
            (err) => {
                console.error("Texture load failed", err);
                setTexture(null);
            }
        );

        return () => {
            cancelled = true;
        };
    }, [base64]);

    return texture;
}



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
            {Object.values(config.meshes).map((meshName) => {
                const mesh = nodes[meshName];
                if (!mesh) return null;

                return (
                    <mesh
                        key={meshName}
                        geometry={mesh.geometry}
                        castShadow
                        receiveShadow
                    >
                        <meshStandardMaterial
                            color={color || "#ffffff"}
                            roughness={0.75}
                            metalness={0.05}
                        />
                    </mesh>
                );
            })}

            {/* FRONT DECAL */}
            {frontTex && (
                <Decal
                    mesh={nodes[config.meshes.front]}
                    position={[0, 0.1, 0.15]}
                    rotation={[0, 0, 0]}
                    scale={[1.2, 1.2, 1]}
                    map={frontTex}
                    polygonOffset
                    polygonOffsetFactor={-10}
                />
            )}

            {/* BACK DECAL */}
            {backTex && (
                <Decal
                    mesh={nodes[config.meshes.back]}
                    position={[0, 0.1, -0.15]}
                    rotation={[0, Math.PI, 0]}
                    scale={[1.2, 1.2, 1]}
                    map={backTex}
                    polygonOffset
                    polygonOffsetFactor={-10}
                />
            )}

            {/* LEFT SLEEVE */}
            {leftTex && (
                <Decal
                    mesh={nodes[config.meshes.leftSleeve]}
                    position={[-0.35, 0.15, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                    scale={[0.6, 0.6, 0.6]}
                    map={leftTex}
                    polygonOffset
                    polygonOffsetFactor={-10}
                />
            )}

            {/* RIGHT SLEEVE */}
            {rightTex && (
                <Decal
                    mesh={nodes[config.meshes.rightSleeve]}
                    position={[0.35, 0.15, 0]}
                    rotation={[0, -Math.PI / 2, 0]}
                    scale={[0.6, 0.6, 0.6]}
                    map={rightTex}
                    polygonOffset
                    polygonOffsetFactor={-10}
                />
            )}
        </group>
    );
}

export default function Tshirt3DPreview({ productId, textures, color }) {
    console.log(textures)
    return (
        <Canvas camera={{ position: [0, 1.4, 3], fov: 45 }}>
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
