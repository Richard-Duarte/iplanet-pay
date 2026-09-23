export function mapWalletError(message: string | null | undefined): string {
  if (!message) return "Não foi possível concluir o aporte.";
  const m = message.toLowerCase();
  if (m.includes("autenticado")) return "Entre para continuar.";
  if (m.includes("mínimo") || m.includes("minimo") || m.includes("r$ 5")) {
    return "Valor mínimo de R$ 5,00 por aporte.";
  }
  if (m.includes("ativas") || m.includes("ativa")) {
    return "Só é possível aportar em reservas ativas.";
  }
  if (m.includes("quitada")) return "Reserva já está quitada.";
  if (m.includes("não encontrada") || m.includes("nao encontrada")) {
    return "Reserva ou aporte não encontrado.";
  }
  if (m.includes("não pode aportar") || m.includes("nao pode aportar")) {
    return "Você não pode aportar nesta reserva.";
  }
  if (m.includes("service_role") || m.includes("restrito")) {
    return "Confirmação de aporte só via webhook/serviço.";
  }
  if (m.includes("staff/admin")) {
    return "Apenas staff/admin podem confirmar aportes manualmente.";
  }
  if (m.includes("gateway") || m.includes("mercado pago") || m.includes("token")) {
    return message;
  }
  return message;
}
