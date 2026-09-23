# Demo seed — apresentação iPlanet Pay

Seed idempotente aplicado no projeto Supabase `zjnikfrledckmjahwnsb`.

## Arquivo

- `supabase/seed_demo.sql` — reexecutável (apaga `*@iplanetpay.demo` e recria)
- Migration remota: `seed_demo_clients` (via Supabase MCP)

## Contas demo (cliente)

| Campo | Valor |
|-------|--------|
| E-mails | `demo.cliente01@iplanetpay.demo` … `demo.cliente20@iplanetpay.demo` |
| Senha (todas) | `DemoCliente123!` |
| Papel | `cliente` |
| Termos | `withdrawal-v1` aceitos |

Admin existente (não faz parte do seed): `admin@iplanet.com.br`.

## O que o seed cria

- **20** clientes com nomes/telefones BR
- **~24** reservas (20 + 4 extras) nas lojas Itaim / São Caetano, produtos reais do catálogo
- Status mix: ~11–15 `ativa`, 4 `quitada`, 2 `retirada`, 2 `cancelada`, 1 `saque_pendente`
- **~87** aportes Pix `confirmed` (`gateway_provider = demo`, ids `demo-pix-…`)
- `wallet_ledger` tipo `aporte` (+ bônus de indicação)
- **5** `payment_goals` ligadas a reservas
- **5** indicações entre clientes demo (3 completed com bônus)

`amount_paid_cents` = soma dos aportes confirmados da reserva.

## Como reaplicar

No SQL Editor do Supabase (ou MCP `execute_sql` / `apply_migration`):

```bash
# conteúdo de supabase/seed_demo.sql
```

Requer extensão `pgcrypto` no schema `extensions` (já padrão no Supabase).

## Login rápido para smoke

1. `/entrar` → `demo.cliente01@iplanetpay.demo` / `DemoCliente123!` → `/app`
2. Admin → Clientes / Reservas / Financeiro devem listar dados densos
