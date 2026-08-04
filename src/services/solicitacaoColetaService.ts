import api from './api'

export interface SolicitacaoColeta {
    id: number
    pontoColetaId: number
    status: 'AGUARDANDO' | 'AGENDADA' | 'EM_ROTA' | 'CONCLUIDA'
    volumeInformado: number
    volumeColetado?: number | null
    observacoes?: string | null
    dataSolicitacao: string | null
    dataAgendamento?: string | null
    dataConclusao?: string | null
}

export interface CriarSolicitacaoRequest {
    pontoColetaId: number
    volumeInformado: number
    observacao?: string
}

export const solicitacaoColetaService = {
    /**
     * Criar uma nova solicitaçãom de coleta
     */

    async criarSolicitacao(data: CriarSolicitacaoRequest): Promise<SolicitacaoColeta> {
        const response = await api.post('/solicitacoes-coleta', data)
        return response.data
    },

    /**
     * Lista todas as solicitações do parceiro logado
     */
    async listarSolicitacoes(): Promise<SolicitacaoColeta[]> {
        const response = await api.get('/solicitacoes-coleta');
        return response.data;
    },
}