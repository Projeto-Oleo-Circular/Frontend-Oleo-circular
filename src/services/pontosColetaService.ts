import api from "./api"; // ajuste para o caminho real da sua instância do axios

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
}

export interface AtualizarNivelBombonaRequest {
    pontoColetaId: number
    nivel: number
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
};