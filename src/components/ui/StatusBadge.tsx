import type { StatusSolicitacao } from "../../services/AdminSolicitacaoService";

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; className: string }> = {
    AGUARDANDO: { label: "Aguardando", className: "bg-orange-100 text-orange-600" },
    AGENDADA: { label: "Agendada", className: "bg-blue-100 text-blue-600" },
    EM_ROTA: { label: "Em Rota", className: "bg-violet-100 text-violet-600" },
    CONCLUIDA: { label: "Concluída", className: "bg-green-100 text-green-700" },
};

function StatusBadge({ status }: { status: StatusSolicitacao }) {
    const config = STATUS_CONFIG[status];
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.className}`}>
            {config.label}
        </span>
    );
}

export default StatusBadge;
