// src/services/impactoAmbientalService.ts

import api from "./api";

export interface ImpactoAmbientalBase {
  volumeTotalColetado: number;
  biodieselEstimadoLitros: number;
  energiaBiodieselMj: number;
  dieselEquivalenteLitros: number;
  co2EvitadoKg: number;
  residuoDesviadoKg: number;
}

export interface ImpactoAmbientalGeral
  extends ImpactoAmbientalBase {
  totalParceiros: number;
  totalPontos: number;
  totalColetas: number;
}

export interface ImpactoAmbientalParceiro
  extends ImpactoAmbientalBase {
  parceiroId: number;
  nome: string | null;
  razaoSocial: string | null;
  totalPontos: number;
  totalColetas: number;
}

export interface ImpactoAmbientalPonto
  extends ImpactoAmbientalBase {
  pontoId: number;
  parceiroId: number;
  nomePontoColeta: string;
  cidade: string | null;
  estado: string | null;
  totalColetas: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const impactoAmbientalService = {
  // ADMIN - visão de toda a plataforma
  async getGeralAdmin() {
    const response =
      await api.get<ApiResponse<ImpactoAmbientalGeral>>(
        "/impacto-ambiental/admin/geral"
      );

    return response.data.data;
  },

  // ADMIN - parceiro específico
  async getParceiroAdmin(parceiroId: number) {
    const response =
      await api.get<ApiResponse<ImpactoAmbientalParceiro>>(
        `/impacto-ambiental/admin/parceiros/${parceiroId}`
      );

    return response.data.data;
  },

  // ADMIN - ponto específico
  async getPontoAdmin(pontoId: number) {
    const response =
      await api.get<ApiResponse<ImpactoAmbientalPonto>>(
        `/impacto-ambiental/admin/pontos/${pontoId}`
      );

    return response.data.data;
  },

  // PARCEIRO - visão de todos os próprios pontos
  async getMeuImpacto() {
    const response =
      await api.get<ApiResponse<ImpactoAmbientalParceiro>>(
        "/impacto-ambiental/parceiro/me"
      );

    return response.data.data;
  },

  // PARCEIRO - um dos próprios pontos
  async getMeuPonto(pontoId: number) {
    const response =
      await api.get<ApiResponse<ImpactoAmbientalPonto>>(
        `/impacto-ambiental/parceiro/pontos/${pontoId}`
      );

    return response.data.data;
  },
};