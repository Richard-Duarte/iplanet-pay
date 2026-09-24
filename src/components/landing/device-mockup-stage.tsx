"use client";

/** Full-bleed Framer-style device stage — MacBook + iPad + large iPhone fills the panel. */
export function DeviceMockupStage({
  fullBleed = false,
}: {
  fullBleed?: boolean;
}) {
  return (
    <div
      className={
        fullBleed
          ? "pointer-events-none absolute inset-0 select-none overflow-hidden"
          : "relative mx-auto w-full max-w-3xl select-none"
      }
      aria-hidden={fullBleed || undefined}
    >
      <div
        className={
          fullBleed
            ? "pointer-events-none absolute inset-x-0 bottom-0 top-[8%] opacity-70 blur-3xl"
            : "pointer-events-none absolute inset-x-0 top-1/3 h-2/3 rounded-full opacity-60 blur-3xl"
        }
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,113,227,0.14), transparent 65%)",
        }}
        aria-hidden
      />

      {/*
        Height-fit: short 16:9 viewports scale the whole device cluster from the
        bottom so laptop+tablet+phone+reflections never exceed ~100dvh.
      */}
      <div
        className={
          fullBleed
            ? "absolute inset-0 flex h-full max-h-[100dvh] min-h-0 items-end justify-center overflow-hidden px-2 pb-[min(8%,3.25rem)] pt-[min(5%,2rem)] sm:px-4 md:px-8 [@media(max-height:720px)]:pb-5 [@media(max-height:720px)]:pt-3"
            : "relative flex items-end justify-center gap-3 px-2 md:gap-5"
        }
      >
        <div
          className={
            fullBleed
              ? "flex origin-bottom items-end justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 [@media(max-height:900px)]:scale-[0.92] [@media(max-height:820px)]:scale-[0.82] [@media(max-height:740px)]:scale-[0.72] [@media(max-height:680px)]:scale-[0.64]"
              : "contents"
          }
        >
          {/* Laptop */}
          <div
            className={
              fullBleed
                ? "relative w-[48%] max-w-[min(680px,50vw)] min-w-0"
                : "relative w-[46%] max-w-[280px]"
            }
          >
            <div className="rounded-[10px] border border-[#2a2a2e] bg-[#1a1a1c] p-[6px] shadow-[0_28px_70px_rgba(0,0,0,0.28)] md:rounded-[14px] md:p-[8px]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-black md:rounded-[8px]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 40%, #3a3a40 0%, #0a0a0c 70%)",
                  }}
                />
                <svg
                  className="absolute inset-0 h-full w-full opacity-80"
                  viewBox="0 0 160 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M10 80 C40 20, 50 90, 80 40 S120 10, 150 70"
                    fill="none"
                    stroke="#6b6b72"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 60 C30 10, 60 90, 100 30 S140 50, 160 20"
                    fill="none"
                    stroke="#4a4a52"
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
              </div>
            </div>
            <div className="mx-auto h-[6px] w-[108%] -translate-x-[4%] rounded-b-[8px] bg-gradient-to-b from-[#2c2c30] to-[#1a1a1c] md:h-[8px]" />
            <div className="mx-auto h-[3px] w-[50%] rounded-b-full bg-[#111] md:h-[4px]" />
            <Reflection className="opacity-40" />
          </div>

          {/* Tablet */}
          <div
            className={
              fullBleed
                ? "relative z-10 w-[20%] max-w-[min(250px,21vw)] min-w-0 -translate-y-3 md:-translate-y-6 [@media(max-height:740px)]:-translate-y-2"
                : "relative z-10 w-[24%] max-w-[140px] -translate-y-2"
            }
          >
            <div className="rounded-[18px] border border-[#222] bg-[#111] p-[5px] shadow-[0_28px_60px_rgba(0,0,0,0.32)] md:rounded-[22px] md:p-[7px]">
              <div className="relative aspect-[10/14] overflow-hidden rounded-[13px] bg-black md:rounded-[16px]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, #0a0a0c 0%, #111 40%, #0a0a0c 100%)",
                  }}
                />
                <div
                  className="absolute inset-y-0 left-[18%] w-[18%] blur-[1px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #4fc3f7, #ffe082, #ff8a65, #7e57c2)",
                    opacity: 0.9,
                  }}
                />
                <div
                  className="absolute inset-y-0 left-[42%] w-[10%] blur-[2px]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, #80deea, #fff59d, transparent)",
                    opacity: 0.75,
                  }}
                />
                <div
                  className="absolute inset-y-0 right-[22%] w-[14%] blur-[1px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #ce93d8, #80cbc4, #ffcc80)",
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
            <Reflection className="opacity-45" />
          </div>

          {/* Phone — prominent */}
          <div
            className={
              fullBleed
                ? "relative z-20 w-[16%] max-w-[min(210px,17vw)] min-w-0 -translate-y-1 md:w-[15%] md:max-w-[min(230px,15vw)] md:-translate-y-4 [@media(max-height:740px)]:-translate-y-1"
                : "relative w-[16%] max-w-[92px] -translate-y-1"
            }
          >
            <div className="rounded-[22px] border border-[#2a2a2e] bg-[#1c1c1e] p-[5px] shadow-[0_28px_56px_rgba(0,0,0,0.34)] md:rounded-[28px] md:p-[7px]">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[17px] bg-[#121214] md:rounded-[22px]">
                <div className="absolute left-1/2 top-2.5 z-10 h-[8px] w-[32%] -translate-x-1/2 rounded-full bg-black md:top-3 md:h-[10px]" />
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 90 190"
                  aria-hidden
                >
                  <circle
                    cx="45"
                    cy="95"
                    r="28"
                    fill="none"
                    stroke="#3a3a40"
                    strokeWidth="1"
                  />
                  <circle
                    cx="45"
                    cy="95"
                    r="42"
                    fill="none"
                    stroke="#2e2e34"
                    strokeWidth="1"
                  />
                  <circle
                    cx="45"
                    cy="95"
                    r="56"
                    fill="none"
                    stroke="#26262c"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>
            <Reflection className="opacity-40" />
          </div>
        </div>
      </div>

      {/* Soft floor fade so text overlay stays readable */}
      {fullBleed ? (
        <div
          className="absolute inset-x-0 bottom-0 h-[min(42%,13rem)] bg-gradient-to-t from-[#f5f5f7] via-[#f5f5f7]/85 to-transparent [@media(max-height:740px)]:h-[36%]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function Reflection({ className }: { className?: string }) {
  return (
    <div
      className={`mt-1 h-8 w-full origin-top scale-y-[-1] overflow-hidden opacity-50 blur-[1px] md:h-11 [@media(max-height:820px)]:h-5 [@media(max-height:720px)]:hidden ${className ?? ""}`}
      aria-hidden
      style={{
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.45), transparent)",
        WebkitMaskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.45), transparent)",
      }}
    >
      <div className="h-full w-full rounded-t-[8px] bg-gradient-to-b from-black/35 to-transparent" />
    </div>
  );
}
