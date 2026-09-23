"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { MotionCard, MotionFade, ParallaxHero, SpringPress } from "@/components/ui/motion";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { formatCentsBRL } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/track";
import type { Product } from "@/types/database";

const CATEGORIES = ["Todos", "iPhone", "MacBook", "Mac", "AirPods", "Watch"] as const;

export function LandingCatalog({ products }: { products: Product[] }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");

  const filtered = useMemo(() => {
    if (cat === "Todos") return products;
    return products.filter((p) => (p as Product & { category?: string }).category === cat);
  }, [products, cat]);

  function productHref(slug: string) {
    return `/criar-conta?product=${encodeURIComponent(slug)}`;
  }

  return (
    <div className="min-h-screen bg-white text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} priority />
            <div>
              <p className="text-sm font-bold tracking-tight">iPlanet Pay</p>
              <p className="text-xs text-[var(--ink-muted)]">Reserve · Aporte · Retire</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/entrar">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/criar-conta">
              <SpringPress>
                <Button size="sm" variant="accent">
                  Criar conta
                </Button>
              </SpringPress>
            </Link>
          </div>
        </div>
      </header>

      <ParallaxHero className="border-b border-[var(--line)] bg-[var(--bg-subtle)]">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-8 md:pb-20 md:pt-20">
          <MotionFade>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Catálogo iPlanet
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-[var(--ink)] md:text-7xl">
              Escolha o seu Apple.
              <span className="mt-2 block text-[var(--ink-muted)]">Pague no seu ritmo.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[var(--ink-muted)] md:text-xl">
              Toque em um produto para começar. Depois do login, reserve e aporte via Pix —
              retire no Itaim Bibi ou São Caetano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#catalogo">
                <Button size="lg" variant="accent">
                  Ver catálogo
                </Button>
              </Link>
              <Link href="/entrar">
                <Button size="lg" variant="outline">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </MotionFade>
        </section>
      </ParallaxHero>

      <section id="catalogo" className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={
                cat === c
                  ? "rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-muted)] hover:border-[var(--ink)]/20 hover:bg-[var(--bg-subtle)]"
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <MotionCard key={p.id} delay={Math.min(i * 0.04, 0.3)}>
              <Link
                href={productHref(p.slug)}
                onClick={() =>
                  void trackEvent("product_click", {
                    product_id: p.id,
                    meta: { slug: p.slug, source: "landing" },
                  })
                }
                className="group block overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-[0_16px_48px_rgba(17,17,17,0.06)] transition hover:border-[var(--accent)]/30 hover:shadow-[0_24px_64px_rgba(255,106,0,0.12)]"
              >
                <div className="relative flex h-56 items-center justify-center bg-[var(--bg-subtle)] p-6">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={280}
                      height={280}
                      className="h-full w-auto object-contain transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full bg-[var(--line)]" />
                  )}
                </div>
                <div className="space-y-1 px-5 pb-6 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    {(p as Product & { category?: string }).category ?? "Apple"}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">{p.name}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {[p.storage, p.color].filter(Boolean).join(" · ")}
                  </p>
                  <p className="pt-2 text-lg font-semibold text-[var(--ink)]">
                    {formatCentsBRL(p.list_price_cents)}
                  </p>
                  <p className="text-sm font-semibold text-[var(--accent)]">Reservar</p>
                </div>
              </Link>
            </MotionCard>
          ))}
        </div>
      </section>

      <section className="bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <MotionFade>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Como funciona</h2>
            <p className="mt-3 max-w-xl text-[var(--ink-muted)]">
              Mesma experiência das lojas iPlanet, com aporte via Pix no seu ritmo.
            </p>
          </MotionFade>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["01", "Escolha", "Toque no produto que você quer no catálogo."],
              ["02", "Aporte via Pix", "Entre, reserve e pague aos poucos."],
              ["03", "Retire", "Com a reserva quitada, retire na loja iPlanet."],
            ].map(([n, t, d], i) => (
              <MotionCard key={n} delay={i * 0.08}>
                <div className="h-full rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-[0_12px_40px_rgba(17,17,17,0.04)]">
                  <p className="text-sm font-semibold text-[var(--accent)]">{n}</p>
                  <h3 className="mt-3 text-2xl font-bold">{t}</h3>
                  <p className="mt-2 text-[var(--ink-muted)]">{d}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Nossas lojas</h2>
          <p className="mt-2 text-[var(--ink-muted)]">
            Atendimento iPlanet em Itaim Bibi e São Caetano.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { name: "Itaim Bibi", city: "São Paulo · SP", address: "Rua Clodomiro Amazonas" },
              { name: "São Caetano", city: "São Caetano do Sul · SP", address: "Quiosque iPlanet" },
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-start gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--bg-subtle)] p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{s.name}</h3>
                  <p className="text-[var(--ink-muted)]">{s.city}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{s.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-white py-8 text-center text-sm text-[var(--ink-muted)]">
        © {new Date().getFullYear()} iPlanet Pay · Itaim Bibi & São Caetano
      </footer>
    </div>
  );
}
