# Templates de e-mail Auth (Supabase)

## confirm-signup.html

1. Abra o projeto Supabase → **Authentication → Email Templates → Confirm signup**.
2. Cole o HTML de `confirm-signup.html`.
3. Em **Authentication → URL Configuration**, defina Site URL = `NEXT_PUBLIC_APP_URL` (ex.: `https://pay.iplanet.com.br` ou `http://127.0.0.1:3000`).
4. Para SMTP customizado (Resend/etc.): **Project Settings → Auth → SMTP**, usando `RESEND_API_KEY` / `EMAIL_FROM`.

Enquanto o SMTP customizado não estiver ativo, o app também enfileira um e-mail de boas-vindas pós-signup via `src/lib/email` → `email_outbox` (ou Resend se `RESEND_API_KEY` estiver setada).
