import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost" | "outline" | "whatsapp";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary-btn)] text-[var(--primary-btn-text)] hover:opacity-90",
  accent: "bg-[var(--accent)] text-white hover:opacity-90",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--bg-subtle)]",
  outline:
    "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg-subtle)]",
  whatsapp: "bg-[var(--whatsapp)] text-white hover:opacity-90",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-[15px]",
    lg: "h-14 px-8 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
