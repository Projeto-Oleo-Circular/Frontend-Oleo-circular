import api from "./api";

export interface PontoColeta {
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
    atualizadoEm: string | null;
}

export interface AtualizarNivelBombonaRequest {
    pontoColetaId: number;
    nivel: number;
}

export const pontosColetaService = {
    /**
     * GET /pontos-coleta/meus
     * Lista os pontos de coleta cadastrados pelo parceiro logado.
     */
    async listarMeusPontos(): Promise<PontoColeta[]> {
        const { data } = await api.get<PontoColeta[]>("/pontos-coleta/meus");
        return data;
    },

    /**
     * PUT /pontos-coleta/:id
     * Atualiza os dados do ponto de coleta (ex: nível da bombona e status).
     */
    async atualizarPontoColeta(
        id: number,
        dados: Partial<PontoColeta>
    ): Promise<PontoColeta> {
        const { data } = await api.put<PontoColeta>(`/pontos-coleta/${id}`, dados);
        return data;
    },
};