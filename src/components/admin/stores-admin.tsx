"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Store } from "@/types/database";
import { Store as StoreIcon, Trash2 } from "lucide-react";

export function StoresAdmin({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Store | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name,
          address,
          city,
          slug: editing?.slug,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setName("");
      setAddress("");
      setCity("");
      setEditing(null);
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta loja?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao excluir.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(s: Store) {
    setEditing(s);
    setName(s.name);
    setAddress(s.address);
    setCity(s.city);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {stores.map((s) => (
          <Card key={s.id} className="flex items-start justify-between gap-3">
            <div>
              <StoreIcon className="mb-2 h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-bold">{s.name}</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {s.address} · {s.city}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">/{s.slug}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => startEdit(s)}>
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void remove(s.id)}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-lg font-bold tracking-tight">
          {editing ? "Editar loja" : "Nova loja"}
        </h3>
        <form className="mt-4 space-y-3" onSubmit={save}>
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Endereço"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} required />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? "Salvando…" : editing ? "Atualizar" : "Criar"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setAddress("");
                  setCity("");
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
