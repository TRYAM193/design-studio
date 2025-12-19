import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- DEBUG: PINK/BLACK CHECKERBOARD (Standard "Missing Texture" Pattern) ---
const CHECKERBOARD_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAQ0AAAgCoGv/ny6IBj5gAQ1OR8BqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagP0eO7w/iO8qAAAAABJRU5ErkJggg==";

// Toggle this to TRUE to ignore your design and force the checkerboard
const FORCE_DEBUG_TEXTURE = false;

// --- 1. SAFE TEXTURE HOOK ---
function useTextureSafe(url, label) {
    const [texture, setTexture] = useState(null);

    // Decide which URL to load
    const targetUrl = FORCE_DEBUG_TEXTURE ? CHECKERBOARD_TEXTURE : url;

    useEffect(() => {
        if (!targetUrl) {
            setTexture(null);
            return;
        }

        let isActive = true;
        const loader = new THREE.TextureLoader();

        console.log(`[${label}] Loading texture...`);
        console.log("Texture URL being used:", url);

        // ... inside useTextureSafe ...

        loader.load(
            targetUrl,
            (tex) => {
                if (!isActive) return;

                // 🛑 STOP if image is invalid (prevents WebGL crash)
                if (!tex.image || tex.image.width === 0 || tex.image.height === 0) {
                    console.error(`[${label}] ❌ Texture loaded but has 0 dimensions!`);
                    return;
                }

                console.log(`[${label}] ✅ Texture loaded successfully (${tex.image.width}x${tex.image.height})`);

                // Texture settings
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 16;

                // Explicitly upload now to catch errors early (optional but helpful)
                // tex.needsUpdate = true; // This is handled by React Three Fiber usually

                setTexture(tex);
            },
            undefined,
            (err) => console.error(`[${label}] ❌ Texture Failed:`, err)
        );
        return () => { isActive = false; };
    }, [targetUrl, label]);

    return texture;
}

// --- 2. MESH LAYER ---
function MeshLayer({ nodes, meshName, textureUrl, baseColor, label }) {
    console.log(textureUrl, label)
    const texture = useTextureSafe(textureUrl, label);

    const geometry = useMemo(() => {
        if (!nodes) return null;

        // 1. Try Exact Match
        let node = nodes[meshName];

        // 2. Try Fuzzy Match
        if (!node) {
            const cleanName = meshName.split('_')[0];
            const matchKey = Object.keys(nodes).find(key => key.includes(cleanName));
            if (matchKey) node = nodes[matchKey];
        }

        if (!node) {
            // Only warn if we aren't in force debug mode (to avoid spam)
            if (!FORCE_DEBUG_TEXTURE) console.warn(`❌ Node not found: ${meshName}`);
            return null;
        }

        // 3. Extract Geometry
        if (node.geometry) return node.geometry;
        if (node.children && node.children.length > 0) {
            const child = node.children.find(c => c.geometry);
            if (child) return child.geometry;
        }
        return null;
    }, [nodes, meshName]);

    if (!geometry) return null;

    const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.7,
        metalness: 0.1,
    }), [baseColor]);

    return (
        <group>
            {/* Base Layer */}
            <mesh geometry={geometry} material={baseMaterial} castShadow receiveShadow />

            {/* Design Layer */}
            {texture && (
                <mesh geometry={geometry}>
                    <meshStandardMaterial
                        map={texture}
                        transparent={true}
                        opacity={1}
                        side={THREE.DoubleSide}

                        // Z-Fighting Fix
                        polygonOffset={true}
                        polygonOffsetFactor={2}
                        depthWrite={false}

                        // Force bright white so checkerboard is visible
                        color="white"
                        roughness={1}
                    />
                </mesh>
            )}
        </group>
    );
}

// --- 3. MAIN MODEL ---
function ProductModel({ productId, textures, color }) {
    console.log(textures)
    const productType = resolveProductType(productId);
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes } = useGLTF(config.path);

    return (
        <group dispose={null}>
            {Object.keys(config.meshes).map((key) => (
                <MeshLayer
                    key={key}
                    label={key}
                    nodes={nodes}
                    meshName={config.meshes[key]}
                    textureUrl={textures[key]}
                    baseColor={color}
                />
            ))}
        </group>
    );
}

// --- 4. EXPORT ---
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
    return (
        <div className="w-full h-full relative bg-zinc-900">
            <Canvas
                shadows
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                camera={{ position: [0, 0, 4.5], fov: 35 }}
            >
                <ambientLight intensity={1} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <spotLight position={[-10, 5, -10]} intensity={0.5} />

                <group position={[0, -0.4, 0]}>
                    <Center>
                        <Suspense fallback={null}>
                            <ProductModel
                                productId={productId}
                                textures={textures}
                                color={color}
                            />
                        </Suspense>
                    </Center>
                </group>

                <OrbitControls minDistance={2} maxDistance={8} />
                <Environment preset="city" />
                <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
            </Canvas>
        </div>
    );
}