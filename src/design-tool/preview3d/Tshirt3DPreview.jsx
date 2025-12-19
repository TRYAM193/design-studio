import React, { useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- UTILS ---
const EMPTY_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// --- COMPONENT: TEXTURE LAYER ---
function DecalLayer({ geometry, textureUrl, opacity = 1, scale = 1.002 }) {
    const texture = useMemo(() => {
        if (!textureUrl || textureUrl === EMPTY_TEXTURE) return null;
        const loader = new THREE.TextureLoader();
        const tex = loader.load(textureUrl);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [textureUrl]);

    useEffect(() => {
        return () => { if (texture) texture.dispose(); };
    }, [texture]);

    if (!texture) return null;

    return (
        <mesh geometry={geometry} scale={scale}>
            <meshBasicMaterial 
                map={texture} 
                transparent={true} 
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
}

// --- COMPONENT: REAL GLB MODEL ---

function ProductModel({ productType, textures, color }) {
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes } = useGLTF(config.path, true);

    // --- 1. SMART TEXTURE MAPPING (Fixes "Design Not Applying") ---
    // Maps common variations (snake_case, camelCase) to standard keys
    const mappedTextures = useMemo(() => ({
        front: textures.front || textures.Front,
        back: textures.back || textures.Back,
        leftSleeve: textures.leftSleeve || textures.left_sleeve || textures.Left_Sleeve || textures.left,
        rightSleeve: textures.rightSleeve || textures.right_sleeve || textures.Right_Sleeve || textures.right,
    }), [textures]);

    // --- 2. ROBUST NODE FINDER (Fixes "Right Sleeve Not Loading") ---
    // Finds a node even if the name was sanitized (e.g. "Node.001" -> "Node_001")
    const getMesh = (name) => {
        if (!name) return null;
        if (nodes[name]) return nodes[name]; // Exact match

        // Fuzzy match: Look for node that ends with the ID or similar
        // e.g. "Sleeves_Node.001" might match "Sleeves_Node_001"
        const cleanName = name.replace('.', '_'); 
        if (nodes[cleanName]) return nodes[cleanName];

        const keyMatch = Object.keys(nodes).find(key => 
            key.toLowerCase() === name.toLowerCase() || 
            key.replace('.', '_') === cleanName
        );
        
        return nodes[keyMatch];
    };

    // --- DEBUG: Print found keys to console ---
    useEffect(() => {
        console.log("🔍 3D Model Loaded. Available Nodes:", Object.keys(nodes));
        if (!getMesh(config.meshes.rightSleeve)) {
            console.warn(`⚠️ Could not find Right Sleeve mesh: "${config.meshes.rightSleeve}"`);
        }
    }, [nodes, config]);

    // Material with Emissive to ensure it's visible even in dark lighting
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.2, 
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
    }), [color]);

    return (
        <group dispose={null}>
            {/* 1. FRONT */}
            {getMesh(config.meshes.front) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.front).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.front).geometry} textureUrl={mappedTextures.front} />
                </group>
            )}

            {/* 2. BACK */}
            {getMesh(config.meshes.back) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.back).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.back).geometry} textureUrl={mappedTextures.back} />
                </group>
            )}

            {/* 3. LEFT SLEEVE */}
            {getMesh(config.meshes.leftSleeve) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.leftSleeve).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.leftSleeve).geometry} textureUrl={mappedTextures.leftSleeve} />
                </group>
            )}

            {/* 4. RIGHT SLEEVE */}
            {getMesh(config.meshes.rightSleeve) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.rightSleeve).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.rightSleeve).geometry} textureUrl={mappedTextures.rightSleeve} />
                </group>
            )}

            {/* 5. COLLARS */}
            {getMesh(config.meshes.fcollar) && (
                <mesh geometry={getMesh(config.meshes.fcollar).geometry} material={matBase} />
            )}
            {getMesh(config.meshes.bcollar) && (
                <mesh geometry={getMesh(config.meshes.bcollar).geometry} material={matBase} />
            )}
        </group>
    );
}

// --- FALLBACK COMPONENT ---
function FallbackTshirt({ textures, color }) {
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1 }), [color]);
    return (
        <group scale={1.2}>
            <mesh position={[0, 0, 0]} material={matBase}><boxGeometry args={[1, 1.4, 0.25]} /></mesh>
            <mesh position={[0, 0.72, 0]} material={matBase}><cylinderGeometry args={[0.18, 0.18, 0.08, 32]} /></mesh>
            <mesh position={[-0.65, 0.45, 0]} material={matBase}><boxGeometry args={[0.4, 0.5, 0.25]} /></mesh>
            <mesh position={[0.65, 0.45, 0]} material={matBase}><boxGeometry args={[0.4, 0.5, 0.25]} /></mesh>
        </group>
    );
}

// --- ERROR BOUNDARY ---
class ModelErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) { console.error("3D Error:", error); }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// --- MAIN EXPORT ---
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
    const productType = resolveProductType(productId);

    return (
        <div className="w-full h-full relative bg-zinc-900">
            <Canvas 
                shadows 
                gl={{ preserveDrawingBuffer: true }} 
                camera={{ position: [0, 0, 2.5], fov: 45 }}
            >
                <ambientLight intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} />
                <directionalLight position={[-5, 5, 5]} intensity={1.5} />
                <directionalLight position={[0, 0, 5]} intensity={1} />

                <group position={[0, -0.2, 0]}>
                    <Center>
                        <ModelErrorBoundary fallback={<FallbackTshirt textures={textures} color={color} />}>
                            <React.Suspense fallback={<FallbackTshirt textures={textures} color={color} />}>
                                 <ProductModel productType={productType} textures={textures} color={color} />
                            </React.Suspense>
                        </ModelErrorBoundary>
                    </Center>
                </group>

                <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
                <Environment preset="city" />
                <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} />
            </Canvas>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
                 <span className="bg-black/40 text-white/80 text-[10px] px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    Drag to Rotate
                 </span>
            </div>
        </div>
    );
}