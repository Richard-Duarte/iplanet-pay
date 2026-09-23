"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} onDark priority />
            <div>
              <p className="text-sm font-bold tracking-tight">iPlanet Pay</p>
              <p className="text-xs text-white/50">Reserve · Aporte · Retire</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/entrar">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
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

      <ParallaxHero className="border-b border-white/10">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <MotionFade>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Catálogo iPlanet
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
              Escolha o seu Apple.
              <span className="block text-white/50">Pague no seu ritmo.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/60 md:text-xl">
              Toque em um produto para começar. Depois do login, reserve e aporte via Pix — retire no Itaim ou São Caetano.
            </p>
          </MotionFade>
        </section>
      </ParallaxHero>

      <section id="catalogo" className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={
                cat === c
                  ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                  : "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/15"
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
                className="group block overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition"
              >
                <div className="relative flex h-56 items-center justify-center bg-gradient-to-b from-white/5 to-transparent p-6">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={280}
                      height={280}
                      className="h-full w-auto object-contain transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full bg-white/10" />
                  )}
                </div>
                <div className="space-y-1 px-5 pb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    {(p as Product & { category?: string }).category ?? "Apple"}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight">{p.name}</h3>
                  <p className="text-sm text-white/50">
                    {[p.storage, p.color].filter(Boolean).join(" · ")}
                  </p>
                  <p className="pt-2 text-lg font-semibold text-white">
                    {formatCentsBRL(p.list_price_cents)}
                  </p>
                  <p className="text-sm text-[var(--accent)]">Reservar →</p>
                </div>
              </Link>
            </MotionCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <MotionFade>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Como funciona</h2>
        </MotionFade>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Escolha", "Toque no produto que você quer no catálogo."],
            ["02", "Aporte via Pix", "Entre, reserve e pague aos poucos."],
            ["03", "Retire", "Com a reserva quitada, retire na loja iPlanet."],
          ].map(([n, t, d], i) => (
            <MotionCard key={n} delay={i * 0.08}>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm font-semibold text-[var(--accent)]">{n}</p>
                <h3 className="mt-3 text-2xl font-bold">{t}</h3>
                <p className="mt-2 text-white/60">{d}</p>
              </div>
            </MotionCard>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-white text-black">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Nossas lojas</h2>
          <p className="mt-2 text-[var(--ink-muted)]">
            Mesma experiência premium em duas unidades.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { name: "Itaim Bibi", city: "São Paulo · SP" },
              { name: "São Caetano", city: "São Caetano do Sul · SP" },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--bg-subtle)] p-6"
              >
                <h3 className="text-xl font-bold">{s.name}</h3>
                <p className="text-[var(--ink-muted)]">{s.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} iPlanet Pay · Itaim Bibi & São Caetano
      </footer>
    </div>
  );
}
