import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  /** Invert/lighten for dark backgrounds (compact mark only) */
  onDark?: boolean;
  priority?: boolean;
  /**
   * wordmark = horizontal logo-iplanet-pay (landing header).
   * mark = same pay wordmark, scaled for compact chrome (sidebar collapsed, top bar).
   */
  variant?: "mark" | "wordmark";
  /** Explicit height for wordmark (width auto). Default 48. */
  height?: number;
}

export function BrandLogo({
  size = 40,
  className,
  onDark = false,
  priority = false,
  variant = "mark",
  height,
}: BrandLogoProps) {
  if (variant === "wordmark") {
    const h = height ?? 48;
    // Cropped wordmark ~1175×296 → aspect ≈ 3.97
    const w = Math.round(h * (1175 / 296));
    return (
      <Image
        src="/logo-iplanet-pay.png"
        alt="iPlanet Pay"
        width={w}
        height={h}
        priority={priority}
        className={cn(
          "h-auto w-auto rounded-xl object-contain",
          className,
        )}
        style={{ height: h, width: "auto" }}
      />
    );
  }

  const h = size;
  const w = Math.round(h * (1175 / 296));
  return (
    <Image
      src="/logo-iplanet-pay.png"
      alt="iPlanet Pay"
      width={w}
      height={h}
      priority={priority}
      className={cn(
        "h-auto w-auto max-w-full object-contain",
        onDark && "brightness-0 invert",
        className,
      )}
      style={{ height: h, width: "auto", maxWidth: "100%" }}
    />
  );
}
