export type AgentTaskKind =
  | "create_product"
  | "list_reservations"
  | "send_report"
  | "alert_admin"
  | "screenshot_placeholder"
  | "answer_faq";

export interface AgentTask {
  id: string;
  kind: AgentTaskKind;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AgentToolResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

export interface AgentResponder {
  answer(question: string, context?: Record<string, unknown>): Promise<string>;
}
