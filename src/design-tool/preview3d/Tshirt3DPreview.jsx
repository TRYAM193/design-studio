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
            console.log("❌ No URL provided");
            setTexture(null);
            return;
        }

        console.log("🔄 Starting load for:", url);
        const loader = new THREE.TextureLoader();

        // IMPORTANT: specific settings to help with some CORS cases
        loader.setCrossOrigin('anonymous');

        loader.load(
            url,
            (tex) => {
                console.log("✅ Texture Loaded Successfully!", tex);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                setTexture(tex);
            },
            undefined,
            (err) => {
                console.error("🚨 Texture Load Error:", err);
                console.error("This is likely a CORS issue if the URL works in a tab.");
            }
        );
    }, [url]);

    return texture;
}

// 2. DECAL COMPONENT WITH VISUAL DEBUGGER
function SafeDecal({ texture, position, rotation, scale }) {
    if (!texture) return null;

    return (
        <Decal
            position={position}
            rotation={rotation}
            // 1. Make the projection box HUGE (Z=5) so it definitely hits the shirt
            scale={[scale[0], scale[1], 5]}
            // 2. Enable Debug Mode: This draws a wireframe box showing exactly where the decal is
            debug={true}
        >
            <meshBasicMaterial
                map={texture}
                transparent
                // --- FORCE VISIBILITY SETTINGS ---

                // This tells the GPU: "Draw this on top of everything, even walls"
                depthTest={false}
                depthWrite={false}

                // This forces it to draw LAST (on top of the shirt)
                // Standard meshes are 0. We set this to 999.
                side={THREE.DoubleSide}
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
    // inside TshirtModel...

    const POSITIONS = {
        // Moved Closer: 0.4 -> 0.15
        front: [0, 0.25, 0.15],

        // Moved Closer: -0.4 -> -0.15
        back: [0, 0.25, -0.15],

        // Moved Closer: -0.45 -> -0.25
        left: [-0.25, 0.25, 0],

        // Moved Closer: 0.45 -> 0.25
        right: [0.25, 0.25, 0],
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