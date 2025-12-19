import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- DEBUG: PINK/BLACK CHECKERBOARD ---
const CHECKERBOARD_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAQ0AAAgCoGv/ny6IBj5gAQ1OR8BqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagP0eO7w/iO8qAAAAABJRU5ErkJggg==";

const FORCE_DEBUG_TEXTURE = false;

// 1. REVISED HOOK: Returns the texture object safely
function useTextureSafe(url, label) {
    const [texture, setTexture] = useState(null);

    const targetUrl = (typeof FORCE_DEBUG_TEXTURE !== 'undefined' && FORCE_DEBUG_TEXTURE)
        ? CHECKERBOARD_TEXTURE
        : url;

    useEffect(() => {
        if (!targetUrl) {
            setTexture(null);
            return;
        }

        let isActive = true;
        const loader = new THREE.TextureLoader();

        console.log(`[${label}] Loading texture from:`, targetUrl);

        loader.load(
            targetUrl,
            (tex) => {
                if (!isActive) return;

                if (!tex.image || tex.image.width === 0) {
                    console.error(`[${label}] ❌ Texture loaded but has 0 dimensions!`);
                    return;
                }

                console.log(`[${label}] ✅ Texture loaded (${tex.image.width}x${tex.image.height})`);

                // Basic Texture Setup
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 16;
                tex.needsUpdate = true;

                setTexture(tex);
            },
            undefined,
            (err) => {
                if (isActive) console.error(`[${label}] ❌ Texture Failed:`, err);
            }
        );

        return () => { isActive = false; };
    }, [targetUrl, label]);

    return texture;
}

// --- 2. MESH LAYER (FIXED) ---
function MeshLayer({ nodes, meshName, textureUrl, baseColor, label }) {
    // A. Create the ref INSIDE the component
    const designMaterialRef = useRef(null);

    // Get texture from hook
    const texture = useTextureSafe(textureUrl, label);

    // B. Handle Material Updates when texture changes
    useEffect(() => {
        if (designMaterialRef.current && texture) {
            // Assign map
            designMaterialRef.current.map = texture;
            
            // 🛑 CRITICAL FIX FOR TRANSPARENCY
            designMaterialRef.current.transparent = true;
            designMaterialRef.current.alphaTest = 0.05; // Removes jagged white edges
            designMaterialRef.current.depthWrite = false; // Prevents "transparency sorting" glitches
            designMaterialRef.current.side = THREE.DoubleSide;
            
            designMaterialRef.current.needsUpdate = true;
        }
    }, [texture]); // Runs whenever texture loads

    const geometry = useMemo(() => {
        if (!nodes) return null;
        let node = nodes[meshName];
        if (!node) {
            const cleanName = meshName.split('_')[0];
            const matchKey = Object.keys(nodes).find(key => key.includes(cleanName));
            if (matchKey) node = nodes[matchKey];
        }
        if (!node) return null;

        if (node.geometry) return node.geometry;
        if (node.children && node.children.length > 0) {
            const child = node.children.find(c => c.geometry);
            if (child) return child.geometry;
        }
        return null;
    }, [nodes, meshName]);

    if (!geometry) return null;

    // Base shirt material
    const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.7,
        metalness: 0.1,
    }), [baseColor]);

    return (
        <group>
            {/* Base Layer (The Shirt Color) */}
            <mesh geometry={geometry} material={baseMaterial} castShadow receiveShadow />

            {/* Design Layer (The Print) */}
            {texture && (
                <mesh geometry={geometry}>
                    {/* 👇 ATTACH THE REF HERE 👇 */}
                    <meshStandardMaterial
                        ref={designMaterialRef} 
                        map={texture}
                        transparent={true}
                        
                        // Z-Fighting Fix (Prevents flickering)
                        polygonOffset={true}
                        polygonOffsetFactor={-2}
                        depthWrite={false} // Important for overlays
                        
                        // Force white base so colors pop correctly
                        color="#ffffff" 
                        roughness={1}
                    />
                </mesh>
            )}
        </group>
    );
}

// --- 3. MAIN MODEL ---
function ProductModel({ productId, textures, color }) {
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