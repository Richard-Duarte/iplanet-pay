export const MAINTENANCE_OPTIONS = [
  { id: "troca_tela", label: "Troca de Tela" },
  { id: "troca_bateria", label: "Troca de Bateria" },
  { id: "troca_camera", label: "Troca de Câmera/Lente" },
  { id: "reparo_placa", label: "Reparo em Placa/Outros" },
  { id: "nunca_aberto", label: "Nunca foi aberto/Mexido" },
] as const;

export type MaintenanceOptionId = (typeof MAINTENANCE_OPTIONS)[number]["id"];

export const USED_DEVICE_STATUS_LABEL = {
  pending: "Pendente de Avaliação",
  approved: "Aprovado",
  rejected: "Recusado",
} as const;

export const MAX_USED_DEVICE_PHOTOS = 5;
