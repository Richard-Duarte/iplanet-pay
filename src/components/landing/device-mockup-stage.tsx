"use client";

/** CSS device stage inspired by Framer device-mockups — laptop + tablet + phone with floor reflections. */
export function DeviceMockupStage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl select-none">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 h-2/3 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,113,227,0.12), transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative flex items-end justify-center gap-3 px-2 md:gap-5">
        {/* Laptop */}
        <div className="relative w-[46%] max-w-[280px]">
          <div className="rounded-[10px] border border-[#2a2a2e] bg-[#1a1a1c] p-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-black">
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
          <div className="mx-auto h-[6px] w-[108%] -translate-x-[4%] rounded-b-[8px] bg-gradient-to-b from-[#2c2c30] to-[#1a1a1c]" />
          <div className="mx-auto h-[3px] w-[50%] rounded-b-full bg-[#111]" />
          <Reflection className="opacity-40" />
        </div>

        {/* Tablet */}
        <div className="relative z-10 w-[24%] max-w-[140px] -translate-y-2">
          <div className="rounded-[18px] border border-[#222] bg-[#111] p-[5px] shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
            <div className="relative aspect-[10/14] overflow-hidden rounded-[13px] bg-black">
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

        {/* Phone */}
        <div className="relative w-[16%] max-w-[92px] -translate-y-1">
          <div className="rounded-[18px] border border-[#2a2a2e] bg-[#1c1c1e] p-[4px] shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[9/19] overflow-hidden rounded-[14px] bg-[#121214]">
              <div className="absolute left-1/2 top-2 z-10 h-[7px] w-[28%] -translate-x-1/2 rounded-full bg-black" />
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
  );
}

function Reflection({ className }: { className?: string }) {
  return (
    <div
      className={`mt-1 h-10 w-full origin-top scale-y-[-1] overflow-hidden opacity-50 blur-[1px] ${className ?? ""}`}
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
