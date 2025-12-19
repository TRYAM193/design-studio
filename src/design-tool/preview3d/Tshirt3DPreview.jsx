import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

/**
 * Custom Hook: Loads a texture safely from a URL (or base64)
 * - Prevents race conditions (cancels previous load if url changes)
 * - Enforces correct encoding and flip settings
 * - Disposes of old textures to prevent memory leaks
 */
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
      (loadedTex) => {
        if (!isActive) {
          loadedTex.dispose();
          return;
        }

        // 3. Texture Configuration
        loadedTex.flipY = false; // As requested
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.needsUpdate = true;
        
        setTexture(loadedTex);
      },
      undefined, // onProgress
      (err) => {
        console.error("Failed to load 3D texture:", err);
        if (isActive) setTexture(null);
      }
    );

    // Cleanup: Prevent race conditions and memory leaks
    return () => {
      isActive = false;
    };
  }, [url]);

  return texture;
}

/**
 * Sub-component: Applies the design texture to a specific mesh geometry
 * Uses Polygon Offset to prevent z-fighting with the base shirt color
 */
function MeshLayer({ nodes, meshName, textureUrl, baseColor }) {
  const texture = useTextureSafe(textureUrl);
  
  // Robustly find the mesh node by name (handling potential naming quirks)
  const meshNode = useMemo(() => {
    if (!nodes || !meshName) return null;
    return nodes[meshName] || nodes[meshName.replace(/\./g, '_')]; 
  }, [nodes, meshName]);

  if (!meshNode) return null;

  // Base Material (Fabric Color)
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.7,
    metalness: 0.05,
  }), [baseColor]);

  return (
    <group>
      {/* 1. Base Layer: The Shirt Color */}
      <mesh 
        geometry={meshNode.geometry} 
        material={baseMaterial} 
        castShadow 
        receiveShadow 
      />

      {/* 2. Design Layer: The Texture (Only if texture exists) */}
      {texture && (
        <mesh geometry={meshNode.geometry}>
          <meshStandardMaterial
            map={texture}
            transparent={true}
            opacity={1}
            roughness={0.8}
            side={THREE.DoubleSide}
            
            // Critical for overlaying on the exact same geometry
            polygonOffset={true}
            polygonOffsetFactor={-4} 
            depthWrite={false} 
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Main Model Component
 * Loads the GLTF and maps textures to specific meshes defined in MODEL_REGISTRY
 */
function ProductModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
  
  // Load GLTF Model
  const { nodes } = useGLTF(config.path);

  // Identify all mesh keys defined in the registry (front, back, sleeves, etc.)
  const meshKeys = Object.keys(config.meshes);

  return (
    <group dispose={null}>
      {meshKeys.map((key) => {
        const meshName = config.meshes[key];
        const textureUrl = textures[key]; // e.g. textures.front, textures.back

        return (
          <MeshLayer
            key={key}
            nodes={nodes}
            meshName={meshName}
            textureUrl={textureUrl}
            baseColor={color}
          />
        );
      })}
    </group>
  );
}

/**
 * Loading Fallback
 */
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

/**
 * Main Exported Component
 */
export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <div className="w-full h-full relative bg-zinc-900">
      <Canvas
        shadows
        dpr={[1, 2]} // Optimization for high DPI screens
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 3.5], fov: 40 }}
      >
        <ambientLight intensity={0.7} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1} 
          castShadow 
        />
        
        {/* Fill lights for better product visibility */}
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <group position={[0, -0.2, 0]}>
          <Center>
            <Suspense fallback={<Loader />}>
              <ProductModel 
                productId={productId} 
                textures={textures} 
                color={color} 
              />
            </Suspense>
          </Center>
        </group>

        {/* 5. Works with OrbitControls */}
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5}
          minDistance={2}
          maxDistance={8}
        />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}