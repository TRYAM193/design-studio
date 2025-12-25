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
    cameraZ: 0.5,
    meshes: {
      // ✅ RETAIN YOUR MESH NAMES HERE
      front: "Body_Front_Node",
      back: "Body_Back_Node",
      leftSleeve: "Sleeves_Node",
      rightSleeve: "Sleeves_Node001",
    },
    // 🆕 NEW: Default Decal Positions (Adjust these using the sliders)
    frontDecal: { x: 0, y: 1.25, z: -0.5, scale: 0.5 },
    backDecal: { x: 0, y: 1.25, z: 0.5, scale: 0.5 }
  },
  "mug": {
    scale: 1.5,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    fullWrap: true,
    meshes: {
      // ✅ RETAINED: Single mesh name as you requested
      front: "MUG"
    },
    // Mugs need specific rotation logic usually, but here is the position baseline
    frontDecal: { x: -1.03, y: -0.44, z: 0, scale: 0.6 }, 
    backDecal: { x: 0, y: 0, z: 0, scale: 1 }
  },
  "tote": {
    scale: 0.08,
    position: [0, -1.5, 0],
    cameraZ: 1.5,
    meshes: {
      front: "Bag_Front",
      back: "Bag_Back",
      straps: "Bag_Straps"
    },
    frontDecal: { x: 0, y: -5, z: 2, scale: 5 },
    backDecal: { x: 0, y: -5, z: -2, scale: 5 }
  }
};

const resolveConfig = (url) => {
  if (!url) return MODEL_CONFIGS["t-shirt"];
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
    <Decal position={[x, y, z]} rotation={rotation} scale={[scale, scale, 1.5]} debug={true}>
      <meshBasicMaterial map={texture} transparent depthTest={true} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
    </Decal>
  );
}

// --- 3. MAIN MODEL ---
function DynamicModel({ modelUrl, textures, color, frontPos, backPos, config }) {
  const { nodes, materials } = useGLTF(modelUrl);
  const m = config.meshes;

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve || textures?.left);
  const rightTex = useDesignTexture(textures?.rightSleeve || textures?.right);

 // ... inside DynamicModel ...

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;

    // 1. FULL WRAP MODE (MUG) - Now Interactive! 🎛️
    if (config.fullWrap && tex) {
      useEffect(() => {
        if (tex) {
          // A. Setup Texture for Manipulation
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping; // Allows infinite scrolling
          tex.colorSpace = THREE.SRGBColorSpace;
          
          // B. Calculate Scale (Zoom)
          // Slider Scale 1 = 1x Zoom. 
          // We invert it (1/scale) because in UV mapping, smaller "repeat" = larger image.
          // Safety: ensure scale isn't 0 to avoid Infinity.
          const s = decalProps.scale || 1; 
          const repeatVal = 1 / Math.max(s, 0.01); 
          tex.repeat.set(repeatVal, repeatVal);

          // C. Calculate Position (Pan)
          // We apply the offset. 
          // Optional Math: "+ (0.5 - repeatVal / 2)" keeps the zoom centered!
          tex.offset.x = -decalProps.x + (0.5 - repeatVal / 2); 
          tex.offset.y = decalProps.y + (0.5 - repeatVal / 2);

          tex.needsUpdate = true;
        }
      }, [tex, decalProps]); // 👈 Re-run whenever sliders change

      return (
        <mesh
          geometry={nodes[meshName].geometry} 
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="white"
            metalness={0}
            roughness={0.5}
            map={tex}
            transparent={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }

    // 2. STANDARD DECAL MODE (T-Shirts) - Unchanged
    return (
      <mesh
        geometry={nodes[meshName].geometry}
        material={nodes[meshName].material}
        frustumCulled={false}
      >
        <meshStandardMaterial color={color} roughness={0.7} />
        {tex && decalProps && <CalibrationDecal texture={tex} {...decalProps} />}
      </mesh>
    );
  };
  return (
    <group position={config.position} scale={config.scale} dispose={null}>
      {/* 🆕 UPDATED: Uses dynamic frontPos for Front Texture */}
      {/* Front / Body (This becomes the Full Wrap for Mugs) */}
      <RenderPart
        meshName={m.front}
        tex={frontTex}
        decalProps={{
          x: frontPos.x, y: frontPos.y, z: frontPos.z,
          scale: frontPos.scale, rotation: [0, 0, 0]
        }}
      />

      {/* 👇 EDIT THIS: Only show separate Back Decal if NOT full wrap */}
      {!config.fullWrap && (
        <RenderPart
          meshName={m.back}
          tex={backTex}
          decalProps={{
            x: backPos.x, y: backPos.y, z: backPos.z,
            scale: backPos.scale, rotation: [0, Math.PI, 0]
          }}
        />
      )}

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
  const config = useMemo(() => resolveConfig(modelUrl), [modelUrl]);
  const [activeTab, setActiveTab] = useState("camera");

  // Initialize state from the Config (defaults)
  const [cameraZ, setCameraZ] = useState(config.cameraZ || 2.5);
  const [frontPos, setFrontPos] = useState(config.frontDecal || { x: 0, y: 0.04, z: 0.15, scale: 0.25 });
  const [backPos, setBackPos] = useState(config.backDecal || { x: 0, y: 0.04, z: 0.15, scale: 0.25 });

  // Reset when model changes
  useEffect(() => {
    setCameraZ(config.cameraZ || 2.5);
    setFrontPos(config.frontDecal || { x: 0, y: 0.04, z: 0.15, scale: 0.25 });
    setBackPos(config.backDecal || { x: 0, y: 0.04, z: 0.15, scale: 0.25 });
  }, [config]);

  const updateFront = (key, val) => setFrontPos(p => ({ ...p, [key]: parseFloat(val) }));
  const updateBack = (key, val) => setBackPos(p => ({ ...p, [key]: parseFloat(val) }));

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas fov={45} camera={{ position: [0, 0, cameraZ], near: 0.1, far: 1000 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <directionalLight position={[0, 5, -10]} intensity={0.8} />
        <Environment preset="city" />

        <CameraRig z={cameraZ} />

        <Center>
          <DynamicModel
            modelUrl={modelUrl}
            textures={textures}
            color={color}
            frontPos={frontPos}
            backPos={backPos}
            config={config}
          />
        </Center>

        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>

      {/* 🛠 DEBUG CONTROLS */}
      <div className="absolute top-4 right-4 bg-zinc-900/90 text-white p-4 rounded-xl shadow-2xl border border-zinc-700 w-72 z-50 backdrop-blur-md">

        <div className="flex bg-zinc-800 p-1 rounded-lg mb-4">
          {['camera', 'front', 'back'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-xs font-bold uppercase rounded-md transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'camera' && (
            <div>
              <div className="flex justify-between mb-1 text-xs font-mono text-zinc-400">
                <span>ZOOM (Z)</span><span>{cameraZ.toFixed(2)}</span>
              </div>
              <input type="range" min="0.5" max="8" step="0.1" value={cameraZ} onChange={(e) => setCameraZ(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}

          {activeTab === 'front' && ['x', 'y', 'z', 'scale'].map(axis => (
            <div key={axis}>
              <div className="flex justify-between mb-1 text-xs font-mono text-zinc-400">
                <span className="uppercase">{axis}</span><span>{frontPos[axis].toFixed(2)}</span>
              </div>
              <input type="range" min={axis === 'scale' ? "0.1" : "-2"} max={axis === 'scale' ? "5" : "2"} step="0.01" value={frontPos[axis]} onChange={(e) => updateFront(axis, e.target.value)} className="w-full accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          ))}

          {activeTab === 'back' && ['x', 'y', 'z', 'scale'].map(axis => (
            <div key={axis}>
              <div className="flex justify-between mb-1 text-xs font-mono text-zinc-400">
                <span className="uppercase">{axis}</span><span>{backPos[axis].toFixed(2)}</span>
              </div>
              <input type="range" min={axis === 'scale' ? "0.1" : "-200"} max={axis === 'scale' ? "5" : "2"} step="0.01" value={backPos[axis]} onChange={(e) => updateBack(axis, e.target.value)} className="w-full accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}