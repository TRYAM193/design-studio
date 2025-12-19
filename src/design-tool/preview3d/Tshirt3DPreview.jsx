import React, { useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- UTILS ---
const EMPTY_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// --- COMPONENT: TEXTURE LAYER (THE DESIGN) ---
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
                depthWrite={false} // Prevents Z-fighting
                toneMapped={false} // Keeps colors bright
            />
        </mesh>
    );
}

// --- COMPONENT: REAL GLB MODEL (Auto-Discovery) ---

function ProductModel({ productType, textures, color }) {
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes, scene } = useGLTF(config.path, true);
    
    // --- 1. SMART NODE DISCOVERY ---
    // Inspect all nodes to find the best matches if exact config names fail
    const discoveredNodes = useMemo(() => {
        const found = { ...config.meshes }; // Start with defaults
        const allNodeNames = Object.keys(nodes);

        console.log("🔍 Scanning 3D Model Nodes:", allNodeNames);

        // Helper to find a node by partial string
        const findNode = (search) => allNodeNames.find(n => n.toLowerCase().includes(search.toLowerCase()) && nodes[n].isMesh);

        // Fallback logic: If configured name doesn't exist, search for it
        if (!nodes[found.front]) found.front = findNode("front") || findNode("body") || found.front;
        if (!nodes[found.back]) found.back = findNode("back") || found.front; // Fallback to front mesh if back missing
        if (!nodes[found.leftSleeve]) found.leftSleeve = findNode("sleeve_left") || findNode("sleeve") || found.front;
        if (!nodes[found.rightSleeve]) found.rightSleeve = findNode("sleeve_right") || found.rightSleeve;
        
        return found;
    }, [nodes, config]);

    // --- 2. ROBUST MATERIAL (Fixes "Black Color") ---
    // Uses MeshStandardMaterial but with 'emissive' to guarantee visibility
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,       // <--- KEY FIX: Makes it glow slightly with its own color
        emissiveIntensity: 0.2, 
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
    }), [color]);

    // --- 3. RENDER LOGIC ---
    // If we found the "Front" mesh, we assume we can map textures.
    // If not, we render the WHOLE SCENE as a backup.
    
    const primaryMesh = nodes[discoveredNodes.front];

    if (!primaryMesh) {
        console.warn("⚠️ No suitable meshes found. Rendering raw scene.");
        return <primitive object={scene} scale={10} />; // Fallback to raw model
    }

    return (
        <group dispose={null}>
            {/* FRONT */}
            {nodes[discoveredNodes.front] && (
                <group>
                    <mesh geometry={nodes[discoveredNodes.front].geometry} material={matBase} castShadow />
                    <DecalLayer geometry={nodes[discoveredNodes.front].geometry} textureUrl={textures.front} />
                </group>
            )}

            {/* BACK */}
            {nodes[discoveredNodes.back] && (
                <group>
                    <mesh geometry={nodes[discoveredNodes.back].geometry} material={matBase} castShadow />
                    <DecalLayer geometry={nodes[discoveredNodes.back].geometry} textureUrl={textures.back} />
                </group>
            )}

            {/* SLEEVES */}
            {nodes[discoveredNodes.leftSleeve] && (
                <group>
                    <mesh geometry={nodes[discoveredNodes.leftSleeve].geometry} material={matBase} castShadow />
                    <DecalLayer geometry={nodes[discoveredNodes.leftSleeve].geometry} textureUrl={textures.leftSleeve} />
                </group>
            )}
            {nodes[discoveredNodes.rightSleeve] && (
                <group>
                    <mesh geometry={nodes[discoveredNodes.rightSleeve].geometry} material={matBase} castShadow />
                    <DecalLayer geometry={nodes[discoveredNodes.rightSleeve].geometry} textureUrl={textures.rightSleeve} />
                </group>
            )}

            {/* COLLAR (If found) */}
            {nodes[discoveredNodes.collar] && (
                <mesh geometry={nodes[discoveredNodes.collar].geometry} material={matBase} />
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
                {/* 💡 SUPER BRIGHT LIGHTING SETUP */}
                <ambientLight intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} />
                <directionalLight position={[-5, 5, 5]} intensity={1.5} />
                <directionalLight position={[0, 0, 5]} intensity={1} /> {/* Front Fill */}

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
                    Drag to Rotate • Auto-Discovery Mode
                 </span>
            </div>
        </div>
    );
}