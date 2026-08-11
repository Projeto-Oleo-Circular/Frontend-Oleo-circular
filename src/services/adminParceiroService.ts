import api from "./api";

export type StatusAprovacao = "PENDENTE" | "APROVADO" | "REJEITADO";

export interface Parceiro {
  id: number;
  tipoPessoa: string;
  tipoParceiro: string;
  razaoSocial: string;
  nome?: string | null;
  email: string;
  documento?: string;
  telefone?: string;
  responsavelLegal?: string;
  statusAprovacaoParceiro: StatusAprovacao;
  criadoEm?: string;

  parceiroIndicadorId?: number | string | null;
  parceiroIndicador?: {
    id: number;
    nome: string;
    tipo?: string;
  } | null;
  outroParceiro?: string | null;
}


export interface ListarParceirosParams {
  page?: number;
  limit?: number;
  statusAprovacao?: StatusAprovacao | "";
  busca?: string; // Para buscar por nome ou documento se o backend suportar
}

export interface ListarParceirosResponse {
  items: Parceiro[];
  total: number;
  page: number;
  totalPages: number;
}

export const adminParceiroService = {
  // Aceita tanto retorno paginado quanto array direto do backend
  async listarParceiros(params?: ListarParceirosParams): Promise<ListarParceirosResponse | Parceiro[]> {
    const { data } = await api.get("/admin/parceiros", { params });
    return data;
  },

  async atualizarStatusParceiro(data: {
    id: number | string;
    status: StatusAprovacao;
    observacao?: string;
  }) {
    const response = await api.patch(`/admin/parceiros/${data.id}/status`, data);
    return response.data;
  },
};