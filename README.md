# iPlanet Pay

PWA de layaway (crediário via Pix) para smartphones nas lojas **iPlanet** (Itaim Bibi & São Caetano).

Stack desta fase: **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase Auth · PWA**.

> Fase atual: esqueleto + design system + auth (mock ou Supabase). Módulos financeiros são placeholders com TODO claros — sem fluxos de dinheiro inventados.

## Como rodar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Modo demo (mock auth)

Se `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem vazios, ou se `USE_MOCK_AUTH=true`, o app usa **auth mock**:

1. Vá em **Entrar**
2. Escolha Cliente / Parceiro / Staff / Admin
3. Navegue pelos shells protegidos

### Modo Supabase (real)

Preencha no `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
USE_MOCK_AUTH=false
```

Aplique a migration:

```bash
# via Supabase CLI ou SQL Editor
supabase db push
# ou cole supabase/migrations/001_init.sql no SQL Editor
```

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |

## Rotas

| Path | Descrição |
|------|-----------|
| `/` | Landing |
| `/entrar` · `/criar-conta` | Auth |
| `/app/*` | Shell Cliente |
| `/parceiro` | Dashboard parceiro |
| `/staff` | Operação staff |
| `/admin` | Admin |

## Design system

Tokens em `src/app/globals.css` (`--bg`, `--accent`, `--radius-card`, …).  
Primitivos em `src/components/ui/` (Button, Pill, Card, ProductHeroCard, Progress*, AppShell…).

## Supabase

- Clients: `src/lib/supabase/{client,server,middleware}.ts`
- Migration + RLS: `supabase/migrations/001_init.sql`
- Edge stub Pix: `supabase/functions/pix-webhook/index.ts`

## PWA

- `public/manifest.webmanifest`
- Ícones em `public/icons/`
- Service worker via `@ducanh2912/next-pwa` (produção)

## Papéis

`cliente` · `parceiro` · `staff` · `admin` — redirecionamento pós-login e middleware por prefixo.
