"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bounds,
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
  Center,
} from "@react-three/drei";
import type { Group } from "three";

const MODEL_URL =
  "/models/iphone-18-pro-max/source/apple_iphone_18_pro_max_burgundy.glb";

function IphoneModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <Center>
      <group ref={group} scale={3.2}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 2]} intensity={1.5} color="#ffffff" />
      <directionalLight
        position={[-4, 2, -2]}
        intensity={0.6}
        color="#88aaff"
      />
      <spotLight
        position={[0, 6, 2]}
        intensity={1.35}
        angle={0.45}
        penumbra={0.6}
        color="#e8f2fc"
      />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.05}>
          <IphoneModel />
        </Bounds>
        <Environment preset="studio" />
      </Suspense>
      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.55}
        scale={12}
        blur={2.8}
        far={5}
        color="#000000"
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.35}
        maxDistance={4.2}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.55}
        makeDefault
      />
    </>
  );
}

function CornerBrackets() {
  const arm = "absolute h-8 w-8 border-white/70";
  return (
    <>
      <div className={`${arm} left-4 top-4 border-l border-t md:left-6 md:top-6`} />
      <div className={`${arm} right-4 top-4 border-r border-t md:right-6 md:top-6`} />
      <div className={`${arm} bottom-4 left-4 border-b border-l md:bottom-6 md:left-6`} />
      <div className={`${arm} bottom-4 right-4 border-b border-r md:bottom-6 md:right-6`} />
    </>
  );
}

export default function Iphone3dCanvas() {
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:min-h-[720px] md:h-[780px]">
      {/* faint concentric rings */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12]"
        aria-hidden
      >
        <div className="h-[70%] w-[70%] rounded-full border border-white" />
        <div className="absolute h-[48%] w-[48%] rounded-full border border-white" />
        <div className="absolute h-[28%] w-[28%] rounded-full border border-white" />
      </div>
      <CornerBrackets />
      <Canvas
        camera={{ position: [0, 0.1, 2.35], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        className="touch-none"
      >
        <Scene />
      </Canvas>
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        Arraste para girar · pinça para zoom
      </p>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
