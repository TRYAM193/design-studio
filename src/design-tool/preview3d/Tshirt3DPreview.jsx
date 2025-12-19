import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- 1. SAFE TEXTURE HOOK ---
function useTextureSafe(url, label) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let isActive = true;
    const loader = new THREE.TextureLoader();

    console.log(`[${label}] Loading texture...`);

    loader.load(
      url,
      (tex) => {
        if (!isActive) return;
        console.log(`[${label}] ✅ Texture loaded successfully!`);
        
        // CRITICAL: Texture settings for GLTF models
        tex.flipY = false; 
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        setTexture(tex);
      },
      undefined,
      (err) => console.error(`[${label}] ❌ Texture failed:`, err)
    );

    return () => { isActive = false; };
  }, [url, label]);

  return texture;
}

// --- 2. SMART MESH LAYER ---
function MeshLayer({ nodes, meshName, textureUrl, baseColor, label }) {
  const texture = useTextureSafe(textureUrl, label);

  // Smart Node Finder (Handles Groups & Naming Mismatches)
  const geometry = useMemo(() => {
    if (!nodes) return null;
    
    // 1. Try Exact Match
    let node = nodes[meshName];
    
    // 2. Try Fuzzy Match (e.g. "Ribbing" matching "Ribbon")
    if (!node) {
        const cleanName = meshName.split('_')[0];
        const matchKey = Object.keys(nodes).find(key => key.includes(cleanName));
        if (matchKey) node = nodes[matchKey];
    }

    if (!node) return null;

    // 3. Extract Geometry (Handle Groups)
    if (node.geometry) return node.geometry;
    if (node.children && node.children.length > 0) {
      const child = node.children.find(c => c.geometry);
      if (child) return child.geometry;
    }
    return null;
  }, [nodes, meshName]);

  if (!geometry) return null;

  // Material for the Shirt Fabric
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.7,
    metalness: 0.05,
  }), [baseColor]);

  return (
    <group>
      {/* Base Layer (Shirt Color) */}
      <mesh geometry={geometry} material={baseMaterial} castShadow receiveShadow />

      {/* Design Layer (Only renders if texture exists) */}
      {texture && (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={texture}
            transparent={true}
            opacity={1}
            roughness={0.5} // Slightly shinier to pop against fabric
            side={THREE.DoubleSide}
            
            // FIX: Pulls the texture forward to prevent flickering
            polygonOffset={true}
            polygonOffsetFactor={-2} // Adjusted from -4 to -2 for safety
            depthWrite={false} 
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
      {/* Loop through all meshes defined in registry */}
      {Object.keys(config.meshes).map((key) => (
        <MeshLayer
          key={key}
          label={key} // e.g. "front", "back"
          nodes={nodes}
          meshName={config.meshes[key]}
          textureUrl={textures[key]}
          baseColor={color}
        />
      ))}
    </group>
  );
}

// --- 4. EXPORTED COMPONENT ---
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <div className="w-full h-full relative bg-zinc-900">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 4.5], fov: 35 }}
      >
        <ambientLight intensity={0.8} />
        
        {/* Main Light */}
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* Fill Light (Back) - ensures back isn't pitch black */}
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