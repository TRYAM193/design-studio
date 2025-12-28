// src/design-tool/preview3d/Tshirt3DPreview.jsx
import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, Center, Environment } from "@react-three/drei";
import { ArrowUp, ArrowRight, Maximize2, RotateCcw } from "lucide-react"; // Assuming you have lucide-react, or use text

// --- 1. CONFIGURATION ---
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
    // Base positions (The starting "center" point for the design)
    frontDecal: { x: 0, y: 0.12, z: 0.5, scale: 0.5 },
    backDecal: { x: 0, y: 0.12, z: -0.5, scale: 0.5 }
  },
  "mug": {
    scale: 1.5,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    fullWrap: true,
    meshes: { front: "MUG" },
    frontDecal: { x: -0.05, y: -0.6, z: 0, scale: 0.6 },
    backDecal: { x: 0, y: 0, z: 0, scale: 1 }
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
    <Decal position={[x, y, z]} rotation={rotation} scale={[scale, scale, 1.5]} debug={false}>
      <meshBasicMaterial map={texture} transparent depthTest={true} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
    </Decal>
  );
}

// --- 3. DYNAMIC MODEL ---
function DynamicModel({ modelUrl, textures, color, frontPos, backPos, config, posAdjust, scaleAdjust }) {
  const { nodes } = useGLTF(modelUrl);
  const m = config.meshes;

  const frontTex = useDesignTexture(textures?.front);
  const backTex = useDesignTexture(textures?.back);
  const leftTex = useDesignTexture(textures?.leftSleeve || textures?.left);
  const rightTex = useDesignTexture(textures?.rightSleeve || textures?.right);

  // ✅ HELPER: Combine Base Config + User Adjustments
  const getFinalPos = (base) => {
    return {
      x: base.x + posAdjust.x,
      y: base.y + posAdjust.y,
      z: base.z,
      scale: base.scale * scaleAdjust
    };
  };

  const finalFront = getFinalPos(frontPos);
  const finalBack = getFinalPos(backPos);

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;

    // Full Wrap Logic (Mugs) - Ignores standard decal positioning logic
    if (config.fullWrap && tex) {
      return (
        <group>
          <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
            <meshStandardMaterial color={color} metalness={0} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
            <meshStandardMaterial color="white" metalness={0} roughness={0.5} map={tex} transparent={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    }

    // Standard Decal Logic (T-Shirts)
    return (
      <mesh geometry={nodes[meshName].geometry} material={nodes[meshName].material} frustumCulled={false} color={color}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {tex && decalProps && <CalibrationDecal texture={tex} {...decalProps} />}
      </mesh>
    );
  };

  return (
    <group position={config.position} scale={config.scale} dispose={null}>
      {/* Front */}
      <RenderPart
        meshName={m.front}
        tex={frontTex}
        decalProps={{
          x: finalFront.x, y: finalFront.y, z: finalFront.z,
          scale: finalFront.scale,
          rotation: [0, 0, 0]
        }}
      />

      {/* Back */}
      {!config.fullWrap && (
        <RenderPart
          meshName={m.back}
          tex={backTex}
          decalProps={{
            x: finalBack.x, y: finalBack.y, z: finalBack.z,
            scale: finalBack.scale,
            rotation: [0, Math.PI, 0] // Rotate 180 for back
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
  
  // Base positions
  const [frontPos] = useState(config.frontDecal || { x: 0, y: 0, z: 0.5, scale: 0.5 });
  const [backPos] = useState(config.backDecal || { x: 0, y: 0, z: -0.5, scale: 0.5 });

  // ✅ LOCAL STATE: Independent 3D Adjustments
  const [posAdjust, setPosAdjust] = useState({ x: 0, y: 0 }); // X = Horizontal, Y = Vertical
  const [scaleAdjust, setScaleAdjust] = useState(1);

  const resetAdjustments = () => {
    setPosAdjust({ x: 0, y: 0 });
    setScaleAdjust(1);
  };

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#111" }}>
      
      {/* 3D CANVAS */}
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
            // Pass live adjustments
            posAdjust={posAdjust}
            scaleAdjust={scaleAdjust}
          />
        </Center>

        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>

      {/* ✅ UI CONTROLS OVERLAY (Inside 3D View) */}
      <div 
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          width: "220px",
          backgroundColor: "rgba(20, 20, 20, 0.8)",
          backdropFilter: "blur(8px)",
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
          <button onClick={resetAdjustments} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Vertical Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowUp size={12}/> Vertical</span>
            <span>{Math.round(posAdjust.y * 100)}</span>
          </div>
          <input 
            type="range" min="-0.3" max="0.3" step="0.01" 
            value={posAdjust.y}
            onChange={(e) => setPosAdjust(p => ({ ...p, y: parseFloat(e.target.value) }))}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        {/* Horizontal Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowRight size={12}/> Horizontal</span>
            <span>{Math.round(posAdjust.x * 100)}</span>
          </div>
          <input 
            type="range" min="-0.2" max="0.2" step="0.01" 
            value={posAdjust.x}
            onChange={(e) => setPosAdjust(p => ({ ...p, x: parseFloat(e.target.value) }))}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        {/* Scale Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Maximize2 size={12}/> Scale</span>
            <span>{scaleAdjust.toFixed(2)}x</span>
          </div>
          <input 
            type="range" min="0.5" max="2.5" step="0.1" 
            value={scaleAdjust}
            onChange={(e) => setScaleAdjust(parseFloat(e.target.value))}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>
      </div>

    </div>
  );
}