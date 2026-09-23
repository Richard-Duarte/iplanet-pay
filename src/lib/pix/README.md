# Pix

- Geração: `generatePixForReservation` → `create_contribution` + Mercado Pago (`MERCADOPAGO_ACCESS_TOKEN` / `MERCADO_PAGO_ACCESS_TOKEN`).
- Sem token: aporte `pending` + erro pt-BR claro — **não** inventa QR.
- Webhook: `/api/webhooks/pix` e Edge `pix-webhook` → `webhooks_inbox` + `confirm_contribution` (service_role).
- Assinatura: stub; `MERCADOPAGO_WEBHOOK_SECRET` opcional (documentado no código).
