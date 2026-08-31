export const STATUS_SOLICITACAO_LABELS: Record<string, { label: string; bg: string; text: string; badgeBg: string; badgeText: string }> = {
    AGUARDANDO: { label: "Aguardando aprovação", bg: "bg-orange-200", text: "text-orange-hover", badgeBg: "bg-white-primary", badgeText: "text-orange-hover" },
    AGENDADA: { label: "Coleta agendada", bg: "bg-blue-primary", text: "text-white-primary", badgeBg: "bg-black/20", badgeText: "text-white-primary" },
    EM_ROTA: { label: "Em rota", bg: "bg-violet-primary", text: "text-white-primary", badgeBg: "bg-black/20", badgeText: "text-white-primary" },
    CONCLUIDA: { label: "Concluída", bg: "bg-green-400", text: "text-white-primary", badgeBg: "bg-black/20", badgeText: "text-white-priamry" },
    REPROVADA: { label: "Reprovado", bg: "bg-red-200", text: "text-red-primary", badgeBg: "bg-white-primary", badgeText: "text-red-primary" },
};

export function getStatusSolicitacaoInfo(status: string) {
  return STATUS_SOLICITACAO_LABELS[status] || {
    label: status,
    bg: "bg-white-200",
    text: "text-black-primary",
    badgeBg: "bg-white-primary",
    badgeText: "text-black-primary",
  }
}