import api from './api'
import { pontosColetaService } from './pontosColetaService'

export interface SolicitacaoColeta {
    id: number
    pontoColetaId: number
    status: 'AGUARDANDO' | 'AGENDADA' | 'EM_ROTA' | 'CONCLUIDA' | 'REPROVADA'
    volumeInformado: number
    volumeColetado?: number | null
    observacoes?: string | null
    dataSolicitacao: string | null
    dataAgendamento?: string | null
    dataConclusao?: string | null
    pontoColeta?: {
        id: number
        nome: string
        endereco: string
    }
}

export interface CriarSolicitacaoRequest {
    pontoColetaId: number
    volumeInformado: number
    observacoes?: string
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

export function getNomePonto(pontoColeta: any): string {
    return pontoColeta?.nomePontoColeta || pontoColeta?.nome || "Ponto de coleta"
}

export function getEnderecoPonto(pontoColeta: any): string {
    if (pontoColeta?.endereco) return pontoColeta.endereco
    if (pontoColeta?.logradouro) {
        const partes = [
            `${pontoColeta.logradouro}${pontoColeta.numero ? `, ${pontoColeta.numero}` : ""}`,
            pontoColeta.bairro,
            pontoColeta.cidade && pontoColeta.estado ? `${pontoColeta.cidade} - ${pontoColeta.estado}` : pontoColeta.cidade,
        ].filter(Boolean)
        return partes.join(" - ")
    }
    return "Endereço não informado"
}

export async function enriquecerComPontoColeta<T extends { pontoColetaId: number }>(
    solicitacoes: T[]
): Promise<(T & { pontoColeta?: any })[]> {
    return Promise.all(
        solicitacoes.map(async (s) => {
            try {
                const pontoColeta = await pontosColetaService.buscarPontoPorId(s.pontoColetaId)
                return { ...s, pontoColeta }
            } catch {
                return { ...s, pontoColeta: undefined }
            }
        })
    )
}