"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/auth/logout-button";

export function PerfilForm({
  fullName,
  email,
  phone,
  role,
  referralCode,
}: {
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  referralCode: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone: phoneValue,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setMessage("Dados atualizados.");
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Nome completo"
            name="full_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input label="E-mail" name="email" value={email} disabled hint="O e-mail não pode ser alterado aqui." />
          <Input
            label="Telefone"
            name="phone"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            placeholder="(11) 99999-9999"
          />
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Papel</p>
            <p className="mt-1 capitalize text-[var(--ink-muted)]">{role}</p>
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Código de indicação</p>
          <p className="mt-1 text-xl font-bold tracking-widest text-[var(--accent)]">
            {referralCode ?? "—"}
          </p>
        </div>
        <Link href="/app/indicacoes">
          <Button variant="outline" size="md">
            Ver indicações
          </Button>
        </Link>
        <Link href="/app/reservas">
          <Button variant="outline" size="md">
            Minhas reservas
          </Button>
        </Link>
        <LogoutButton variant="outline" size="md" />
      </Card>
    </div>
  );
}
