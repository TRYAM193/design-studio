// src/design-tool/preview3d/Tshirt3DPreview.jsx
import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, Center, Environment } from "@react-three/drei";

// --- 1. CONFIGURATION ---
const MODEL_CONFIGS = {
  "t-shirt": {
    scale: 0.8,
    position: [0, -0.85, 0],
    cameraZ: 0.6, // Default T-shirt Zoom
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
    cameraZ: 2.2,
    meshes: {
      front: "Oversized_front",
      back: "Oversized_back"
    }
  },
  "hoodie": {
    scale: 0.8,
    position: [0, -0.85, 0],
    cameraZ: 2.2,
    meshes: {
      front: "Hoodie_front",
      back: "Hoodie_back",
      hood: "Hoodie_hood",
      leftSleeve: "Hoodie_left_sleeve",
      rightSleeve: "Hoodie_right_sleeve"
    }
  },
  "mug": {
    scale: 0.003,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    meshes: {
      front: "MUG",
      handle: "Mug_Handle"
    }
  },
  "tote": {
    scale: 0.08,
    position: [0, -1.5, 0],
    cameraZ: 0.6,
    meshes: {
      front: "Bag_Front",
      back: "Bag_Back",
      straps: "Bag_Straps"
    }
  }
};

const resolveConfig = (url) => {
  if (!url) return MODEL_CONFIGS["t-shirt"];
  if (url.includes("hoodie")) return MODEL_CONFIGS["hoodie"];
  if (url.includes("oversized")) return MODEL_CONFIGS["oversized"];
  if (url.includes("mug")) return MODEL_CONFIGS["mug"];
  if (url.includes("tote")) return MODEL_CONFIGS["tote"];
  return MODEL_CONFIGS["t-shirt"];
};

// --- 2. HELPERS ---
function useDesignTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) { setTexture(null); return; }
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

// ✅ NEW: Camera Rig to handle dynamic slider updates
function CameraRig({ z }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.z = z;
    camera.updateProjectionMatrix();
  }, [z, camera]);
  return null;
}

function CalibrationDecal({ texture, x, y, z, scale, rotation = [0, 0, 0] }) {
  if (!texture) return null;
  return (
    <Decal position={[x, y, z]} rotation={rotation} scale={[scale, scale, 1.5]}>
      <meshBasicMaterial map={texture} transparent depthTest={true} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
    </Decal>
  );
}

// --- 3. MAIN MODEL ---
function DynamicModel({ modelUrl, textures, color, controls, config }) {
  const { nodes, materials } = useGLTF(modelUrl);
  const m = config.meshes;

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve || textures?.left);
  const rightTex = useDesignTexture(textures?.rightSleeve || textures?.right);

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;
    return (
      <mesh geometry={nodes[meshName].geometry} material={nodes[meshName].material}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {tex && decalProps && <CalibrationDecal texture={tex} {...decalProps} />}
      </mesh>
    );
  };

  return (
    <group position={config.position} scale={config.scale} dispose={null}>
      <RenderPart meshName={m.front} tex={frontTex} decalProps={{ x: 0, y: 1.25, z: 0.5, scale: 0.5 }} />
      <RenderPart meshName={m.back} tex={backTex} decalProps={{ x: controls.x, y: controls.y, z: controls.z, scale: controls.scale, rotation: [0, Math.PI, 0] }} />
      <RenderPart meshName={m.leftSleeve} tex={leftTex} />
      <RenderPart meshName={m.rightSleeve} tex={rightTex} />
      <RenderPart meshName={m.hood} />
      <RenderPart meshName={m.handle} />
      <RenderPart meshName={m.straps} />
      {(!m.front || !nodes[m.front]) && <primitive object={nodes.Scene || nodes.root} />}
    </group>
  );
}

// --- 4. EXPORT ---
export default function Tshirt3DPreview({ modelUrl, textures, color = "#ffffff" }) {
  // Initial config resolution
  const config = useMemo(() => resolveConfig(modelUrl), [modelUrl]);

  // State now includes cameraZ
  const [controls, setControls] = useState({
    x: 0, y: 1.25, z: 0.5, scale: 0.5,
    cameraZ: config.cameraZ || 2.5 // Initialize from config
  });

  // Reset controls when model changes
  useEffect(() => {
    setControls(prev => ({ ...prev, cameraZ: config.cameraZ || 2.5 }));
  }, [config]);

  const updateControl = (key, value) => {
    setControls(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas fov={45}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <directionalLight position={[0, 5, -10]} intensity={0.8} />
        <Environment preset="city" />

        {/* ✅ The Camera Rig updates the camera when slider moves */}
        <CameraRig z={controls.cameraZ} />

        <Center>
          <DynamicModel
            modelUrl={modelUrl}
            textures={textures}
            color={color}
            controls={controls}
            config={config}
          />
        </Center>

        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>

      {/* 🛠 DEBUG CONTROLS */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded text-xs w-64 z-50">
        <h3 className="font-bold mb-2 border-b border-gray-600 pb-1">Camera Zoom</h3>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <label>Distance (Z)</label>
            <span className="text-gray-400">{controls.cameraZ.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.5" max="8" step="0.1"
            value={controls.cameraZ}
            onChange={(e) => updateControl('cameraZ', e.target.value)}
            className="w-full accent-indigo-500"
          />
        </div>

        {textures?.back && (
          <>
            <h3 className="font-bold mb-2 border-b border-gray-600 pb-1">Back Decal Calibration</h3>
            {['x', 'y', 'z', 'scale'].map(axis => (
              <div key={axis} className="mb-2">
                <div className="flex justify-between mb-1">
                  <label className="capitalize">{axis}</label>
                  <span className="text-gray-400">{controls[axis].toFixed(2)}</span>
                </div>
                <input
                  type="range" min="-2" max="2" step="0.01"
                  value={controls[axis]}
                  onChange={(e) => updateControl(axis, e.target.value)}
                  className="w-full accent-indigo-500"
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}