import { createClient } from "@supabase/supabase-js";

export type EmailTemplate =
  | "confirm_account"
  | "welcome"
  | "aporte_confirmado"
  | "aporte_reminder"
  | "withdrawal_approved";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template: EmailTemplate;
  payload?: Record<string, unknown>;
}

function serviceOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function enqueueOutbox(input: SendEmailInput, status: "pending" | "sent" | "failed", error?: string) {
  const admin = serviceOrNull();
  if (!admin) {
    console.info("[email_outbox:memory]", status, input.template, input.to, error);
    return;
  }
  await admin.from("email_outbox").insert({
    to_email: input.to,
    template: input.template,
    payload: {
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.payload ?? {}),
      error: error ?? null,
    },
    status,
  });
}

/** Send via Resend when RESEND_API_KEY set; otherwise queue email_outbox. */
export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  mode: "resend" | "outbox";
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "noreply@iplanet.com.br";

  if (!apiKey) {
    await enqueueOutbox(input, "pending");
    console.info(
      `[email] stub outbox · template=${input.template} to=${input.to} (RESEND_API_KEY vazio)`,
    );
    return { ok: true, mode: "outbox" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `iPlanet Pay <${from}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      await enqueueOutbox(input, "failed", errText);
      return { ok: false, mode: "resend", error: errText };
    }
    await enqueueOutbox(input, "sent");
    return { ok: true, mode: "resend" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao enviar";
    await enqueueOutbox(input, "failed", message);
    return { ok: false, mode: "resend", error: message };
  }
}
