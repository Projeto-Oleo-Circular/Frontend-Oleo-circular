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

export interface ParceiroResumo {
    id: number;
    tipoPessoa: string;
    tipoParceiro: string;
    razaoSocial: string;
    nomeParceiro?: string;
    nome: string | null;
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
    dataSolicitacao?: string;
    endereco?: string;
    page?: number;
    limit?: number;
}

export interface CriarSolicitacaoPayload {
    pontoColetaId: number;
    tamanhoBombona: number;
    observacoes?: string;
}

export const STATUS_SOLICITACAO: StatusSolicitacao[] = [
    'AGUARDANDO',
    'AGENDADA',
    'EM_ROTA',
    'CONCLUIDA',
];

export const adminSolicitacoesService = {
    /**
     * Listar solicitações com filtros (admin)
     */
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

async criar(payload: CriarSolicitacaoPayload): Promise<SolicitacaoColeta> {
    const response = await api.post<SolicitacaoColeta>(
        '/admin/solicitacoes-coleta',
        {
            pontoColetaId: payload.pontoColetaId,
            volumeInformado: payload.tamanhoBombona,
            // ✅ Se observacoes for undefined ou vazio, não envia o campo
            ...(payload.observacoes && payload.observacoes.trim() !== '' && {
                observacoes: payload.observacoes.trim()
            }),
        }
    );
    return response.data;
},
    /**
     * Atualizar status de uma solicitação (admin)
     * PATCH /admin/solicitacoes-coleta/{id}/status
     */
    async atualizarStatus(
        id: number,
        dados: {
            status: StatusSolicitacao;
            dataAgendamento?: string;
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