import { NextResponse } from "next/server";
import { runAgentTask } from "@/lib/agent/tools";
import type { AgentTask } from "@/lib/agent/types";

export async function POST(request: Request) {
  const apiKey = process.env.AGENT_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Agente ainda não configurado. Conecte AGENT_API_KEY quando o produto estiver 100%.",
      },
      { status: 503 },
    );
  }

  const header = request.headers.get("x-agent-key") ?? "";
  if (header !== apiKey) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<AgentTask>;
  if (!body.kind) {
    return NextResponse.json({ ok: false, error: "kind obrigatório" }, { status: 400 });
  }

  const task: AgentTask = {
    id: body.id ?? crypto.randomUUID(),
    kind: body.kind,
    payload: body.payload ?? {},
    created_at: new Date().toISOString(),
  };

  const result = await runAgentTask(task);
  return NextResponse.json({ ok: result.ok, result });
}
