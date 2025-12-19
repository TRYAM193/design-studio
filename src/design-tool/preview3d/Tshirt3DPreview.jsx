import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- DEBUG: PINK/BLACK CHECKERBOARD (Standard "Missing Texture" Pattern) ---
const CHECKERBOARD_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAQ0AAAgCoGv/ny6IBj5gAQ1OR8BqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagWsVsBqBaxWwGoFrFbAagP0eO7w/iO8qAAAAABJRU5ErkJggg==";

// Toggle this to TRUE to ignore your design and force the checkerboard
const FORCE_DEBUG_TEXTURE = false;

function useTextureSafe(url, label) {
    const [texture, setTexture] = useState(null);

    // 1. Force debug texture if flag is on, otherwise use the passed url
    // (Make sure FORCE_DEBUG_TEXTURE and CHECKERBOARD_TEXTURE are defined or imported)
    const targetUrl = (typeof FORCE_DEBUG_TEXTURE !== 'undefined' && FORCE_DEBUG_TEXTURE) 
        ? CHECKERBOARD_TEXTURE 
        : url;

    useEffect(() => {
        // 2. STOP if no URL is provided. 
        // This is why you currently see null - the upstream data is missing!
        if (!targetUrl) {
            console.warn(`[${label}] Skipping load: URL is undefined`);
            setTexture(null);
            return;
        }

        let isActive = true;
        const loader = new THREE.TextureLoader();

        console.log(`[${label}] Loading texture from:`, targetUrl);

        // 3. CORRECTED SYNTAX: Changed 'loadAsync' to 'load'
        loader.load(
            targetUrl,
            (tex) => {
                if (!isActive) return;

                // Safety Check: Image dimensions
                if (!tex.image || tex.image.width === 0) {
                    console.error(`[${label}] ❌ Texture loaded but has 0 dimensions!`);
                    return;
                }

                console.log(`[${label}] ✅ Texture loaded (${tex.image.width}x${tex.image.height})`);

                // Texture Settings
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 16;
                tex.needsUpdate = true; // Often helps with initial render

                setTexture(tex);
            },
            undefined, // onProgress (optional)
            (err) => {
                if (isActive) console.error(`[${label}] ❌ Texture Failed:`, err);
            }
        );

        return () => { isActive = false; };
    }, [targetUrl, label]);
    console.log(texture)
    return texture;
}

// --- 2. MESH LAYER (THE "PHYSICAL SHELL" FIX) ---
function MeshLayer({ nodes, meshName, textureUrl, baseColor, label }) {
    const designMaterialRef = React.useRef(null);
    const texture = useTextureSafe(textureUrl, label);

    // Update material settings
    useEffect(() => {
        if (designMaterialRef.current && texture) {
            const mat = designMaterialRef.current;
            mat.map = texture;
            mat.transparent = true;
            mat.opacity = 1;
            
            // Allow seeing it from both sides (Inside & Outside)
            mat.side = THREE.DoubleSide; 
            
            // Fix "Grey Box" (removes invisible pixels)
            mat.alphaTest = 0.05; 

            mat.needsUpdate = true;
        }
    }, [texture]);

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
        
        // Handle nested children
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
            {/* 1. Base Layer (The Shirt Fabric) */}
            <mesh 
                geometry={geometry} 
                material={baseMaterial} 
                renderOrder={0} // Draw First
            />

            {/* 2. Design Layer (The Print) */}
            {texture && (
                <mesh 
                    geometry={geometry} 
                    renderOrder={1} // Draw Second (On Top)
                    
                    // ⭐️ THE FIX: Physically scale it up slightly
                    // This creates a "shell" around the shirt so it CANNOT be hidden
                    scale={1.002} 
                >
                    <meshStandardMaterial
                        ref={designMaterialRef}
                        transparent={true}
                        
                        // Disable Z-fighting depth writes since we are using scale
                        depthWrite={false} 
                        
                        // Force brightness
                        color="#ffffff"
                        roughness={1}
                        
                        // Ensure backface visibility (fixes "visible from inside only")
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}
        </group>
    );
}

// --- 3. MAIN MODEL ---
function ProductModel({ productId, textures, color }) {
    // console.log(textures)
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