import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// Improved Texture Loader specifically for Blob/Data URLs
function DesignTexture({ url }) {
    // We use standard TextureLoader but immediately configure it for GLTF models
    const texture = useLoader(THREE.TextureLoader, url);
    
    useMemo(() => {
        if (texture) {
            texture.flipY = false; // CRITICAL: GLTF models use inverted Y-axis
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
        }
    }, [texture]);

    return texture;
}

function MeshLayer({ nodes, meshName, textureUrl, baseColor }) {
    const geometry = useMemo(() => {
        const node = nodes[meshName] || Object.values(nodes).find(n => n.name.includes(meshName));
        return node?.geometry || node?.children?.find(c => c.geometry)?.geometry;
    }, [nodes, meshName]);

    if (!geometry) return null;

    return (
        <group>
            {/* Base Layer */}
            <mesh geometry={geometry}>
                <meshStandardMaterial color={baseColor} roughness={0.6} />
            </mesh>

            {/* Design Layer */}
            {designTexture && (
                <mesh geometry={geometry}>
                    <meshStandardMaterial
                        transparent={true}
                        map={t} // ✅ CORRECT: Pass as a prop, not a child
                        polygonOffset={true}
                        polygonOffsetFactor={-1}
                        alphaTest={0.5}
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
        <div className="w-full h-full min-h-[500px] bg-zinc-900">
            <Canvas shadows camera={{ position: [0, 0, 4], fov: 35 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                <Suspense fallback={null}>
                    <Center top>
                        <ProductModel productId={productId} textures={textures} color={color} />
                    </Center>
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                </Suspense>

                <OrbitControls enablePan={false} minDistance={2} maxDistance={7} />
            </Canvas>
        </div>
    );
}
