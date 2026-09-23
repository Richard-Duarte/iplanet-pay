"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import type { UserRole } from "@/types/auth";

const DEMO_ROLES: { role: UserRole; label: string }[] = [
  { role: "cliente", label: "Cliente" },
  { role: "parceiro", label: "Parceiro" },
  { role: "staff", label: "Staff" },
  { role: "admin", label: "Admin" },
];

export function LoginForm({ mockMode }: { mockMode: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(role?: UserRole) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push(data.redirectTo ?? "/app");
      router.refresh();
    } catch {
      setMessage("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message ?? data.error ?? "Solicitação enviada.");
    } catch {
      setMessage("Erro ao solicitar magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {mockMode ? (
        <div className="rounded-2xl bg-[var(--accent-soft)] p-4">
          <Pill tone="accent">Modo demo</Pill>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Credenciais Supabase não configuradas. Entre como um papel para
            navegar o esqueleto.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((item) => (
              <Button
                key={item.role}
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => submit(item.role)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required={!mockMode}
        />
        <Input
          label="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!mockMode}
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={loading || (!email && !mockMode)}
          onClick={() => void sendMagicLink()}
        >
          Enviar magic link
        </Button>
      </form>

      {message ? (
        <p className="text-sm text-[var(--ink-muted)]">{message}</p>
      ) : null}

      <p className="text-sm text-[var(--ink-muted)]">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-[var(--ink)]">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
