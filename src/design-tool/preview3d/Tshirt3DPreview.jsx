import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

// --- 1. SAFE TEXTURE HOOK ---
function useTextureSafe(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let isActive = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (tex) => {
        if (!isActive) return;
        // Textures on GLB models must be flipped false
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => console.error("Texture Error:", err)
    );

    return () => { isActive = false; };
  }, [url]);

  return texture;
}

// --- 2. SMART MESH COMPONENT ---
function MeshLayer({ nodes, meshName, textureUrl, baseColor, debug = false }) {
  const texture = useTextureSafe(textureUrl);

  // SMART FINDER: Handles naming mismatches and Groups vs Meshes
  const geometry = useMemo(() => {
    if (!nodes) return null;

    // A. Try exact name
    let node = nodes[meshName];

    // B. Try Fuzzy Matching (e.g. find "Ribbing" if looking for "Ribbon")
    if (!node) {
      const cleanName = meshName.split('_')[0]; // "Ribbon"
      const match = Object.keys(nodes).find(n => n.includes(cleanName));
      if (match) node = nodes[match];
    }

    if (!node) {
      console.warn(`❌ Node not found: ${meshName}`);
      return null;
    }

    // C. Extract Geometry (Handle Groups)
    if (node.geometry) return node.geometry;
    if (node.children && node.children.length > 0) {
      // Find first child with geometry
      const child = node.children.find(c => c.geometry);
      if (child) return child.geometry;
    }

    console.warn(`⚠️ Node ${meshName} found but has no geometry.`);
    return null;
  }, [nodes, meshName]);

  if (!geometry) return null;

  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.7,
    metalness: 0.05,
  }), [baseColor]);

  return (
    <group>
      {/* 1. Base Shirt Layer */}
      <mesh geometry={geometry} material={baseMaterial} castShadow receiveShadow />

      {/* 2. Decal Layer (The Design) */}
      {(texture || debug) && (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={texture}
            color={debug ? "red" : "white"} // Debug: Show bright red if no texture
            transparent={true}
            opacity={1}
            roughness={0.8}
            side={THREE.DoubleSide}
            // Z-Fighting Fix: Pushes decal slightly towards camera
            polygonOffset={true}
            polygonOffsetFactor={-4}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// --- 3. MODEL COMPONENT ---
function ProductModel({ productId, textures, color, debug }) {
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
          debug={debug}
        />
      ))}
    </group>
  );
}

// --- 4. MAIN EXPORT ---
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  // Toggle this to TRUE if you still don't see anything. 
  // It will make the design layer bright RED to prove the mesh exists.
  const DEBUG_MODE = true; 

  return (
    <div className="w-full h-full relative bg-zinc-900">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 4.5], fov: 35 }} // Adjusted camera
      >
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <group position={[0, -0.4, 0]}>
          <Center>
            <Suspense fallback={null}>
              <ProductModel 
                productId={productId} 
                textures={textures} 
                color={color} 
                debug={DEBUG_MODE}
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