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
      front: "Body_Front_Node",
      back: "Body_Back_Node",
      leftSleeve: "Sleeves_Node",
      rightSleeve: "Sleeves_Node001",
    },
    frontDecal: { x: 0, y: 1.3, z: -0.5, scale: 0.5 },
    backDecal: { x: 0, y: 1.3, z: 0.5, scale: 0.5 }
  },
  "mug": {
    scale: 1.5,
    position: [0, -1.5, 0],
    cameraZ: 0.5,
    fullWrap: true,
    meshes: {
      front: "MUG"
    },
    frontDecal: { x: -0.05, y: -0.6, z: 0, scale: 0.6 }, 
    backDecal: { x: 0, y: 0, z: 0, scale: 1 }
  },
  "tote": {
    scale: 0.8,
    position: [0, -1.5, 0],
    cameraZ: 2.5,
    meshes: {
      front: "FRONT",
      back: "BACK",
      straps: "STRAPS"
    },
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

function CalibrationDecal({ texture, x, y, z, scaleX, scaleY, rotation = [0, 0, 0] }) {
  if (!texture) return null;
  return (
    // ✅ REMOVED debug={true}
    <Decal position={[x, y, z]} rotation={rotation} scale={[scaleX, scaleY, 1.5]} debug={false}>
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

  const RenderPart = ({ meshName, tex, decalProps }) => {
    if (!nodes || !nodes[meshName]) return null;

    if (config.fullWrap && tex) {
      useEffect(() => {
        if (tex) {
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; 
          tex.colorSpace = THREE.SRGBColorSpace;
          
          const sx = Math.max(decalProps.scaleX, 0.01);
          const sy = Math.max(decalProps.scaleY, 0.01);
          
          const repeatX = 1 / sx;
          const repeatY = 1 / sy;
          
          tex.repeat.set(repeatX, repeatY);

          tex.offset.x = -decalProps.x + (0.5 - repeatX / 2); 
          tex.offset.y = decalProps.y + (0.5 - repeatY / 2);

          tex.needsUpdate = true;
        }
      }, [tex, decalProps]); 

      return (
        <mesh geometry={nodes[meshName].geometry} frustumCulled={false}>
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
      <RenderPart
        meshName={m.front}
        tex={frontTex}
        decalProps={{
          x: frontPos.x, y: frontPos.y, z: frontPos.z,
          scaleX: frontPos.scaleX, scaleY: frontPos.scaleY, 
          rotation: [0, 0, 0]
        }}
      />

      {!config.fullWrap && (
        <RenderPart
          meshName={m.back}
          tex={backTex}
          decalProps={{
            x: backPos.x, y: backPos.y, z: backPos.z,
            scaleX: backPos.scaleX, scaleY: backPos.scaleY, 
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

// --- 4. EXPORT ---
export default function Tshirt3DPreview({ modelUrl, textures, color = "#ffffff" }) {
  const config = useMemo(() => resolveConfig(modelUrl), [modelUrl]);
  
  // Internal defaults for positions (no longer controlled by UI)
  const [cameraZ] = useState(config.cameraZ || 2.5);
  const [frontPos] = useState(config.frontDecal || { x: 0, y: 0.04, z: 0.15, scaleX: 0.25, scaleY: 0.25 });
  const [backPos] = useState(config.backDecal || { x: 0, y: 0.04, z: 0.15, scaleX: 0.25, scaleY: 0.25 });

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

      {/* 🗑️ REMOVED DEBUG CONTROLS OVERLAY */}
    </div>
  );
}