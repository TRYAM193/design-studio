import React, { useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- UTILS ---
const EMPTY_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// --- COMPONENT: DECAL LAYER (THE DESIGN) ---
function DecalLayer({ geometry, textureUrl, opacity = 1 }) {
    const [texture, setTexture] = React.useState(null);
    const [error, setError] = React.useState(false);

    useEffect(() => {
        let isMounted = true;
        let tex;

        if (!textureUrl) {
            setTexture(null);
            setError(false);
            return;
        }

        console.log('Loading texture:', textureUrl ? textureUrl.substring(0, 50) + '...' : 'null');

        const loader = new THREE.TextureLoader();

        (async () => {
            try {
                tex = await loader.loadAsync(textureUrl);
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;

                if (isMounted) {
                    setTexture(tex);
                    setError(false);
                    console.log('Texture loaded successfully');
                }
            } catch (err) {
                console.error("Texture load failed:", err);
                if (isMounted) {
                    setError(true);
                    setTexture(null);
                }
            }
        })();

        return () => {
            isMounted = false;
            if (tex) tex.dispose();
        };
    }, [textureUrl]);

    if (error || !texture) return null;

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                map={texture}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                polygonOffset
                polygonOffsetFactor={-4}
                roughness={0.8}
            />
        </mesh>
    );
}

// --- COMPONENT: REAL GLB MODEL ---
function ProductModel({ productType, textures, color }) {
    const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
    const { nodes } = useGLTF(config.path, true);

    console.log('Available nodes:', Object.keys(nodes));
    console.log('Textures:', textures);

    // Robust Mesh Finder
    const getMesh = (name) => {
        if (!name || !nodes) return null;
        if (nodes[name]) return nodes[name];
        const noDots = name.replace(/\./g, '');
        const underscore = name.replace(/\./g, '_');
        return nodes[noDots] || nodes[underscore] || null;
    };

    const matBase = useMemo(() => new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
    }), [color]);

    // Collect all meshes that should have base material
    const allMeshes = new Set();
    Object.keys(textures || {}).forEach(meshName => {
        const mesh = getMesh(meshName);
        if (mesh) allMeshes.add(meshName);
        console.log('Mesh for texture:', meshName, !!mesh);
    });
    // Add config meshes if not already included
    Object.values(config.meshes || {}).forEach(meshName => {
        if (meshName) allMeshes.add(meshName);
    });

    return (
        <group dispose={null}>
            {/* Render base meshes */}
            {Array.from(allMeshes).map(meshName => {
                const mesh = getMesh(meshName);
                if (!mesh) return null;
                return (
                    <mesh key={`base-${meshName}`} geometry={mesh.geometry} material={matBase} castShadow />
                );
            })}
            {/* Render decals for textured meshes */}
            {Object.entries(textures || {}).map(([meshName, textureUrl]) => {
                const mesh = getMesh(meshName);
                if (!mesh) return null;
                return (
                    <DecalLayer key={`decal-${meshName}`} geometry={mesh.geometry} textureUrl={textureUrl} />
                );
            })}
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