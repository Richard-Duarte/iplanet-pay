import type { AgentTask, AgentToolResult } from "./types";

/** Registry stubs — no live AI / Telegram until keys are connected. */
export const agentTools: Record<
  AgentTask["kind"],
  (task: AgentTask) => Promise<AgentToolResult>
> = {
  create_product: async () => ({
    ok: false,
    message: "Stub: conecte as chaves quando o produto estiver 100%.",
  }),
  list_reservations: async () => ({
    ok: false,
    message: "Stub: listagem de reservas via agente ainda não ativada.",
  }),
  send_report: async () => ({
    ok: false,
    message: "Stub: envio de relatório pendente de configuração.",
  }),
  alert_admin: async () => ({
    ok: false,
    message: "Stub: alertas admin aguardam AGENT_API_KEY / Telegram.",
  }),
  screenshot_placeholder: async () => ({
    ok: true,
    message: "Placeholder de screenshot (sem captura real).",
    data: { url: null },
  }),
  answer_faq: async (task) => ({
    ok: true,
    message: String(task.payload.answer ?? "Consulte o FAQ no app."),
  }),
};

export async function runAgentTask(task: AgentTask): Promise<AgentToolResult> {
  const tool = agentTools[task.kind];
  if (!tool) {
    return { ok: false, message: `Ferramenta desconhecida: ${task.kind}` };
  }
  return tool(task);
}
