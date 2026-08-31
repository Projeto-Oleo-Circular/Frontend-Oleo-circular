import api from "./api";

export interface PontoColeta {
    id: number;
    parceiroId: number;
    categoriaId: string;
    categoria?: string;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string | null;
    complemento: string | null;
    expectativaGeracao: number | string;
    capacidadeBombona: number;
    nivelAtualPct: number;
    statusBombona: string;
    statusAprovacaoPontoColeta: string;
    nomePontoColeta: string;
    atualizadoEm: string | null;
}

export interface CriarPontoColetaPayload {
    nomePontoColeta: string;
    categoria: number;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado?: string;
    complemento?: string | null;
    expectativaGeracao: number;
    capacidadeBombona?: number;
    nivelAtualPct?: number;
    statusBombona?: string;
    latitude?: string;
    longitude?: string;
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
     * POST /pontos-coleta
     * Cria um novo ponto de coleta caso o usuário crie adicionais após o cadastro.
     */
    async criarPontoColeta(payload: CriarPontoColetaPayload): Promise<PontoColeta> {
        const { data } = await api.post<PontoColeta>("/pontos-coleta", payload);
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

    async buscarPontoPorId(id: number): Promise<PontoColeta> {
        const { data } = await api.get<PontoColeta>(`/pontos-coleta/${id}`);
        return data;
    },

    /**
     * DELETE /parceiros/pontos-coleta/:id
     * Exclui um ponto de coleta pertencente ao parceiro autenticado
     */
    async excluirPontoColeta(id: number): Promise<void> {
        await api.delete(`/parceiros/pontos-coleta/${id}`);
    },
};