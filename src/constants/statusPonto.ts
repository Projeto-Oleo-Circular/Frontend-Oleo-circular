export const STATUS_PONTO_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  PENDENTE: { label: "Aguardando aprovação", bg: "bg-orange-primary", text: "text-white-primary" },
  APROVADO: { label: "Aprovado", bg: "bg-green-400", text: "text-white-primary" },
  REJEITADO: { label: "Rejeitado", bg: "bg-red-primary", text: "text-white-primary" },
};

export function getStatusPontoInfo(status: string) {
  return STATUS_PONTO_LABELS[status] || { label: status, bg: "bg-white-200", text: "text-black-primary" };
}