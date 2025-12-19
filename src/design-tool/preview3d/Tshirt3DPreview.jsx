import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

/**
 * Enhanced texture loader that handles both external URLs and 
 * Fabric.js Base64 data strings correctly for 3D models.
 */
function useProductTexture(url, label) {
    const [texture, setTexture] = useState(null);

    useEffect(() => {
        if (!url) {
            setTexture(null);
            return;
        }

        const loader = new THREE.TextureLoader();
        loader.load(
            url,
            (tex) => {
                // IMPORTANT for GLTF: Models use a different coordinate system than web images
                tex.flipY = false; 
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                setTexture(tex);
                console.log(`[${label}] Texture applied successfully.`);
            },
            undefined,
            (err) => console.error(`[${label}] Failed to load texture:`, err)
        );
    }, [url, label]);
    console.log(texture)
    return texture;
}

function MeshLayer({ nodes, meshName, textureUrl, baseColor, label }) {
    const designTexture = useProductTexture(textureUrl, label);

    // Find the correct geometry in the GLTF tree
    const geometry = useMemo(() => {
        if (!nodes) return null;
        let node = nodes[meshName];
        if (!node) {
            // Fallback: search for partial matches if the registry name is slightly off
            const matchKey = Object.keys(nodes).find(k => k.includes(meshName.split('_')[0]));
            node = nodes[matchKey];
        }
        return node?.geometry || node?.children?.find(c => c.geometry)?.geometry || null;
    }, [nodes, meshName]);

    if (!geometry) return null;

    return (
        <group>
            {/* BASE FABRIC LAYER */}
            <mesh geometry={geometry}>
                <meshStandardMaterial 
                    color={baseColor} 
                    roughness={0.6} 
                    metalness={0.1} 
                />
            </mesh>

            {/* DESIGN OVERLAY LAYER (Fabric.js Design) */}
            {designTexture && (
                <mesh geometry={geometry}>
                    <meshStandardMaterial
                        transparent={true}
                        map={designTexture}
                        /* 
                           POLYGON OFFSET: This "pulls" the design slightly toward 
                           the camera to prevent flickering (Z-fighting) without 
                           needing to scale the mesh.
                        */
                        polygonOffset={true}
                        polygonOffsetFactor={-1}
                        polygonOffsetUnits={-1}
                        // Higher alphaTest prevents the "grey box" effect on edges
                        alphaTest={0.5} 
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
}

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

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
    return (
        <div className="w-full h-full relative bg-zinc-900" style={{ height: '500px' }}>
            <Canvas
                shadows
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                camera={{ position: [0, 0, 4], fov: 35 }}
            >
                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
                
                <Suspense fallback={null}>
                    <Center top>
                        <ProductModel
                            productId={productId}
                            textures={textures}
                            color={color}
                        />
                    </Center>
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                </Suspense>

                <OrbitControls 
                    makeDefault 
                    minDistance={2} 
                    maxDistance={7} 
                    enablePan={false} 
                />
            </Canvas>
        </div>
    );
}
