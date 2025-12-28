// src/design-tool/preview3d/Tshirt3DPreview.jsx
import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, Center, Environment } from "@react-three/drei";
import { ArrowUp, ArrowRight, Maximize2, RotateCcw, Box, Layers, Backpack } from "lucide-react";

// --- 1. CONFIGURATION ---
// You can update these base values later as mentioned
const MODEL_CONFIGS = {
  "t-shirt": {
    scale: 0.8,
    position: [0, -0.85, 0],
    cameraZ: 0.5,
    meshes: {
      front: "Body_Front_Node",
      back: "Body_Back_Node",
      leftSleeve: "Sleeves_Node",
      rightSleeve: "Sleeves_Node001",
    },
    frontDecal: { x: 0, y: 1.3, z: 0, scale: 0.4 },
    backDecal: { x: 0, y: 1.3, z: 0, scale: 0.4 }
  },
  "mug": {
    scale: 1.5,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    fullWrap: true,
    meshes: { front: "MUG" },
    frontDecal: { x: -0.05, y: -0.6, z: 0, scale: 0.6 },
  },
  "tote": {
    scale: 0.8,
    position: [0, -1.5, 0],
    cameraZ: 2.5,
    meshes: { front: "FRONT", back: "BACK", straps: "STRAPS" },
    frontDecal: { x: 0, y: 1.22, z: -0.13, scale: 4 },
    backDecal: { x: 0, y: 1.22, z: 0.13, scale: 4 }
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
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
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

// In src/design-tool/preview3d/Tshirt3DPreview.jsx

function CalibrationDecal({ texture, x, y, z, scale, depth = 0.5, rotation = [0, 0, 0] }) {
  if (!texture) return null;
  return (
    <>
      {/* Use the 'depth' prop here instead of hardcoding 1.5 */}
      <Decal position={[x, y, z]} rotation={rotation} scale={[scale, scale, depth]} debug={false}>
        <meshBasicMaterial 
          map={texture} 
          transparent 
          depthTest={true} 
          depthWrite={false} 
          polygonOffset 
          polygonOffsetFactor={-4} 
        />
      </Decal>
      {/* Update the helper box to match the new depth */}
      <group position={[x, y, z]} rotation={rotation} scale={[scale, scale, scale]}>
        <axesHelper args={[1.2]} />
        <mesh>
          <boxGeometry args={[1, 1, depth / scale]} /> 
          <meshBasicMaterial wireframe color="yellow" transparent opacity={0.5} />
        </mesh>
      </group>
    </>
  );
}

// --- 3. DYNAMIC MODEL ---
function DynamicModel({ modelUrl, textures, color, frontPos, backPos, config, adjustments }) {
  const { nodes } = useGLTF(modelUrl);
  const m = config.meshes;

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve || textures?.left);
  const rightTex = useDesignTexture(textures?.rightSleeve || textures?.right);

  // ✅ SEPARATE LOGIC FOR FRONT AND BACK
  const finalFront = useMemo(() => ({
    x: adjustments.front.x,
    y: adjustments.front.y,
    z: adjustments.front.z,
    scale: adjustments.front.scale
  }), [frontPos, adjustments.front]);

  const finalBack = useMemo(() => ({
    x: backPos.x + adjustments.back.x,
    y: backPos.y + adjustments.back.y,
    z: backPos.z + adjustments.back.z,
    scale: backPos.scale * adjustments.back.scale
  }), [backPos, adjustments.back]);

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;

    // if (config.fullWrap && tex) {
    //   return (
    //     <group>
    //       <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
    //         <meshStandardMaterial color={color} metalness={0} roughness={0.5} side={THREE.DoubleSide} {...finalFront} />
    //       </mesh>
    //       <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
    //         <meshStandardMaterial color="white" metalness={0} roughness={0.5} map={tex} transparent={false} side={THREE.DoubleSide} />
    //       </mesh>
    //     </group>
    //   );
    // }

    return (
      <mesh geometry={nodes[meshName].geometry} material={nodes[meshName].material} frustumCulled={false} color={color}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {tex && decalProps && <CalibrationDecal texture={tex} {...decalProps} />}
      </mesh>
    );
  };

  return (
    <group position={config.position} scale={config.scale} dispose={null}>

      {/* Front Logic */}
      <RenderPart
        meshName={m.front}
        tex={frontTex}
        decalProps={{
          x: finalFront.x, y: finalFront.y, z: finalFront.z,
          scale: finalFront.scale,
          rotation: [0, 0, 0]
        }}
      />

      {/* Back Logic */}
      {!config.fullWrap && (
        <RenderPart
          meshName={m.back}
          tex={backTex}
          decalProps={{
            x: backPos.x, y: backPos.y, z: backPos.z,
            scale: backPos.scale,
            rotation: [0, Math.PI, 0]
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

// --- 4. EXPORT COMPONENT ---
export default function Tshirt3DPreview({ modelUrl, textures, color = "#ffffff" }) {
  const config = useMemo(() => resolveConfig(modelUrl), [modelUrl]);
  const [cameraZ] = useState(config.cameraZ || 2.5);

  // Base positions from Config
  const [frontPos] = useState(config.frontDecal || { x: 0, y: 0, z: 0.5, scale: 0.5 });
  const [backPos] = useState(config.backDecal || { x: 0, y: 0, z: -0.5, scale: 0.5 });

  // ✅ STATE: Independent adjustments for Front and Back
  const [editSide, setEditSide] = useState("front"); // 'front' | 'back'
  const [adjustments, setAdjustments] = useState({
    front: { x: 0, y: 0, z: 0, scale: 1 },
    back: { x: 0, y: 0, z: 0, scale: 1 }
  });

  // Helper to update the current side's adjustment
  const updateAdjustment = (key, value) => {
    setAdjustments(prev => ({
      ...prev,
      [editSide]: {
        ...prev[editSide],
        [key]: parseFloat(value)
      }
    }));
  };

  const resetCurrentSide = () => {
    setAdjustments(prev => ({
      ...prev,
      [editSide]: { x: 0, y: 0, z: 0, scale: 1 }
    }));
  };

  // Get current values for sliders
  const current = adjustments[editSide];

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#111" }}>

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
            adjustments={adjustments} // Pass full object
          />
        </Center>

        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>

      {/* ✅ UI CONTROLS */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          width: "240px",
          backgroundColor: "rgba(20, 20, 20, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#ccc" }}>3D ALIGNMENT</span>
          <button onClick={resetCurrentSide} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }} title="Reset Side">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* SIDE SELECTOR */}
        <div style={{ display: "flex", background: "#333", borderRadius: "6px", padding: "2px", marginBottom: "8px" }}>
          <button
            onClick={() => setEditSide("front")}
            style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "none", background: editSide === "front" ? "#555" : "transparent", color: "white", fontSize: "11px", cursor: "pointer" }}
          >
            Front
          </button>
          <button
            onClick={() => setEditSide("back")}
            style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "none", background: editSide === "back" ? "#555" : "transparent", color: "white", fontSize: "11px", cursor: "pointer" }}
          >
            Back
          </button>
        </div>

        {/* Vertical Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowUp size={12} /> Vertical (Y)</span>
            <span>{current.y}</span>
          </div>
          <input
            type="range" min="-10" max="10" step="0.1"
            value={current.y}
            onChange={(e) => updateAdjustment('y', e.target.value)}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        {/* Horizontal Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowRight size={12} /> Horizontal (X)</span>
            <span>{current.x * 100}</span>
          </div>
          <input
            type="range" min="-10" max="10" step="0.1"
            value={current.x}
            onChange={(e) => updateAdjustment('x', e.target.value)}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        {/* Depth Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Box size={12} /> Depth (Z)</span>
            <span>{current.z * 100}</span>
          </div>
          <input
            type="range" min="-10" max="10" step="0.1"
            value={current.z}
            onChange={(e) => updateAdjustment('z', e.target.value)}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        {/* Scale Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Maximize2 size={12} /> Scale</span>
            <span>{current.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range" min="0" max="2.5" step="0.01"
            value={current.scale}
            onChange={(e) => updateAdjustment('scale', e.target.value)}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>
      </div>

    </div>
  );
}