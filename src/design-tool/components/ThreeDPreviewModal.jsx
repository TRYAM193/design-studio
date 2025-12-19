import React, { useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from '../modelRegistry';

// --- UTILS ---
const EMPTY_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// --- COMPONENT: DECAL LAYER (THE DESIGN) ---
function DecalLayer({ geometry, textureUrl, opacity = 1 }) {
    const texture = useMemo(() => {
        if (!textureUrl || textureUrl === EMPTY_TEXTURE) return null;
        const loader = new THREE.TextureLoader();
        const tex = loader.load(textureUrl); // Works with Blob URLs automatically
        tex.flipY = false; 
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [textureUrl]);

    useEffect(() => {
        return () => { if (texture) texture.dispose(); };
    }, [texture]);

    if (!texture) return null;

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial 
                map={texture} 
                transparent={true} 
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={true} 
                polygonOffset={true}
                polygonOffsetFactor={-4} // Force on top
                roughness={0.8}
            />
        </mesh>
    );
}

// --- COMPONENT: REAL GLB MODEL ---

function ProductModel({ productType, textures, color }) {
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes } = useGLTF(config.path, true);

    const mappedTextures = useMemo(() => ({
        front: textures.front || textures.Front,
        back: textures.back || textures.Back,
        leftSleeve: textures.leftSleeve || textures.left_sleeve || textures.Left_Sleeve || textures.left,
        rightSleeve: textures.rightSleeve || textures.right_sleeve || textures.Right_Sleeve || textures.right,
    }), [textures]);

    // Robust Mesh Finder
    const getMesh = (name) => {
        if (!name) return null;
        if (nodes[name]) return nodes[name];
        const noDots = name.replace(/\./g, '');
        const underscore = name.replace(/\./g, '_');
        return nodes[noDots] || nodes[underscore];
    };

    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
    }), [color]);

    return (
        <group dispose={null}>
            {getMesh(config.meshes.front) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.front).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.front).geometry} textureUrl={mappedTextures.front} />
                </group>
            )}
            {getMesh(config.meshes.back) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.back).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.back).geometry} textureUrl={mappedTextures.back} />
                </group>
            )}
            {getMesh(config.meshes.leftSleeve) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.leftSleeve).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.leftSleeve).geometry} textureUrl={mappedTextures.leftSleeve} />
                </group>
            )}
            {getMesh(config.meshes.rightSleeve) && (
                <group>
                    <mesh geometry={getMesh(config.meshes.rightSleeve).geometry} material={matBase} castShadow />
                    <DecalLayer geometry={getMesh(config.meshes.rightSleeve).geometry} textureUrl={mappedTextures.rightSleeve} />
                </group>
            )}
            {getMesh(config.meshes.fcollar) && (
                <mesh geometry={getMesh(config.meshes.fcollar).geometry} material={matBase} />
            )}
            {getMesh(config.meshes.bcollar) && (
                <mesh geometry={getMesh(config.meshes.bcollar).geometry} material={matBase} />
            )}
        </group>
    );
}

function FallbackTshirt({ textures, color }) {
    const matBase = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);
    return (
        <group scale={1.2}>
            <mesh position={[0, 0, 0]} material={matBase}><boxGeometry args={[1, 1.4, 0.25]} /></mesh>
            <mesh position={[0, 0.72, 0]} material={matBase}><cylinderGeometry args={[0.18, 0.18, 0.08, 32]} /></mesh>
            <mesh position={[-0.65, 0.45, 0]} material={matBase}><boxGeometry args={[0.4, 0.5, 0.25]} /></mesh>
            <mesh position={[0.65, 0.45, 0]} material={matBase}><boxGeometry args={[0.4, 0.5, 0.25]} /></mesh>
        </group>
    );
}

class ModelErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) { console.error("3D Error:", error); }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
    const productType = resolveProductType(productId);

    return (
        <div className="w-full h-full relative bg-zinc-900">
            <Canvas 
                shadows 
                gl={{ preserveDrawingBuffer: true, antialias: true }} 
                camera={{ position: [0, 0, 2.5], fov: 45 }}
            >
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow />
                <directionalLight position={[-5, 5, 5]} intensity={1} />
                <directionalLight position={[0, 0, 5]} intensity={0.5} />

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