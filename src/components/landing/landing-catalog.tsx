"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AtSign, MapPin, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  MotionCard,
  MotionFade,
  SpringPress,
} from "@/components/ui/motion";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { ProductModal } from "@/components/catalog/product-modal";
import { formatCentsBRL } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/track";
import type { Product, ProductCategory } from "@/types/database";
import { ComoFuncionaReveal } from "@/components/landing/como-funciona-reveal";
import { VelocityCatalogCarousel } from "@/components/landing/velocity-catalog-carousel";
import { Experiencia3dSection } from "@/components/landing/iphone-3d-viewer";
import { LiquidGlassFooter } from "@/components/landing/liquid-glass-footer";

export type LandingCategory = Pick<ProductCategory, "id" | "name" | "slug">;

const chipSpring = { type: "spring" as const, stiffness: 400, damping: 30 };

const STORES = [
  {
    name: "Itaim Bibi",
    city: "São Paulo · SP",
    address: "Rua Clodomiro Amazonas",
    mapSrc:
      "https://maps.google.com/maps?q=iPlanet%20Rua%20Clodomiro%20Amazonas%20Itaim%20Bibi%20S%C3%A3o%20Paulo&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=iPlanet+Rua+Clodomiro+Amazonas+Itaim+Bibi",
  },
  {
    name: "São Caetano do Sul",
    city: "São Caetano do Sul · SP",
    address: "Quiosque iPlanet",
    mapSrc:
      "https://maps.google.com/maps?q=quiosque%20iPlanet%20S%C3%A3o%20Caetano%20do%20Sul&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=quiosque+iPlanet+São+Caetano+do+Sul",
  },
] as const;

const STATS = [
  { value: "10", label: "anos de lojas físicas" },
  { value: "15", label: "anos de experiência" },
  { value: "18x", label: "nos seminovos" },
  { value: "2", label: "unidades: Itaim e São Caetano" },
] as const;

const HERO_PRODUCT_SLUG = "iphone-18-pro-256";

export function LandingCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: LandingCategory[];
}) {
  const [cat, setCat] = useState<string>("Todos");
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAll, setShowAll] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const slug = searchParams.get("product");
    if (!slug || products.length === 0) return;
    const match = products.find((p) => p.slug === slug);
    if (match) setSelected(match);
  }, [searchParams, products]);

  function openHeroProduct() {
    const match =
      products.find((p) => p.slug === HERO_PRODUCT_SLUG) ??
      products.find((p) => p.slug.startsWith("iphone-18-pro")) ??
      null;
    if (match) {
      void trackEvent("product_click", {
        product_id: match.id,
        meta: { slug: match.slug, source: "landing_hero" },
      });
      setSelected(match);
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
  }

  const tabs = useMemo(() => {
    const withProducts = categories.filter((c) =>
      products.some(
        (p) =>
          p.category === c.name ||
          (p as Product & { category_id?: string | null }).category_id === c.id,
      ),
    );
    const list = withProducts.length > 0 ? withProducts : categories;
    return ["Todos", ...list.map((c) => c.name)];
  }, [categories, products]);

  const filtered = useMemo(() => {
    if (cat === "Todos") return products;
    return products.filter((p) => p.category === cat);
  }, [products, cat]);

  function openProduct(p: Product) {
    void trackEvent("product_click", {
      product_id: p.id,
      meta: { slug: p.slug, source: "landing" },
    });
    setSelected(p);
  }

  return (
    <div className="min-h-screen bg-white text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <BrandLogo variant="wordmark" height={52} priority />
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

      {/* Hero — dark full-bleed video */}
      <section className="relative isolate min-h-[78vh] overflow-hidden bg-black text-white md:min-h-[88vh]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/videos/iphone-18-pro-hero-poster.jpg"
          preload="metadata"
        >
          <source src="/videos/iphone-18-pro-hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:min-h-[88vh] md:px-8 md:pb-24">
          <MotionFade>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              iPlanet Pay
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-white md:text-7xl">
              iPhone 18 Pro
            </h1>
            <p className="mt-3 text-2xl font-medium tracking-tight text-white/90 md:text-3xl">
              Muito mais Pro.
            </p>
            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              Reserve nas lojas iPlanet e aporte via Pix no seu ritmo. Retire no
              Itaim Bibi ou em São Caetano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#catalogo">
                <Button size="lg" variant="accent">
                  Ver catálogo
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                onClick={openHeroProduct}
              >
                Saiba mais
              </Button>
            </div>
          </MotionFade>
        </div>
      </section>

      <ComoFuncionaReveal />

      <section id="catalogo" className="overflow-hidden bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <MotionFade>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Catálogo iPlanet
                </p>
                <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
                  Escolha o seu Apple.
                  <span className="mt-1 block text-[var(--ink-muted)]">
                    Pague no seu ritmo.
                  </span>
                </h2>
              </div>
              <Button
                variant="accent"
                size="lg"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Ver carrossel" : "Ver todos"}
              </Button>
            </div>
          </MotionFade>

          <div className="mb-8 mt-8 flex flex-wrap gap-2">
            {tabs.map((c) => (
              <motion.button
                key={c}
                type="button"
                onClick={() => {
                  setCat(c);
                  setShowAll(false);
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={chipSpring}
                className={
                  cat === c
                    ? "rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-muted)] hover:border-[var(--ink)]/20"
                }
              >
                {c}
              </motion.button>
            ))}
          </div>
        </div>

        {!showAll ? (
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <VelocityCatalogCarousel
              products={filtered}
              onSelect={openProduct}
            />
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <MotionCard key={p.id} delay={Math.min(i * 0.04, 0.3)}>
                <button
                  type="button"
                  onClick={() => openProduct(p)}
                  className="group block w-full overflow-hidden rounded-[28px] border border-[var(--line)] bg-white text-left shadow-[0_8px_32px_rgba(17,17,17,0.04)] transition hover:border-[var(--accent)]/35 hover:shadow-[0_20px_48px_rgba(0,113,227,0.12)]"
                >
                  <div className="relative flex h-56 items-center justify-center bg-white p-6">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={280}
                        height={280}
                        className="h-full w-auto object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-40 w-40 rounded-full bg-[var(--line)]" />
                    )}
                  </div>
                  <div className="space-y-1 bg-white px-5 pb-6 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      {p.category ?? "Apple"}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                      {p.name}
                    </h3>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {[p.storage, p.color].filter(Boolean).join(" · ")}
                    </p>
                    <p className="pt-2 text-lg font-semibold text-[var(--ink)]">
                      {formatCentsBRL(p.list_price_cents)}
                    </p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      Ver detalhes
                    </p>
                  </div>
                </button>
              </MotionCard>
            ))}
          </div>
        )}
      </section>

      <Experiencia3dSection />

      {/* Quem é a iPlanet / Nossas lojas — Totens content */}
      <section id="lojas" className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <MotionFade>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Quem é a iPlanet
            </p>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
              Mais de 15 anos de experiência e 10 anos de lojas físicas.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--ink-muted)]">
              Presente no Itaim Bibi e em São Caetano, a iPlanet une experiência,
              atendimento especializado e soluções completas para quem busca
              tecnologia com confiança.
            </p>
            <p className="mt-3 max-w-3xl text-base text-[var(--ink-muted)]">
              A iPlanet também foi loja no Brooklin (durante 3 anos) e no Morumbi
              (durante 4 anos).
            </p>
          </MotionFade>

          <ul className="mt-8 space-y-3 text-[15px] text-[var(--ink)]">
            {[
              "Seu aparelho pode valer como entrada na compra do próximo.",
              "Parcelamento em até 18x nos aparelhos seminovos.",
              "Serviço de retirada e entrega nas imediações das lojas iPlanet, para maior comodidade.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-5 text-center"
              >
                <p className="text-3xl font-bold tracking-tight text-[var(--accent)] md:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--ink-muted)] md:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <h3 className="mt-16 text-2xl font-bold tracking-tight md:text-3xl">
            Nossas lojas
          </h3>
          <p className="mt-2 text-[var(--ink-muted)]">
            Atendimento iPlanet em Itaim Bibi e São Caetano.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {STORES.map((s) => (
              <div
                key={s.name}
                className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-subtle)] shadow-[0_12px_40px_rgba(17,17,17,0.04)]"
              >
                <div className="relative aspect-[16/10] w-full bg-[var(--line)]">
                  <iframe
                    title={`Mapa ${s.name}`}
                    src={s.mapSrc}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-bold">{s.name}</h4>
                    <p className="text-[var(--ink-muted)]">{s.city}</p>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {s.address}
                    </p>
                    <a
                      href={s.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
                    >
                      Abrir no Maps →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--bg-subtle)] px-5 py-4">
            <a
              href="https://wa.me/5511973484819"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
            >
              <MessageCircle className="h-4 w-4 text-[var(--accent)]" />
              WhatsApp (11) 97348-4819
            </a>
            <span className="hidden h-4 w-px bg-[var(--line)] sm:block" />
            <a
              href="https://instagram.com/iplanet_totens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
            >
              <AtSign className="h-4 w-4 text-[var(--accent)]" />
              @iplanet_totens
            </a>
          </div>
        </div>
      </section>

      <LiquidGlassFooter />

      <ProductModal
        product={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
