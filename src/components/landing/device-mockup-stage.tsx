"use client";

/**
 * Framer-style MacBook + iPad + iPhone lineup with glossy floor reflections.
 * Matches /workspace/framer-refs/02-device-mockups.png aesthetic.
 */
export function DeviceMockupStage({
  fullBleed = false,
}: {
  fullBleed?: boolean;
}) {
  return (
    <div
      className={
        fullBleed
          ? "pointer-events-none relative h-full w-full min-h-0 select-none overflow-hidden"
          : "relative mx-auto w-full max-w-5xl select-none"
      }
      aria-hidden={fullBleed || undefined}
    >
      {/* Soft studio glow */}
      <div
        className={
          fullBleed
            ? "pointer-events-none absolute inset-x-0 top-[10%] h-[55%] opacity-50 blur-3xl"
            : "pointer-events-none absolute inset-x-0 top-1/4 h-1/2 rounded-full opacity-45 blur-3xl"
        }
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(0,113,227,0.10), transparent 68%)",
        }}
        aria-hidden
      />

      {/* Glossy floor plane */}
      <div
        className={
          fullBleed
            ? "pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent via-[#ececf0]/40 to-[#e4e4ea]/70"
            : "pointer-events-none absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-transparent to-[#e8e8ec]/55"
        }
        aria-hidden
      />

      <div
        className={
          fullBleed
            ? "absolute inset-0 flex h-full max-h-[100dvh] min-h-0 items-end justify-center overflow-hidden px-3 pb-[min(10%,4rem)] pt-[min(6%,2.5rem)] sm:px-6 md:px-10"
            : "relative flex items-end justify-center gap-4 px-2 pb-10 md:gap-8 md:pb-14"
        }
      >
        <div
          className={
            fullBleed
              ? "flex origin-bottom items-end justify-center gap-3 sm:gap-5 md:gap-8 lg:gap-10 [@media(max-height:900px)]:scale-[0.92] [@media(max-height:820px)]:scale-[0.82] [@media(max-height:740px)]:scale-[0.72] [@media(max-height:680px)]:scale-[0.64]"
              : "contents"
          }
        >
          {/* MacBook — left */}
          <div
            className={
              fullBleed
                ? "relative w-[48%] max-w-[min(720px,52vw)] min-w-0"
                : "relative w-[48%] max-w-[340px]"
            }
          >
            <div className="rounded-[12px] border border-[#3a3a3e] bg-[#1c1c1e] p-[7px] shadow-[0_32px_80px_rgba(0,0,0,0.28)] md:rounded-[16px] md:p-[9px]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[7px] bg-black md:rounded-[10px]">
                <MacBookWallpaper />
              </div>
            </div>
            <div className="mx-auto h-[7px] w-[110%] -translate-x-[4.5%] rounded-b-[10px] bg-gradient-to-b from-[#2e2e32] via-[#222226] to-[#161618] md:h-[9px]" />
            <div className="mx-auto h-[3px] w-[42%] rounded-b-full bg-[#0c0c0e] md:h-[4px]" />
            <GlossyReflection intensity={0.42} />
          </div>

          {/* iPad — center */}
          <div
            className={
              fullBleed
                ? "relative z-10 w-[19%] max-w-[min(240px,20vw)] min-w-0 -translate-y-4 md:-translate-y-8 [@media(max-height:740px)]:-translate-y-2"
                : "relative z-10 w-[22%] max-w-[150px] -translate-y-3"
            }
          >
            <div className="rounded-[20px] border border-[#1a1a1c] bg-[#0e0e10] p-[5px] shadow-[0_30px_70px_rgba(0,0,0,0.30)] md:rounded-[24px] md:p-[6px]">
              <div className="relative aspect-[10/14] overflow-hidden rounded-[15px] bg-black md:rounded-[18px]">
                <IpadWallpaper />
              </div>
            </div>
            <GlossyReflection intensity={0.48} />
          </div>

          {/* iPhone — right */}
          <div
            className={
              fullBleed
                ? "relative z-20 w-[15%] max-w-[min(200px,16vw)] min-w-0 -translate-y-2 md:w-[14%] md:max-w-[min(220px,14vw)] md:-translate-y-5 [@media(max-height:740px)]:-translate-y-1"
                : "relative w-[15%] max-w-[100px] -translate-y-2"
            }
          >
            <div className="rounded-[24px] border border-[#2c2c30] bg-[#1a1a1c] p-[5px] shadow-[0_28px_60px_rgba(0,0,0,0.32)] md:rounded-[30px] md:p-[6px]">
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[19px] bg-[#0c0c0e] md:rounded-[24px]">
                <div className="absolute left-1/2 top-2.5 z-10 h-[9px] w-[34%] -translate-x-1/2 rounded-full bg-black md:top-3 md:h-[11px]" />
                <IphoneWallpaper />
              </div>
            </div>
            <GlossyReflection intensity={0.4} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MacBookWallpaper() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 28% 42%, #3a3a42 0%, #121214 62%, #08080a 100%)",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 160 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M8 82 C38 18, 48 88, 78 38 S118 8, 152 68"
          fill="none"
          stroke="#6a6a72"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M0 58 C28 8, 58 88, 98 28 S138 48, 160 18"
          fill="none"
          stroke="#484850"
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M20 90 C50 40, 70 95, 100 55 S130 20, 160 50"
          fill="none"
          stroke="#2e2e36"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </>
  );
}

function IpadWallpaper() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #08080a 0%, #101014 45%, #08080a 100%)",
        }}
      />
      <div
        className="absolute inset-y-0 left-[16%] w-[20%] blur-[1.5px]"
        style={{
          background:
            "linear-gradient(180deg, #4fc3f7, #ffe082, #ff8a65, #7e57c2)",
          opacity: 0.92,
        }}
      />
      <div
        className="absolute inset-y-0 left-[40%] w-[11%] blur-[2.5px]"
        style={{
          background:
            "linear-gradient(180deg, transparent, #80deea, #fff59d, transparent)",
          opacity: 0.78,
        }}
      />
      <div
        className="absolute inset-y-0 right-[20%] w-[15%] blur-[1.5px]"
        style={{
          background:
            "linear-gradient(180deg, #ce93d8, #80cbc4, #ffcc80)",
          opacity: 0.88,
        }}
      />
    </>
  );
}

function IphoneWallpaper() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 90 190" aria-hidden>
      <rect width="90" height="190" fill="#0c0c0e" />
      {[28, 42, 56, 70].map((r) => (
        <rect
          key={r}
          x={45 - r / 2}
          y={95 - r / 2}
          width={r}
          height={r}
          rx={10}
          fill="none"
          stroke="#3a3a42"
          strokeWidth="0.9"
          opacity={0.55 + (70 - r) * 0.006}
        />
      ))}
    </svg>
  );
}

function GlossyReflection({ intensity }: { intensity: number }) {
  return (
    <div
      className="mt-1.5 h-10 w-full origin-top scale-y-[-1] overflow-hidden blur-[0.6px] md:h-14 [@media(max-height:820px)]:h-6 [@media(max-height:720px)]:hidden"
      aria-hidden
      style={{
        opacity: intensity,
        maskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 100%)",
      }}
    >
      <div className="h-full w-full rounded-t-[10px] bg-gradient-to-b from-black/40 via-black/18 to-transparent" />
    </div>
  );
}
