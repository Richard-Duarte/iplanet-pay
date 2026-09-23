"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
  Center,
} from "@react-three/drei";
import type { Group } from "three";

const MODEL_URL =
  "/models/iphone-18-pro-max/source/apple_iphone_18_pro_max_burgundy.glb";

/** Native GLB ~0.163m tall — scale so phone fills ~65–75% of bracketed frame height. */
const MODEL_SCALE = 7.2;

function IphoneModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <Center>
      <group ref={group} scale={MODEL_SCALE}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.55} />
      {/* Softer key for white Material bg */}
      <directionalLight position={[3.5, 5.5, 2.5]} intensity={0.95} color="#ffffff" />
      {/* Fill */}
      <directionalLight position={[-3, 2, 1]} intensity={0.42} color="#e8eef8" />
      {/* Lavender rim — still readable on white */}
      <directionalLight
        position={[-2.5, 1.5, -4]}
        intensity={0.95}
        color="#c4b5fd"
      />
      <spotLight
        position={[1.5, 4.5, -3]}
        intensity={0.65}
        angle={0.5}
        penumbra={0.75}
        color="#ddd6fe"
      />
      {/* Soft top specular */}
      <spotLight
        position={[0, 5.5, 1.5]}
        intensity={0.55}
        angle={0.35}
        penumbra={0.9}
        color="#f8fafc"
      />
      <Suspense fallback={null}>
        <IphoneModel />
        <Environment preset="studio" environmentIntensity={0.28} />
      </Suspense>
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.18}
        scale={8}
        blur={5.5}
        far={4.5}
        color="#000000"
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={3.8}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.65}
        makeDefault
      />
    </>
  );
}

function CornerBrackets() {
  const arm = "absolute h-9 w-9 border-black/25 md:h-10 md:w-10";
  return (
    <>
      <div className={`${arm} left-5 top-5 border-l border-t md:left-7 md:top-7`} />
      <div className={`${arm} right-5 top-5 border-r border-t md:right-7 md:top-7`} />
      <div className={`${arm} bottom-5 left-5 border-b border-l md:bottom-7 md:left-7`} />
      <div className={`${arm} bottom-5 right-5 border-b border-r md:bottom-7 md:right-7`} />
    </>
  );
}

export default function Iphone3dCanvas() {
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)] md:min-h-[720px] md:h-[780px]">
      {/* Faint concentric rings behind model */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
        aria-hidden
      >
        <div className="h-[78%] w-[78%] rounded-full border border-black/40" />
        <div className="absolute h-[54%] w-[54%] rounded-full border border-black/40" />
        <div className="absolute h-[32%] w-[32%] rounded-full border border-black/40" />
      </div>
      <CornerBrackets />
      <Canvas
        camera={{ position: [0, 0.12, 2.15], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        className="touch-none"
      >
        <Scene />
      </Canvas>
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
        Arraste para girar · pinça para zoom
      </p>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
