import React, { useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- UTILS ---

const EMPTY_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function useTextureMaterial(textureUrl, baseColor, isTransparent = true) {
    const texture = useMemo(() => {
        if (!textureUrl) return null;
        const loader = new THREE.TextureLoader();
        const tex = loader.load(textureUrl);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [textureUrl]);

    useEffect(() => {
        return () => {
            if (texture) texture.dispose();
        };
    }, [texture]);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: baseColor,
            map: texture,
            transparent: isTransparent,
            roughness: 0.6, // Lower roughness for better visibility
            metalness: 0.1,
            side: THREE.DoubleSide
        });
    }, [baseColor, texture, isTransparent]);

    return material;
}

// --- COMPONENT: REAL GLB MODEL ---

function ProductModel({ productType, textures, color }) {
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes } = useGLTF(config.path, true); 
    
    if (!nodes) throw new Error("Model nodes missing");

    const matFront = useTextureMaterial(textures.front || EMPTY_TEXTURE, color);
    const matBack = useTextureMaterial(textures.back || EMPTY_TEXTURE, color);
    const matLeft = useTextureMaterial(textures.leftSleeve || EMPTY_TEXTURE, color);
    const matRight = useTextureMaterial(textures.rightSleeve || EMPTY_TEXTURE, color);
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);

    return (
        <group dispose={null}>
            {nodes[config.meshes.front] && (
                <mesh geometry={nodes[config.meshes.front].geometry} material={matFront} castShadow />
            )}
            {nodes[config.meshes.back] && (
                <mesh geometry={nodes[config.meshes.back].geometry} material={matBack} castShadow />
            )}
            {nodes[config.meshes.leftSleeve] && (
                <mesh geometry={nodes[config.meshes.leftSleeve].geometry} material={matLeft} castShadow />
            )}
            {nodes[config.meshes.rightSleeve] && (
                <mesh geometry={nodes[config.meshes.rightSleeve].geometry} material={matRight} castShadow />
            )}
            {nodes[config.meshes.collar] && (
                <mesh geometry={nodes[config.meshes.collar].geometry} material={matBase} />
            )}
        </group>
    );
}

// --- COMPONENT: FALLBACK GEOMETRIC MODEL ---

function FallbackTshirt({ textures, color }) {
    const matFront = useTextureMaterial(textures.front || EMPTY_TEXTURE, color, false);
    const matBack = useTextureMaterial(textures.back || EMPTY_TEXTURE, color, false);
    const matLeft = useTextureMaterial(textures.leftSleeve || EMPTY_TEXTURE, color, false);
    const matRight = useTextureMaterial(textures.rightSleeve || EMPTY_TEXTURE, color, false);
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);

    const torsoMaterials = [matBase, matBase, matBase, matBase, matFront, matBack];
    const leftSleeveMaterials = [matBase, matBase, matBase, matBase, matLeft, matBase];
    const rightSleeveMaterials = [matBase, matBase, matBase, matBase, matRight, matBase];

    return (
        // SCALE UP FALLBACK MODEL FOR BETTER VISIBILITY
        <group scale={1.2}> 
            {/* TORSO */}
            <mesh position={[0, 0, 0]} material={torsoMaterials} castShadow>
                <boxGeometry args={[1, 1.4, 0.25]} />
            </mesh>

            {/* NECK */}
            <mesh position={[0, 0.72, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.08, 32]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.9)} />
            </mesh>

            {/* LEFT SLEEVE */}
            <mesh position={[-0.65, 0.45, 0]} material={leftSleeveMaterials} castShadow>
                 <boxGeometry args={[0.4, 0.5, 0.25]} />
            </mesh>

            {/* RIGHT SLEEVE */}
            <mesh position={[0.65, 0.45, 0]} material={rightSleeveMaterials} castShadow>
                 <boxGeometry args={[0.4, 0.5, 0.25]} />
            </mesh>
        </group>
    );
}

class ModelErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error) { console.warn("3D Model Error:", error); }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
    const productType = resolveProductType(productId);

    return (
        <div className="w-full h-full relative bg-zinc-900">
            <Canvas 
                shadows 
                gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance' }} 
                // CAMERA ADJUSTED: Closer (2.2) and slightly wider FOV (45) for a "Big & Clean" look
                camera={{ position: [0, 0, 2.2], fov: 45 }}
            >
                {/* Brighter Lights */}
                <ambientLight intensity={0.9} />
                <spotLight 
                    position={[5, 10, 7]} 
                    angle={0.4} 
                    penumbra={1} 
                    intensity={1.5} 
                    castShadow 
                />
                <pointLight position={[-5, 2, -5]} intensity={0.8} color="white" />

                <Center>
                    <ModelErrorBoundary 
                        fallback={<FallbackTshirt textures={textures} color={color} />}
                    >
                        <React.Suspense fallback={<FallbackTshirt textures={textures} color={color} />}>
                             <ProductModel 
                                productType={productType} 
                                textures={textures} 
                                color={color} 
                            />
                        </React.Suspense>
                    </ModelErrorBoundary>
                </Center>

                <OrbitControls 
                    enablePan={false} 
                    minPolarAngle={0.2} 
                    maxPolarAngle={Math.PI - 0.2}
                    minDistance={1.5}
                    maxDistance={5}
                />
                
                <Environment preset="city" blur={0.8} />
                
                <ContactShadows 
                    position={[0, -0.85, 0]} 
                    opacity={0.5} 
                    scale={10} 
                    blur={2} 
                    far={1.5} 
                    color="#000000"
                />
            </Canvas>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
                 <span className="bg-black/40 text-white/80 text-[10px] px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    Drag to Rotate
                 </span>
            </div>
        </div>
    );
}