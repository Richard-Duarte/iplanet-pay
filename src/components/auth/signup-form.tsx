"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm({ mockMode }: { mockMode: boolean }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Não foi possível criar a conta.");
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

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {mockMode ? (
        <p className="rounded-2xl bg-[var(--bg-lavender)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Modo demo ativo — a conta será simulada localmente.
        </p>
      ) : null}
      <Input
        label="Nome completo"
        name="full_name"
        placeholder="Seu nome"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="E-mail"
        type="email"
        name="email"
        placeholder="voce@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Telefone"
        name="phone"
        placeholder="(11) 99999-9999"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <Input
        label="Senha"
        type="password"
        name="password"
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required={!mockMode}
        minLength={mockMode ? undefined : 6}
      />
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Criando..." : "Criar conta"}
      </Button>
      {message ? (
        <p className="text-sm text-[var(--ink-muted)]">{message}</p>
      ) : null}
      <p className="text-sm text-[var(--ink-muted)]">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-[var(--ink)]">
          Entrar
        </Link>
      </p>
    </form>
  );
}
