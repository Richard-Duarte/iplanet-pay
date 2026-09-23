import type { AgentResponder } from "./types";

const FAQ: Array<{ keys: string[]; answer: string }> = [
  {
    keys: ["pix", "pagamento", "pagar", "aporte"],
    answer:
      "Você reserva o aparelho e faz aportes via Pix no seu ritmo até quitar. Quando o saldo atingir o valor, retire na loja.",
  },
  {
    keys: ["loja", "lojas", "itaim", "caetano", "onde"],
    answer:
      "Temos unidades em Itaim Bibi (São Paulo) e São Caetano do Sul. Escolha a loja na reserva.",
  },
  {
    keys: ["reserva", "reservar", "segurar"],
    answer:
      "Escolha o produto no catálogo, entre na conta e confirme a loja de retirada. A reserva fica ativa enquanto você aporte.",
  },
  {
    keys: ["retirada", "retirar", "pegar"],
    answer:
      "Após quitar a reserva, vá até a loja escolhida. A equipe confirma a retirada no painel.",
  },
  {
    keys: ["cancelar", "cancelamento"],
    answer:
      "Você pode cancelar uma reserva ativa pelo app. Em caso de aportes já confirmados, fale com o suporte.",
  },
  {
    keys: ["humano", "atendente", "whatsapp", "ajuda", "suporte", "problema"],
    answer: "__HANDOFF__",
  },
];

export function matchFaq(question: string): string | null {
  const q = question.toLowerCase();
  for (const item of FAQ) {
    if (item.keys.some((k) => q.includes(k))) return item.answer;
  }
  return null;
}

/** Rule-based FAQ; swap for LLM when AGENT_API_KEY is set. */
export const ruleBasedResponder: AgentResponder = {
  async answer(question) {
    return (
      matchFaq(question) ??
      "Não encontrei isso no FAQ. Posso te conectar ao WhatsApp do suporte."
    );
  },
};
