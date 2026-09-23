"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCentsBRL } from "@/lib/utils";
import Link from "next/link";

async function saveSetting(key: string, value: string) {
  const res = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return (await res.json()) as { ok?: boolean; error?: string };
}

export function ReferralSettingsForm({
  initialBonusCents,
}: {
  initialBonusCents: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialBonusCents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const preview = Number(value);
  const previewLabel =
    Number.isFinite(preview) && preview >= 0 ? formatCentsBRL(preview) : "—";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await saveSetting("referral_bonus_amount_cents", value);
      if (!data.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setMessage("Salvo.");
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-bold tracking-tight">Bônus de indicação</h3>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Valor em centavos creditado ao indicador (ex.: 5000 = R$ 50,00).
      </p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          label="referral_bonus_amount_cents"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          hint={`Prévia: ${previewLabel}`}
          required
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}

export function SupportAndAgentSettingsForm({
  initialWhatsapp,
  initialAgentEnabled,
  telegramConfigured,
}: {
  initialWhatsapp: string;
  initialAgentEnabled: boolean;
  telegramConfigured: boolean;
}) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [agentEnabled, setAgentEnabled] = useState(initialAgentEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const a = await saveSetting("whatsapp_support", whatsapp.replace(/\D/g, ""));
      const b = await saveSetting("agent_enabled", agentEnabled ? "true" : "false");
      if (!a.ok || !b.ok) {
        setError(a.error ?? b.error ?? "Falha ao salvar.");
        return;
      }
      setMessage("Salvo.");
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-bold tracking-tight">Suporte & Agente</h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          WhatsApp para handoff do FAQ e toggles do agente (chaves depois).
        </p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Input
          label="WhatsApp suporte (E.164, só dígitos)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="5511999999999"
          hint="Usado em wa.me/&lt;digits&gt; no chat FAQ"
        />
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={agentEnabled}
            onChange={(e) => setAgentEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          agent_enabled
        </label>
        <p className="text-sm text-[var(--ink-muted)]">
          telegram_bot_configured:{" "}
          <strong>{telegramConfigured ? "sim (token no env)" : "não"}</strong>
        </p>
        <p className="rounded-2xl bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Conecte as chaves (Telegram / AGENT_API_KEY / Resend) quando o produto
          estiver 100%. Até lá, rotas respondem 503 com mensagem clara.
        </p>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
          <Link href="/admin/emails/preview">
            <Button type="button" variant="outline">
              Preview e-mails
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
