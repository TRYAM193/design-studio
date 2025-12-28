import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Decal, Center, Environment } from "@react-three/drei";
import { ArrowUp, ArrowRight, Maximize2, RotateCcw, Box, ArrowLeftRight, ArrowUpDown } from "lucide-react"; 

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
    frontDecal: { x: 0, y: 1.3, z: 0, scaleX: 0.4, scaleY: 0.4 },
    backDecal: { x: 0, y: 1.3, z: 0, scaleX: 0.4, scaleY: 0.4 },
    decalDepth: 0.6
  },
  "mug": {
    scale: 1.5,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    fullWrap: true, // Uses UV Mapping
    meshes: { front: "MUG" },
    frontDecal: { x: -0.1, y: -2.5, scaleX: 0.7, scaleY: 0.28 }, 
  },
  "tote": {
    scale: 0.8,
    position: [0, -1.5, 0],
    cameraZ: 2.5,
    meshes: { front: "FRONT", back: "BACK", straps: "STRAPS" },
    frontDecal: { x: 0, y: 1.2, z: -0.13, scaleX: 0.5, scaleY: 0.5 },
    backDecal: { x: 0, y: 1.2, z: 0.13, scaleX: 0.5, scaleY: 0.5 },
    decalDepth: 0.6
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
      // Clamp to edge is crucial for the mug to stop "multiple objects" ghosting
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
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

// Updated to handle scaleX and scaleY independently
function CalibrationDecal({ texture, x, y, z, scaleX, scaleY, depth = 0.6, rotation = [0, 0, 0] }) {
  if (!texture) return null;
  return (
    <>
      <Decal position={[x, y, z]} rotation={rotation} scale={[scaleX, scaleY, depth]} debug={false}>
        <meshBasicMaterial map={texture} transparent depthTest={true} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
      </Decal>
      <group position={[x, y, z]} rotation={rotation} scale={[scaleX, scaleY, 1]}>
        <mesh>
          <boxGeometry args={[1, 1, depth]} />
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

  // Merge Base Config with Live Adjustments
  const finalFront = useMemo(() => ({
    x: adjustments.front.x,
    y: adjustments.front.y,
    z: adjustments.front.z,
    scaleX: (frontPos.scaleX || 1) * adjustments.front.scaleX,
    scaleY: (frontPos.scaleY || 1) * adjustments.front.scaleY
  }), [frontPos, adjustments.front]);

  const finalBack = useMemo(() => ({
    x: backPos.x + adjustments.back.x,
    y: backPos.y + adjustments.back.y,
    z: backPos.z + adjustments.back.z,
    scaleX: (backPos.scaleX || 1) * adjustments.back.scaleX,
    scaleY: (backPos.scaleY || 1) * adjustments.back.scaleY
  }), [backPos, adjustments.back]);

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;
    
    // --- MUG / FULL WRAP LOGIC (UV MAPPING) ---
    if (config.fullWrap && tex) {
      if (decalProps) {
        tex.center.set(0.5, 0.5); 
        
        // Handle Independent Scaling (Width / Height)
        // Note: In UV mapping, larger repeat number = smaller image. So we invert (1 / scale).
        const repeatX = 1 / Math.max(decalProps.scaleX, 0.1);
        const repeatY = 1 / Math.max(decalProps.scaleY, 0.1);
        
        tex.repeat.set(repeatX, repeatY);
        tex.offset.set(decalProps.x * -0.5, decalProps.y * 0.5); 
        tex.needsUpdate = true;
      }

      return (
        <group>
          <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
            <meshStandardMaterial color={color} metalness={0} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
            <meshStandardMaterial color="white" metalness={0} roughness={0.5} map={tex} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    }

    // --- T-SHIRT / DECAL LOGIC ---
    return (
      <mesh geometry={nodes[meshName].geometry} material={nodes[meshName].material} frustumCulled={false} color={color}>
        <meshStandardMaterial color={color} roughness={0.7} />
        {tex && decalProps && (
          <CalibrationDecal 
            texture={tex} 
            depth={config.decalDepth} 
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
        decalProps={{
          x: finalFront.x, y: finalFront.y, z: finalFront.z,
          scaleX: finalFront.scaleX, scaleY: finalFront.scaleY,
          rotation: [0, 0, 0]
        }}
      />

      {/* Back */}
      {!config.fullWrap && (
        <RenderPart
          meshName={m.back}
          tex={backTex}
          decalProps={{
            x: backPos.x, y: backPos.y, z: backPos.z,
            scaleX: finalBack.scaleX, scaleY: finalBack.scaleY,
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
  
  // Base positions
  const [frontPos] = useState(config.frontDecal || { x: 0, y: 0, z: 0.5, scaleX: 1, scaleY: 1 });
  const [backPos] = useState(config.backDecal || { x: 0, y: 0, z: -0.5, scaleX: 1, scaleY: 1 });

  const [editSide, setEditSide] = useState("front");
  
  // ✅ STATE: Now tracking scaleX and scaleY separately
  const [adjustments, setAdjustments] = useState({
    front: { x: 0, y: 0, z: 0, scaleX: 1, scaleY: 1 },
    back: { x: 0, y: 0, z: 0, scaleX: 1, scaleY: 1 }
  });

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
      [editSide]: { x: 0, y: 0, z: 0, scaleX: 1, scaleY: 1 }
    }));
  };

  const current = adjustments[editSide];

  if (!modelUrl) return <div>No 3D Model URL provided</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#111" }}>
      
      <Canvas fov={45} camera={{ position: [0, 0, cameraZ], near: 0.1, far: 1000 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
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
            adjustments={adjustments}
          />
        </Center>
        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
      </Canvas>

      {/* ✅ UPDATED UI CONTROLS */}
      <div 
        style={{
          position: "absolute", bottom: "20px", right: "20px", width: "240px",
          backgroundColor: "rgba(20, 20, 20, 0.9)", backdropFilter: "blur(10px)",
          padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", display: "flex", flexDirection: "column", gap: "12px", zIndex: 10
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#ccc" }}>3D ALIGNMENT</span>
          <button onClick={resetCurrentSide} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>

        <div style={{ display: "flex", background: "#333", borderRadius: "6px", padding: "2px" }}>
          <button onClick={() => setEditSide("front")} style={{ flex: 1, padding: "6px", background: editSide === "front" ? "#555" : "transparent", color: "white", fontSize: "11px", border: "none", cursor: "pointer" }}>Front</button>
          <button onClick={() => setEditSide("back")} style={{ flex: 1, padding: "6px", background: editSide === "back" ? "#555" : "transparent", color: "white", fontSize: "11px", border: "none", cursor: "pointer" }}>Back</button>
        </div>

        {/* Vertical Position */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowUp size={12}/> Vertical (Y)</span>
            <span>{current.y}</span>
          </div>
          <input type="range" min="-10" max="10" step="0.1" value={current.y} onChange={(e) => updateAdjustment('y', e.target.value)} style={{ width: "100%", cursor: "pointer" }} />
        </div>

        {/* Horizontal Position */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowRight size={12}/> Horizontal (X)</span>
            <span>{current.x}</span>
          </div>
          <input type="range" min="-10" max="10" step="0.1" value={current.x} onChange={(e) => updateAdjustment('x', e.target.value)} style={{ width: "100%", cursor: "pointer" }} />
        </div>

        <hr style={{ borderColor: "#333", margin: "4px 0" }} />

        {/* Width Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowLeftRight size={12}/> Width</span>
            <span>{current.scaleX.toFixed(2)}x</span>
          </div>
          <input type="range" min="0.1" max="4.0" step="0.01" value={current.scaleX} onChange={(e) => updateAdjustment('scaleX', e.target.value)} style={{ width: "100%", cursor: "pointer" }} />
        </div>

        {/* Height Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowUpDown size={12}/> Height</span>
            <span>{current.scaleY.toFixed(2)}x</span>
          </div>
          <input type="range" min="0.1" max="4.0" step="0.01" value={current.scaleY} onChange={(e) => updateAdjustment('scaleY', e.target.value)} style={{ width: "100%", cursor: "pointer" }} />
        </div>

      </div>
    </div>
  );
}