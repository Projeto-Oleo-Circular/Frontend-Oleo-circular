export const STATUS_PONTO_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  PENDENTE: { label: "Aguardando aprovação", bg: "bg-orange-100", text: "text-orange-primary" },
  APROVADO: { label: "Aprovado", bg: "bg-green-100", text: "text-green-primary" },
  REPROVADO: { label: "Reprovado", bg: "bg-red-100", text: "text-red-primary" },
};

export function getStatusPontoInfo(status: string) {
  return STATUS_PONTO_LABELS[status] || { label: status, bg: "bg-white-200", text: "text-black-primary" };
}