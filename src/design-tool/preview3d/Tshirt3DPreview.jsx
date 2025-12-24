// src/design-tool/preview3d/Tshirt3DPreview.jsx
import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, Center, Environment } from "@react-three/drei";

const MODEL_CONFIGS = {
  "t-shirt": {
    scale: 0.8,
    position: [0, -0.85, 0],
    meshes: {
      front: "Body_Front_Node",
      back: "Body_Back_Node",
      leftSleeve: "Sleeves_Node",
      rightSleeve: "Sleeves_Node001",
    }
  },
  "oversized": {
    scale: 0.8,
    position: [0, -0.85, 0],
    meshes: {
      front: "Oversized_front",
      back: "Oversized_back",
    }
  },
  "hoodie": {
    scale: 0.8,
    position: [0, -0.85, 0],
    meshes: {
      front: "Hoodie_front",
      back: "Hoodie_back",
      hood: "Hoodie_hood",
      leftSleeve: "Hoodie_left_sleeve",
      rightSleeve: "Hoodie_right_sleeve"
    }
  },
  "mug": {
    scale: 3, // Mugs are small, scale them up
    position: [0, -1.5, 0],
    meshes: {
      front: "Mug_Body", // Usually mugs are one single mesh
      handle: "Mug_Handle"
    }
  },
  "tote": {
    scale: 0.08, // Totes are often large in cm, scale down
    position: [0, -1.5, 0],
    meshes: {
      front: "Bag_Front",
      back: "Bag_Back",
      straps: "Bag_Straps"
    }
  }
};

// Helper to determine which config to use based on URL
const resolveConfig = (url) => {
  if (!url) return MODEL_CONFIGS["t-shirt"]; // Default
  if (url.includes("hoodie")) return MODEL_CONFIGS["hoodie"];
  if (url.includes("oversized")) return MODEL_CONFIGS["oversized"];
  if (url.includes("mug")) return MODEL_CONFIGS["mug"];
  if (url.includes("tote")) return MODEL_CONFIGS["tote"];
  return MODEL_CONFIGS["t-shirt"];
};

// --- 2. Texture Loader ---
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
  }, [url]);
  return texture;
}

// --- 3. Calibration Decal (Same as before) ---
function CalibrationDecal({ texture, x, y, z, scale, rotation = [0, 0, 0] }) {
  if (!texture) return null;
  return (
    <Decal
      position={[x, y, z]}
      rotation={rotation}
      scale={[scale, scale, 1.5]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        depthTest={true}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </Decal>
  );
}

// --- 4. The Main Model Component ---
function DynamicModel({ modelUrl, textures, color }) {
  // Load the GLTF
  const { nodes, materials } = useGLTF(modelUrl);

  // Get Configuration
  const config = useMemo(() => resolveConfig(modelUrl), [modelUrl]);
  const m = config.meshes;

  // Load Textures
  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve || textures?.left);
  const rightTex = useDesignTexture(textures?.rightSleeve || textures?.right);

  // Helper to render a mesh safely (if it exists in the GLB)
  const RenderPart = ({ meshName, tex, decalProps, isSleeve }) => {
    if (!nodes || !nodes[meshName]) return null;

    // If the GLB uses a specific material, we clone it to change color
    // Otherwise we create a standard material
    const MaterialToUse = (
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        map={materials?.[meshName]?.map || null} // Preserve original texture if exists
      />
    );

    return (
      <mesh geometry={nodes[meshName].geometry} material={nodes[meshName].material}>
        {/* We override color manually */}
        <meshStandardMaterial color={color} roughness={0.7} />

        {tex && decalProps && (
          <CalibrationDecal
            texture={tex}
            {...decalProps}
          />
        )}
      </mesh>
    );
  };

  return (
    <group position={config.position} scale={config.scale} dispose={null}>

      {/* Front */}
      <RenderPart
        meshName={m.front}
        tex={frontTex}
        decalProps={{ x: 0, y: 1.25, z: -0.5, scale: 0.5, rotation: [0, 0, 0] }} // Front Decal Values
      />

      {/* Back */}
      <RenderPart
        meshName={m.back}
        tex={backTex}
        decalProps={{ x: 0, y: 1.25, z: 0.5, scale: 0.5, rotation: [0, Math.PI, 0] }} // Back Decal (Slider Controlled)
      />

      {/* Sleeves (Optional) */}
      <RenderPart meshName={m.leftSleeve} tex={leftTex} />
      <RenderPart meshName={m.rightSleeve} tex={rightTex} />

      {/* Extras (Hood, Handle, Straps) */}
      <RenderPart meshName={m.hood} />
      <RenderPart meshName={m.handle} />
      <RenderPart meshName={m.straps} />

      {/* Fallback: If no meshes matched config, render the whole scene to debug */}
      {(!m.front || !nodes[m.front]) && (
        <primitive object={nodes.Scene || nodes.root} />
      )}
    </group>
  );
}

export default function Tshirt3DPreview({ modelUrl, textures, color = "#ffffff" }) {

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <directionalLight position={[0, 5, -10]} intensity={0.8} />
        <Environment preset="city" />

        <Center>
          <DynamicModel
            modelUrl={modelUrl}
            textures={textures}
            color={color}
            controls={controls}
          />
        </Center>

        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>
    </div>
  );
}