import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  /** Invert/lighten for dark backgrounds */
  onDark?: boolean;
  priority?: boolean;
}

export function BrandLogo({
  size = 40,
  className,
  onDark = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo-iplanet.png"
      alt="iPlanet"
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "rounded-2xl object-contain",
        onDark && "brightness-0 invert",
        className,
      )}
    />
  );
}
