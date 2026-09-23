"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { ruleBasedResponder, matchFaq } from "@/lib/agent/faq";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "bot";
  text: string;
  handoff?: boolean;
}

export function FaqChat({
  whatsappDigits,
}: {
  whatsappDigits?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Olá! Posso ajudar com Pix, lojas, reserva e retirada. Em que posso ajudar?",
    },
  ]);

  const waLink = useMemo(() => {
    const digits = (whatsappDigits ?? "").replace(/\D/g, "");
    if (!digits) return null;
    const text = encodeURIComponent(
      "Olá! Preciso de ajuda com o iPlanet Pay.",
    );
    return `https://wa.me/${digits}?text=${text}`;
  }, [whatsappDigits]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    const raw = await ruleBasedResponder.answer(q);
    const handoff = raw === "__HANDOFF__" || matchFaq(q) === "__HANDOFF__" || /humano|whatsapp|atendente|suporte|problema/i.test(q);
    const text = handoff
      ? "Entendi. Posso te conectar com um atendente no WhatsApp."
      : raw === "__HANDOFF__"
        ? "Posso te conectar com um atendente no WhatsApp."
        : raw;
    setMsgs((m) => [...m, { role: "bot", text, handoff }]);
  }

  useEffect(() => {
    // no-op mount
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-lg transition hover:scale-105 md:bottom-8 md:right-8"
        aria-label="Abrir chat FAQ"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed bottom-40 right-4 z-40 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-2xl md:bottom-28 md:right-8">
          <div className="bg-[var(--ink)] px-4 py-3 text-white">
            <p className="text-sm font-semibold">Ajuda iPlanet</p>
            <p className="text-xs text-white/70">FAQ · WhatsApp se precisar</p>
          </div>
          <div className="flex max-h-80 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--ink)]",
                )}
              >
                {m.text}
                {m.handoff ? (
                  <div className="mt-2">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full bg-[var(--whatsapp)] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Falar no WhatsApp
                      </a>
                    ) : (
                      <p className="text-xs text-[var(--ink-muted)]">
                        WhatsApp do suporte ainda não configurado no admin.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-[var(--line)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida…"
              className="flex-1 rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-white"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
