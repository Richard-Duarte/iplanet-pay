"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  variant = "outline",
  size = "sm",
}: {
  variant?: "primary" | "accent" | "ghost" | "outline" | "whatsapp";
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/entrar");
        router.refresh();
      }}
    >
      Sair
    </Button>
  );
}
