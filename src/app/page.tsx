import Link from "next/link";
import { MapPin, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { ProductHeroCard } from "@/components/ui/product-hero-card";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-bold text-white">
            iP
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">iPlanet Pay</p>
            <p className="text-xs text-[var(--ink-muted)]">Layaway inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/entrar">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/criar-conta">
            <Button size="sm">Criar conta</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--line)] bg-white px-6 py-12 soft-glow md:px-12 md:py-16">
          <div className="glow-lavender absolute inset-0" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Pill tone="lavender" className="mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Novo · Pix em aportes
              </Pill>
              <h1 className="max-w-xl text-5xl font-bold leading-[1.02] tracking-tight text-[var(--ink)] md:text-6xl">
                Compre seu iPhone no seu ritmo.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-[var(--ink-muted)]">
                Reserve o aparelho, pague via Pix aos poucos e retire nas lojas
                iPlanet em Itaim Bibi ou São Caetano.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/criar-conta">
                  <Button size="lg">Começar agora</Button>
                </Link>
                <Link href="/entrar">
                  <Button size="lg" variant="outline">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
            <ProductHeroCard
              badge="Destaque"
              title="iPhone 16 Pro"
              subtitle="Titânio · 256 GB · Reserva com Pix"
              priceLabel="A partir de R$ 499 / aporte"
              className="border-0 shadow-none"
            />
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Reserve",
              text: "Escolha o modelo e trave o aparelho na loja.",
            },
            {
              title: "Aporte via Pix",
              text: "Pague no seu ritmo até completar o valor.",
            },
            {
              title: "Retire",
              text: "Quando quitar, retire no Itaim ou São Caetano.",
            },
          ].map((step, index) => (
            <Card key={step.title} className="bg-[var(--bg-subtle)] border-transparent">
              <p className="text-sm font-semibold text-[var(--accent)]">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[var(--ink-muted)]">{step.text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Nossas lojas
          </h2>
          <p className="mt-2 text-[var(--ink-muted)]">
            Atendimento iPlanet com a mesma experiência em duas unidades.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                name: "Itaim Bibi",
                city: "São Paulo · SP",
                address: "Região Itaim Bibi",
              },
              {
                name: "São Caetano",
                city: "São Caetano do Sul · SP",
                address: "Centro / ABC",
              },
            ].map((store) => (
              <Card key={store.name} className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-lavender)] text-[var(--accent)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {store.name}
                  </h3>
                  <p className="text-[var(--ink-muted)]">{store.city}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {store.address}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-[32px] bg-[var(--ink)] px-8 py-12 text-white md:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[var(--accent)]">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em]">
                  PWA
                </span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Instale no celular
              </h2>
              <p className="mt-3 max-w-xl text-white/70">
                Acompanhe aportes, catálogo e retirada como um app nativo.
              </p>
            </div>
            <Link href="/criar-conta">
              <Button variant="accent" size="lg">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-8 text-center text-sm text-[var(--ink-muted)]">
        © {new Date().getFullYear()} iPlanet Pay · Itaim Bibi & São Caetano
      </footer>
    </div>
  );
}
