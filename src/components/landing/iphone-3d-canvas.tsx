"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
  Center,
} from "@react-three/drei";
import { X } from "lucide-react";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const MODEL_URL =
  "/models/iphone-18-pro-max/source/apple_iphone_18_pro_max_burgundy.glb";

/** Native GLB ~0.163m tall — scale so phone fills ~65–75% of bracketed frame height. */
const MODEL_SCALE = 7.2;

function prefersFullscreenExplore() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

function IphoneModel({ spinning }: { spinning: boolean }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (!group.current || !spinning) return;
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

function Scene({
  controlsEnabled,
  onUserInteract,
}: {
  controlsEnabled: boolean;
  onUserInteract: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.enabled = controlsEnabled;
    if (!controlsEnabled) {
      controls.reset();
    }
  }, [controlsEnabled]);

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.5, 5.5, 2.5]} intensity={0.95} color="#ffffff" />
      <directionalLight position={[-3, 2, 1]} intensity={0.42} color="#e8eef8" />
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
      <spotLight
        position={[0, 5.5, 1.5]}
        intensity={0.55}
        angle={0.35}
        penumbra={0.9}
        color="#f8fafc"
      />
      <Suspense fallback={null}>
        <IphoneModel spinning={!controlsEnabled} />
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
        ref={controlsRef}
        enabled={controlsEnabled}
        enablePan={false}
        minDistance={1.6}
        maxDistance={3.8}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.65}
        makeDefault
        onStart={onUserInteract}
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

function ViewerFrame({
  shellClassName,
  controlsEnabled,
  onActivate,
  onUserInteract,
  showExploreOverlay,
  footerHint,
}: {
  shellClassName: string;
  controlsEnabled: boolean;
  onActivate: () => void;
  onUserInteract: () => void;
  showExploreOverlay: boolean;
  footerHint?: ReactNode;
}) {
  const lastTapRef = useRef(0);
  const fireActivate = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;
    onActivate();
  };

  return (
    <div
      className={`relative overflow-hidden ${shellClassName}`}
      data-lenis-prevent
      data-lenis-prevent-touch
    >
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
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        className={controlsEnabled ? "touch-none" : "touch-pan-y"}
        style={{ pointerEvents: controlsEnabled ? "auto" : "none" }}
      >
        <Scene controlsEnabled={controlsEnabled} onUserInteract={onUserInteract} />
      </Canvas>

      {showExploreOverlay ? (
        <button
          type="button"
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-3 bg-transparent text-center touch-manipulation"
          data-lenis-prevent
          data-lenis-prevent-touch
          onClick={(e) => {
            e.stopPropagation();
            fireActivate();
          }}
          onPointerUp={(e) => {
            if (e.pointerType === "touch") {
              e.stopPropagation();
              fireActivate();
            }
          }}
          aria-label="Clique para explorar o modelo 3D"
        >
          <span className="rounded-full border border-black/10 bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#111] shadow-[0_8px_28px_rgba(17,17,17,0.12)] backdrop-blur-sm">
            Clique para explorar
          </span>
          <span className="pointer-events-none px-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
            Depois arraste para girar · pinça para zoom
          </span>
        </button>
      ) : null}

      {footerHint}
    </div>
  );
}

function MobileFullscreenModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("iphone-3d-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove("iphone-3d-modal-open");
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Explorar iPhone 18 Pro Max em 3D"
          className="fixed inset-0 z-[200] flex flex-col bg-white"
          data-lenis-prevent
          data-lenis-prevent-touch
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold text-[#111]">iPhone 18 Pro Max</p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#111] shadow-sm touch-manipulation"
              aria-label="Fechar visualização 3D"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ViewerFrame
            shellClassName="min-h-0 flex-1 rounded-none border-0 shadow-none"
            controlsEnabled
            onActivate={() => {}}
            onUserInteract={() => {}}
            showExploreOverlay={false}
            footerHint={
              <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-10 px-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Arraste com o dedo para girar · pinça para zoom
              </p>
            }
          />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default function Iphone3dCanvas() {
  const isMobile = useIsMobile();
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [desktopActive, setDesktopActive] = useState(false);

  const activate = useCallback(() => {
    if (prefersFullscreenExplore()) {
      setMobileModalOpen(true);
    } else {
      setDesktopActive(true);
    }
  }, []);

  const deactivateDesktop = useCallback(() => {
    setDesktopActive(false);
  }, []);

  useEffect(() => {
    if (!desktopActive || isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopActive, isMobile]);

  const inlineShellClass =
    "min-h-[70vh] w-full rounded-[28px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)] md:min-h-[720px] md:h-[780px]";

  return (
    <>
      <div
        className="relative w-full"
        onPointerLeave={isMobile ? undefined : deactivateDesktop}
        onBlur={isMobile ? undefined : deactivateDesktop}
      >
        <ViewerFrame
          shellClassName={inlineShellClass}
          controlsEnabled={!isMobile && desktopActive}
          onActivate={activate}
          onUserInteract={() => setDesktopActive(true)}
          showExploreOverlay={isMobile || !desktopActive}
          footerHint={
            !isMobile && desktopActive ? (
              <p className="pointer-events-none absolute bottom-5 left-0 right-0 z-10 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
                Arraste para girar · Esc ou saia da área para liberar o scroll
              </p>
            ) : null
          }
        />
      </div>

      <MobileFullscreenModal
        open={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </>
  );
}

useGLTF.preload(MODEL_URL);
