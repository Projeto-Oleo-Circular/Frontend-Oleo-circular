export const STATUS_SOLICITACAO_LABELS: Record<string, { label: string; bg: string; text: string }> = {
    AGUARDANDO: { label: "Aguardando aprovação", bg: "bg-orange-200", text: "text-orange-hover" },
    AGENDADA: { label: "Coleta agendada", bg: "bg-blue-primary", text: "text-white-primary" },
    EM_ROTA: { label: "Em rota", bg: "bg-purple-primary", text: "text-white-primary" },
    CONCLUIDA: { label: "Concluída", bg: "bg-green-100", text: "text-green-priamry" },
    REPROVADA: { label: "Reprovado", bg: "bg-red-200", text: "text-red-primary" },

};

export function getStatusSolicitacaoInfo(status: string) {
  return STATUS_SOLICITACAO_LABELS[status] || { label: status, bg: "bg-white-200", text: "text-black-primary" };
}