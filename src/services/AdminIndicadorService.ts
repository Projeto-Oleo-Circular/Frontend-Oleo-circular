// src/services/AdminIndicadorService.ts

import api from "./api";

export type TipoIndicador =
  | "ASSOCIACAO"
  | "COOPERATIVA"
  | "ONG";

export interface ParceiroIndicador {
  id: number;
  nome: string;
  tipo: TipoIndicador;
  cnpj: string;
  email?: string | null;
  telefone?: string | null;
  site?: string | null;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarIndicadorDTO {
  nome: string;
  tipo: TipoIndicador;
  cnpj: string;
  email?: string;
  telefone?: string;
  site?: string;
  ativo?: boolean;
}

export interface AtualizarIndicadorDTO {
  nome?: string;
  tipo?: TipoIndicador;
  cnpj?: string;
  email?: string;
  telefone?: string;
  site?: string;
  ativo?: boolean;
}

class AdminIndicadorService {
  async listar(): Promise<ParceiroIndicador[]> {
    const response = await api.get("/admin/indicadores");

    /*
     * Suporta tanto:
     *
     * [...]
     *
     * quanto:
     *
     * {
     *   items: [...]
     * }
     */
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.items ?? [];
  }

  async listarAtivos(): Promise<ParceiroIndicador[]> {
    const response = await api.get(
      "/admin/indicadores/ativos"
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.items ?? [];
  }

  async criar(
    dados: CriarIndicadorDTO
  ): Promise<ParceiroIndicador> {
    const response = await api.post(
      "/admin/indicadores",
      dados
    );

    return response.data;
  }

  async atualizar(
    id: number,
    dados: AtualizarIndicadorDTO
  ): Promise<ParceiroIndicador> {
    const response = await api.put(
      `/admin/indicadores/${id}`,
      dados
    );

    return response.data;
  }

  async excluir(id: number): Promise<void> {
    await api.delete(
      `/admin/indicadores/${id}`
    );
  }
}

export const adminIndicadorService =
  new AdminIndicadorService();