# iPlanet Pay

Layaway inteligente (crediário via Pix) para produtos Apple nas lojas **iPlanet** (Itaim Bibi & São Caetano).

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · framer-motion · recharts**.

UI 100% pt-BR · accent `#FF6A00` · estética Apple-premium.

## Bootstrap admin

| Campo | Valor |
|-------|-------|
| E-mail | `admin@iplanet.com.br` |
| Senha | `1234` |
| Papel | `admin` (profiles + app_metadata) |

> Credenciais de bootstrap pedidas pelo time — troque em produção.

## Como rodar

```bash
cp .env.example .env.local
# preencha Supabase; deixe MP/AI/Telegram/Resend vazios até o produto 100%
npm install
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000).

## O que já está pronto

- Landing com catálogo (hero) + deep link `?product=slug` → auth → reserva
- Estoque infinito (RPCs sem hold em `store_stock`; UI de estoque removida)
- Back button consistente + logo `public/logo-iplanet.png`
- Motion (page transitions, cards, parallax)
- Admin Dashboards (`/admin/dashboards`) + `analytics_events`
- FAQ chat + WhatsApp handoff (`app_settings.whatsapp_support`)
- Stubs agente/Telegram (`/api/agent/*`) — 503 sem chaves
- E-mails brandados (confirm / aporte / lembrete 30d) + `email_outbox` + cron stub

## Bloqueado em chaves (não inventar)

| Chave | Uso |
|-------|-----|
| `MERCADOPAGO_*` | Pix real |
| `RESEND_API_KEY` | Envio real de e-mail (senão outbox) |
| `TELEGRAM_BOT_TOKEN` / `AGENT_API_KEY` | Agente |
| `CRON_SECRET` | Lembrete 30 dias |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks Pix + outbox + cron RPC |

## E-mails

- Templates HTML: `src/lib/email/templates/`
- Auth Confirm signup: `supabase/templates/confirm-signup.html` (colar no dashboard Auth)
- Preview admin: `/admin/emails/preview?template=aporte_confirmado`
- Cron: `GET/POST /api/cron/aporte-reminder` com `Authorization: Bearer $CRON_SECRET`

## Rotas principais

| Path | Descrição |
|------|-----------|
| `/` | Landing / catálogo |
| `/entrar` · `/criar-conta` | Auth (+ `?product=`) |
| `/app/*` | Cliente |
| `/admin/dashboards` | Métricas |
| `/admin/config` | WhatsApp, agente, lojas |
| `/admin/emails/preview` | QA e-mails |

## Migrations

`supabase/migrations/001` … `012` — projeto live `zjnikfrledckmjahwnsb`.
