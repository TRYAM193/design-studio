import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_REGISTRY, resolveProductType } from './modelRegistry';

/**
 * Custom Hook: Loads a texture safely
 * Handles Blob URLs and prevents race conditions.
 */
function useTextureSafe(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    console.log("Loading Texture URL:", url); // Debugging

    let isActive = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loadedTex) => {
        if (!isActive) {
          loadedTex.dispose();
          return;
        }

        // TEXTURE SETTINGS
        loadedTex.flipY = false; // CRITICAL for GLB models
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.anisotropy = 16; // Makes texture sharp at angles
        loadedTex.needsUpdate = true;
        
        setTexture(loadedTex);
      },
      undefined,
      (err) => {
        console.error("Texture Load Error:", err);
        if (isActive) setTexture(null);
      }
    );

    return () => {
      isActive = false;
    };
  }, [url]);

  return texture;
}

/**
 * Layer Component
 * Renders the shirt color + the design overlaid on top
 */
function MeshLayer({ nodes, meshName, textureUrl, baseColor }) {
  const texture = useTextureSafe(textureUrl);
  
  // 1. Find the node
  const node = useMemo(() => {
    if (!nodes || !meshName) return null;
    return nodes[meshName] || nodes[meshName.replace(/\./g, '_')]; 
  }, [nodes, meshName]);

  // 2. SAFETY CHECK: Extract geometry even if node is a Group
  const geometry = useMemo(() => {
    if (!node) return null;
    if (node.geometry) return node.geometry; // It's a Mesh
    if (node.children && node.children.length > 0) {
        // It's a Group, find the first mesh child
        const childMesh = node.children.find(child => child.geometry);
        return childMesh ? childMesh.geometry : null;
    }
    return null;
  }, [node]);

  if (!geometry) {
      if (meshName) console.warn(`⚠️ Mesh "${meshName}" found but has no geometry.`);
      return null;
  }

  // Material for the shirt fabric
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.7,
    metalness: 0.05,
  }), [baseColor]);

  return (
    <group>
      {/* Base Layer */}
      <mesh 
        geometry={geometry} 
        material={baseMaterial} 
        castShadow 
        receiveShadow 
      />

      {/* Design Overlay Layer */}
      {texture && (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={texture}
            transparent={true}
            opacity={1}
            roughness={0.8}
            side={THREE.DoubleSide}
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
 * Main Product Model
 */
// Inside design-tool/preview3d/Tshirt3DPreview.jsx

function ProductModel({ productId, textures, color }) {
  const productType = resolveProductType(productId);
  const config = MODEL_REGISTRY[productType] || MODEL_REGISTRY["TSHIRT"];
  const { nodes } = useGLTF(config.path);

  // 🔍 DEBUG: Log all available mesh names to the console
  React.useEffect(() => {
    console.group("🔍 3D Model Debug Info");
    console.log("Loaded GLB Nodes:", Object.keys(nodes));
    console.log("Targeting Meshes:", config.meshes);
    console.groupEnd();
  }, [nodes, config]);

  const meshKeys = Object.keys(config.meshes);

  return (
    <group dispose={null}>
      {meshKeys.map((key) => (
        <MeshLayer
          key={key}
          nodes={nodes}
          meshName={config.meshes[key]} // This name MUST match one in "Loaded GLB Nodes"
          textureUrl={textures[key]}
          baseColor={color}
        />
      ))}
    </group>
  );
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

export default function Tshirt3DPreview({ productId, textures, color = "#ffffff" }) {
  return (
    <div className="w-full h-full relative bg-zinc-900">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 3.5], fov: 40 }}
      >
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
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