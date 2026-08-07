import api from './api';

export type StatusSolicitacao = 'AGUARDANDO' | 'AGENDADA' | 'EM_ROTA' | 'CONCLUIDA';

export interface PontoColetaResumo {
    id: number;
    parceiroId: number;
    categoria: string;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string | null;
    complemento: string | null;
    expectativaGeracao: string;
    capacidadeBombona: number;
    nivelAtualPct: number;
    statusBombona: string;
    statusAprovacaoPontoColeta: string;
    nomePontoColeta: string;
}

// Deliberadamente sem senhaHash — a API devolve esse campo, mas o front não deve
// tipar nem usar. Ver observação sobre isso: vale corrigir no back-end.
export interface ParceiroResumo {
    id: number;
    tipoPessoa: string;
    tipoParceiro: string;
    nomeRazaoSocial: string;
    nomeSocial: string | null;
    email: string;
    documento: string;
    telefone: string;
    responsavelLegalNome: string | null;
    responsavelLegalCpf: string | null;
    redesSociais: string[] | null;
    aceiteMarketing: boolean;
    parceiroIndicadorId: number | null;
    statusAprovacaoParceiro: string;
    criadoEm: string;
}

export interface SolicitacaoColeta {
    id: number;
    pontoColetaId: number;
    status: StatusSolicitacao;
    volumeInformado: number;
    volumeColetado: number | null;
    observacoes: string | null;
    dataSolicitacao: string;
    dataAgendamento: string | null;
    dataConclusao: string | null;
    pontoColeta: PontoColetaResumo;
    parceiro: ParceiroResumo;
}

export interface ListarSolicitacoesResponse {
    items: SolicitacaoColeta[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ListarSolicitacoesFiltros {
    nomePonto?: string;
    status?: StatusSolicitacao;
    solicitante?: string;
    parceiro?: string;
    parceiroIndicadorId?: number;
    capacidadeBombona?: number;
    dataSolicitacao?: string; // AAAA-MM-DD
    endereco?: string;
    page?: number;
    limit?: number;
}

export const STATUS_SOLICITACAO: StatusSolicitacao[] = [
    'AGUARDANDO',
    'AGENDADA',
    'EM_ROTA',
    'CONCLUIDA',
];

export const adminSolicitacoesService = {
    async listar(filtros: ListarSolicitacoesFiltros = {}): Promise<ListarSolicitacoesResponse> {
        const query = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                query.append(key, String(value));
            }
        });

        const response = await api.get<ListarSolicitacoesResponse>(
            `/admin/solicitacoes-coleta?${query.toString()}`
        );
        return response.data;
    },

    /**
     * PATCH /admin/solicitacoes-coleta/{id}/status
     *
     * Regras de validação do back-end (via Zod), pra UI saber quando pedir cada campo:
     * - dataAgendamento é OBRIGATÓRIA quando status === 'AGENDADA'
     * - volumeColetado é OBRIGATÓRIO quando status === 'CONCLUIDA'
     * - dataConclusao é setada automaticamente pelo back-end quando status === 'CONCLUIDA' (não envie)
     */
    
    async atualizarStatus(
        id: number,
        dados: {
            status: StatusSolicitacao;
            dataAgendamento?: string; // ISO 8601
            volumeColetado?: number;
            observacoes?: string;
        }
    ): Promise<SolicitacaoColeta> {
        const response = await api.patch<SolicitacaoColeta>(
            `/admin/solicitacoes-coleta/${id}/status`,
            dados
        );
        return response.data;
    },
};