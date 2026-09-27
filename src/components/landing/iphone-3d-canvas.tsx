"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
  Center,
} from "@react-three/drei";
import { X } from "lucide-react";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const MODEL_URL =
  "/models/iphone-18-pro-max/source/apple_iphone_18_pro_max_burgundy.glb";

type ViewProfile = {
  modelScale: number;
  modelYOffset: number;
  camera: { position: [number, number, number]; fov: number };
  orbit: { minDistance: number; maxDistance: number };
  shadowY: number;
};

const DESKTOP_VIEW: ViewProfile = {
  modelScale: 7.2,
  modelYOffset: 0,
  camera: { position: [0, 0.12, 2.15], fov: 36 },
  orbit: { minDistance: 1.6, maxDistance: 3.8 },
  shadowY: -1.2,
};

/** Mobile: câmera mais perto + escala maior para preencher o grid. */
const MOBILE_VIEW: ViewProfile = {
  modelScale: 12.8,
  modelYOffset: -0.22,
  camera: { position: [0, 0.08, 1.38], fov: 40 },
  orbit: { minDistance: 1.05, maxDistance: 2.6 },
  shadowY: -1.05,
};

const INLINE_SHELL_CLASS =
  "min-h-[min(78vh,110vw)] w-full rounded-[28px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)] max-md:aspect-[4/5] max-md:min-h-[min(82vh,120vw)] md:min-h-[720px] md:h-[780px] md:max-h-none md:aspect-auto";

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return coarse;
}

function IphoneModel({
  spinning,
  view,
}: {
  spinning: boolean;
  view: ViewProfile;
}) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (!group.current || !spinning) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <Center>
      <group
        ref={group}
        scale={view.modelScale}
        position={[0, view.modelYOffset, 0]}
      >
        <primitive object={scene} />
      </group>
    </Center>
  );
}

function Scene({
  controlsEnabled,
  onUserInteract,
  view,
}: {
  controlsEnabled: boolean;
  onUserInteract: () => void;
  view: ViewProfile;
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
      <Suspense
        fallback={
          <Html center>
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#111] shadow-md">
              Carregando modelo…
            </span>
          </Html>
        }
      >
        <IphoneModel spinning={!controlsEnabled} view={view} />
        <Environment preset="studio" environmentIntensity={0.28} />
      </Suspense>
      <ContactShadows
        position={[0, view.shadowY, 0]}
        opacity={0.18}
        scale={view.modelScale > 10 ? 10 : 8}
        blur={5.5}
        far={4.5}
        color="#000000"
      />
      <OrbitControls
        ref={controlsRef}
        enabled={controlsEnabled}
        enablePan={false}
        minDistance={view.orbit.minDistance}
        maxDistance={view.orbit.maxDistance}
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

function ExploreButtons({ onActivate }: { onActivate: () => void }) {
  const lastTapRef = useRef(0);
  const fireActivate = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;
    onActivate();
  };

  const bind = {
    "data-lenis-prevent": true,
    "data-lenis-prevent-touch": true,
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      fireActivate();
    },
    onPointerUp: (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        e.stopPropagation();
        fireActivate();
      }
    },
  };

  return (
    <>
      {/* Desktop: overlay central */}
      <button
        type="button"
        className="absolute inset-0 z-20 hidden cursor-pointer flex-col items-center justify-center gap-3 bg-transparent text-center touch-manipulation md:flex"
        aria-label="Clique para explorar o modelo 3D"
        {...bind}
      >
        <span className="rounded-full border border-black/10 bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#111] shadow-[0_8px_28px_rgba(17,17,17,0.12)] backdrop-blur-sm">
          Clique para explorar
        </span>
        <span className="pointer-events-none px-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
          Depois arraste para girar · pinça para zoom
        </span>
      </button>

      {/* Mobile: chip embaixo — modelo visível acima */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4 md:hidden">
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-black/10 bg-white/95 px-5 py-2.5 text-sm font-semibold text-[#111] shadow-[0_8px_28px_rgba(17,17,17,0.12)] backdrop-blur-sm touch-manipulation"
          aria-label="Abrir modelo 3D em tela cheia"
          {...bind}
        >
          Clique para explorar
        </button>
      </div>
    </>
  );
}

function ViewerFrame({
  shellClassName,
  controlsEnabled,
  onActivate,
  onUserInteract,
  showExploreButton,
  footerHint,
  mobileLayout,
}: {
  shellClassName: string;
  controlsEnabled: boolean;
  onActivate: () => void;
  onUserInteract: () => void;
  showExploreButton: boolean;
  footerHint?: ReactNode;
  mobileLayout: boolean;
}) {
  const view = mobileLayout ? MOBILE_VIEW : DESKTOP_VIEW;
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
        camera={{
          position: view.camera.position,
          fov: view.camera.fov,
        }}
        dpr={mobileLayout ? [1, 2] : [1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        className={`absolute inset-0 h-full w-full ${controlsEnabled ? "touch-none" : "touch-pan-y"}`}
        style={{ pointerEvents: controlsEnabled ? "auto" : "none" }}
      >
        <Scene
          controlsEnabled={controlsEnabled}
          onUserInteract={onUserInteract}
          view={view}
        />
      </Canvas>

      {showExploreButton ? <ExploreButtons onActivate={onActivate} /> : null}
      {footerHint}
    </div>
  );
}

export default function Iphone3dCanvas() {
  const coarsePointer = useCoarsePointer();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [desktopActive, setDesktopActive] = useState(false);

  const activate = useCallback(() => {
    if (coarsePointer) {
      setMobileExpanded(true);
    } else {
      setDesktopActive(true);
    }
  }, [coarsePointer]);

  const closeMobile = useCallback(() => {
    setMobileExpanded(false);
  }, []);

  const deactivateDesktop = useCallback(() => {
    setDesktopActive(false);
  }, []);

  useEffect(() => {
    if (!mobileExpanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("iphone-3d-modal-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("iphone-3d-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileExpanded]);

  useEffect(() => {
    if (!desktopActive || coarsePointer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopActive, coarsePointer]);

  const controlsEnabled = coarsePointer ? mobileExpanded : desktopActive;
  const showExploreButton = coarsePointer ? !mobileExpanded : !desktopActive;

  return (
    <div className="relative w-full">
      {coarsePointer && mobileExpanded ? (
        <div className={INLINE_SHELL_CLASS} aria-hidden />
      ) : null}

      <div
        className={
          coarsePointer && mobileExpanded
            ? "fixed inset-0 z-[200] flex flex-col bg-white"
            : "relative w-full"
        }
        data-lenis-prevent
        data-lenis-prevent-touch
        onPointerLeave={coarsePointer ? undefined : deactivateDesktop}
        onBlur={coarsePointer ? undefined : deactivateDesktop}
      >
        {coarsePointer && mobileExpanded ? (
          <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold text-[#111]">iPhone 18 Pro Max</p>
            <button
              type="button"
              onClick={closeMobile}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#111] shadow-sm touch-manipulation"
              aria-label="Fechar visualização 3D"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <ViewerFrame
          mobileLayout={coarsePointer}
          shellClassName={
            coarsePointer && mobileExpanded
              ? "min-h-0 flex-1 rounded-none border-0 shadow-none"
              : INLINE_SHELL_CLASS
          }
          controlsEnabled={controlsEnabled}
          onActivate={activate}
          onUserInteract={() => {
            if (coarsePointer) setMobileExpanded(true);
            else setDesktopActive(true);
          }}
          showExploreButton={showExploreButton}
          footerHint={
            coarsePointer && mobileExpanded ? (
              <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-10 px-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Arraste com o dedo para girar · pinça para zoom
              </p>
            ) : !coarsePointer && desktopActive ? (
              <p className="pointer-events-none absolute bottom-5 left-0 right-0 z-10 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
                Arraste para girar · Esc ou saia da área para liberar o scroll
              </p>
            ) : null
          }
        />
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
