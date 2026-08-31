import type { StatusSolicitacao } from "../../services/AdminSolicitacaoService";
// ============================================================ // STATUS DE SOLICITAÇÃO // ============================================================ 
const STATUS_SOLICITACAO_CONFIG: Record< StatusSolicitacao, { label: string; className: string; } > = {
     AGUARDANDO: { label: "Aguardando", className: "bg-orange-100 text-orange-600", },
     AGENDADA: { label: "Agendada", className: "bg-blue-100 text-blue-600", }, EM_ROTA: { label: "Em Rota", className: "bg-violet-100 text-violet-primary", }, 
     CONCLUIDA: { label: "Concluída", className: "bg-green-100 text-green-600", }, }; 
// ============================================================ // STATUS DE APROVAÇÃO - PONTO DE COLETA // ============================================================ 
export type StatusAprovacaoPonto = | "PENDENTE" | "APROVADO" | "REJEITADO";
const STATUS_APROVACAO_PONTO_CONFIG: Record< StatusAprovacaoPonto, { label: string; className: string; } > = { 
    PENDENTE: { label: "Pendente", className: "bg-orange-100 text-orange-600", }, 
    APROVADO: { label: "Aprovado", className: "bg-green-100 text-green-700", }, 
    REJEITADO: { label: "Rejeitado", className: "bg-red-100 text-red-600", }, };
// ============================================================ // STATUS DE APROVAÇÃO - PARCEIRO // ============================================================ 
export type StatusAprovacaoParceiro = | "PENDENTE" | "APROVADO" | "REJEITADO"; const STATUS_APROVACAO_PARCEIRO_CONFIG: Record<
StatusAprovacaoParceiro, { label: string; className: string; } > = { 
    PENDENTE: { label: "Pendente", className: "bg-orange-100 text-orange-600", }, 
    APROVADO: { label: "Aprovado", className: "bg-green-100 text-green-700", }, 
    REJEITADO: { label: "Rejeitado", className: "bg-red-100 text-red-600", }, }; 
// ============================================================ // PROPS // ============================================================ 
interface StatusBadgeSolicitacaoProps { status: StatusSolicitacao; tipo?: "solicitacao"; } 
interface StatusBadgePontoProps { status: StatusAprovacaoPonto; tipo: "ponto"; }
 interface StatusBadgeParceiroProps { status: StatusAprovacaoParceiro; tipo: "parceiro"; }
  type StatusBadgeProps = | StatusBadgeSolicitacaoProps | StatusBadgePontoProps | StatusBadgeParceiroProps; 
  // ============================================================ // COMPONENTE // ============================================================ 
function StatusBadge({ status, tipo = "solicitacao", }: StatusBadgeProps) { 
    const config = tipo === "ponto" ? STATUS_APROVACAO_PONTO_CONFIG[ status as StatusAprovacaoPonto ] : 
    tipo === "parceiro" ? STATUS_APROVACAO_PARCEIRO_CONFIG[ status as StatusAprovacaoParceiro ] : STATUS_SOLICITACAO_CONFIG[ status as StatusSolicitacao ];
     if (!config) { return null; } return ( <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.className}`} > {config.label} </span> ); } 
export default StatusBadge;