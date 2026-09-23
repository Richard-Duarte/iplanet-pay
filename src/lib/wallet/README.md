# Carteira / aportes

- **SoT do progresso pago:** `reservations.amount_paid_cents` (só via `confirm_contribution` / `admin_confirm_contribution`).
- **`wallet_ledger`:** extrato append-only; `amount_cents` com sinal (+crédito / −débito).
- **Crédito:** nunca no client. Webhook (service_role) ou staff via `admin_confirm_contribution`.
- **Criação:** `create_contribution` (authenticated, dono, reserva `ativa`, mín. R$5).
