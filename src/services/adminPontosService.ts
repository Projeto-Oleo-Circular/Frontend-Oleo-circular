import api from "./api";

export type StatusAprovacao =
  | "PENDENTE"
  | "APROVADO"
  | "REJEITADO";

export interface Parceiro {
  id: number;
  tipoPessoa: string;
  tipoParceiro: string;
  nomeRazaoSocial: string;
  nomeSocial?: string | null;
  email: string;
  documento?: string;
  telefone?: string;
  responsavelLegalNome?: string;
  statusAprovacaoParceiro: StatusAprovacao;
  criadoEm?: string;
}

export interface PontoColetaAdmin {
  id: number;
  nomePontoColeta: string;
  capacidadeBombona: number;
  statusAprovacaoPontoColeta: StatusAprovacao;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado?: string;

  parceiro: {
    id: number;
    nomeRazaoSocial: string;
    email?: string;
    documento?: string;
  };
}

export interface ListarPontosParams {
  page?: number;
  limit?: number;
  statusAprovacao?: StatusAprovacao | "";
  nomePonto?: string;
  parceiro?: string;
}

export interface ListarPontosResponse {
  items: PontoColetaAdmin[];
  total: number;
  page: number;
  totalPages: number;
}

export const adminPontosService = {
  async listarPontos(
    params: ListarPontosParams
  ): Promise<ListarPontosResponse> {
    const { data } = await api.get<ListarPontosResponse>(
      "/admin/pontos",
      { params }
    );

    return data;
  },

  async listarParceiros(): Promise<Parceiro[]> {
    const { data } = await api.get<Parceiro[]>(
      "/admin/parceiros"
    );

    return data;
  },

 async atualizarStatusParceiro(data: {
  id: number | string;
  status: StatusAprovacao;
  observacao?: string;
}) {
  const response = await api.patch(
    `/admin/parceiros/${data.id}/status`,
    data
  );

  return response.data;
},

  async atualizarStatusPonto(data: {
    id:  number;
    status: StatusAprovacao;
    observacao?: string;
  }) {
    const response = await api.patch(
      `/admin/pontos/${data.id}/status`,
      data
    );

    return response.data;
  },
};