// src/services/AdminIndicadorService.ts

import api from "./api";

// ============================================================
// TIPOS
// ============================================================

export type TipoIndicador =
  | "ASSOCIACAO"
  | "COOPERATIVA"
  | "ONG";

export type StatusAprovacaoPontoColeta =
  | "PENDENTE"
  | "APROVADO"
  | "REJEITADO";

// ============================================================
// PONTO DE COLETA DO PARCEIRO INDICADOR
// ============================================================

export interface PontoColetaIndicador {
  id: number;

  // ==========================================================
  // RELACIONAMENTOS
  // ==========================================================

  parceiroId: number | null;

  parceiroIndicadorId: number | null;

  categoria: number;

  // ==========================================================
  // IDENTIFICAÇÃO
  // ==========================================================

  nomePontoColeta: string;

  // ==========================================================
  // ENDEREÇO
  // ==========================================================

  cep: string;

  logradouro: string;

  numero: string;

  bairro: string;

  cidade: string;

  estado: string;

  complemento?: string | null;

  // ==========================================================
  // BOMBO​NA / GERAÇÃO
  // ==========================================================

  capacidadeBombona: number;

  expectativaGeracao: number;

  nivelAtualPct: number;

  statusBombona: string;

  // ==========================================================
  // APROVAÇÃO
  // ==========================================================

  statusAprovacaoPontoColeta:
    | StatusAprovacaoPontoColeta
    | string;

  // ==========================================================
  // LOCALIZAÇÃO
  // ==========================================================

  latitude: string | number;

  longitude: string | number;

  // ==========================================================
  // DATAS
  // ==========================================================

  criadoEm?: string;

  atualizadoEm?: string;

  createdAt?: string;

  updatedAt?: string;
}

// ============================================================
// PARCEIRO INDICADOR
// ============================================================

export interface ParceiroIndicador {
  id: number;

  nome: string | null;

  /**
   * Mantido como "nomeResposavel" porque esse é o nome
   * utilizado atualmente pelo backend.
   */
  nomeResposavel: string;

  tipo: TipoIndicador;

  cnpj: string;

  email?: string | null;

  telefone?: string | null;

  site?: string | null;

  ativo: boolean;

  municipio: string | null;

  // ==========================================================
  // DATAS
  // ==========================================================

  criadoEm?: string;

  createdAt?: string;

  updatedAt?: string;

  // ==========================================================
  // PONTO DE COLETA
  // ==========================================================

  /**
   * Informa se o indicador possui pelo menos
   * um ponto de coleta.
   */
  temPontoColeta: boolean;

  /**
   * Quantidade de pontos vinculados.
   */
  quantidadePontosColeta: number;

  /**
   * Pontos de coleta vinculados ao indicador.
   */
  pontosColeta: PontoColetaIndicador[];
}

// ============================================================
// DTO - CRIAR INDICADOR
// ============================================================

export interface CriarIndicadorDTO {
  nome: string;

  nomeResposavel: string;

  tipo: TipoIndicador;

  cnpj: string;

  email?: string;

  telefone?: string;

  site?: string;

  ativo?: boolean;

  municipio: string | null;

  /**
   * Senha em texto puro.
   *
   * O FRONTEND NÃO gera hash.
   *
   * O backend recebe "senha" e executa bcrypt.hash().
   */
  senha?: string;
}

// ============================================================
// DTO - ATUALIZAR INDICADOR
// ============================================================

export interface AtualizarIndicadorDTO {
  nome?: string;

  nomeResposavel?: string;

  tipo?: TipoIndicador;

  cnpj?: string;

  email?: string;

  telefone?: string;

  site?: string;

  ativo?: boolean;

  municipio?: string | null;

  /**
   * Pode continuar sendo suportado pelo PUT geral caso
   * seu backend aceite senha em atualizarIndicador().
   *
   * Para alteração explícita de senha, prefira
   * adminIndicadorService.definirSenha().
   */
  senha?: string;
}

// ============================================================
// DTO - DEFINIR SENHA
// ============================================================

export interface DefinirSenhaIndicadorDTO {
  senha: string;
}

// ============================================================
// DTO - CRIAR PONTO
// ============================================================

export interface CriarPontoIndicadorDTO {
  cep: string;

  logradouro: string;

  numero: string;

  bairro: string;

  cidade: string;

  estado: string;

  complemento?: string;

  capacidadeBombona: number;

  expectativaGeracao?: number;

  nivelAtualPct?: number;

  nomePontoColeta: string;

  longitude: string | number;

  latitude: string | number;
}

// ============================================================
// DTO - ATUALIZAR PONTO
// ============================================================

export interface AtualizarPontoIndicadorDTO {
  nomePontoColeta?: string;

  cep?: string;

  logradouro?: string;

  numero?: string;

  bairro?: string;

  cidade?: string;

  estado?: string;

  complemento?: string;

  capacidadeBombona?: number;

  expectativaGeracao?: number;

  nivelAtualPct?: number;

  longitude?: string | number;

  latitude?: string | number;
}

// ============================================================
// RESPOSTAS AUXILIARES
// ============================================================

interface ListaIndicadoresResponse {
  items?: ParceiroIndicador[];

  indicadores?: ParceiroIndicador[];

  data?: ParceiroIndicador[];
}

interface ListaPontosResponse {
  indicadorId?: number;

  quantidade?: number;

  pontos?: PontoColetaIndicador[];

  items?: PontoColetaIndicador[];

  data?: PontoColetaIndicador[];
}

// ============================================================
// NORMALIZAÇÃO
// ============================================================

/**
 * Garante que os campos relacionados aos pontos existam
 * mesmo se alguma rota antiga do backend não retornar todos.
 */
const normalizarIndicador = (
  indicador: ParceiroIndicador
): ParceiroIndicador => {
  const pontos = Array.isArray(
    indicador?.pontosColeta
  )
    ? indicador.pontosColeta
    : [];

  return {
    ...indicador,

    pontosColeta: pontos,

    quantidadePontosColeta:
      indicador?.quantidadePontosColeta ??
      pontos.length,

    temPontoColeta:
      indicador?.temPontoColeta ??
      pontos.length > 0,
  };
};

// ============================================================
// SERVICE
// ============================================================

class AdminIndicadorService {
  // ==========================================================
  // LISTAR TODOS
  // ==========================================================

  async listar(): Promise<
    ParceiroIndicador[]
  > {
    const response =
      await api.get<
        | ParceiroIndicador[]
        | ListaIndicadoresResponse
      >("/admin/indicadores");

    const resposta = response.data;

    let indicadores:
      ParceiroIndicador[] = [];

    if (Array.isArray(resposta)) {
      indicadores = resposta;
    } else if (
      Array.isArray(
        resposta?.items
      )
    ) {
      indicadores =
        resposta.items;
    } else if (
      Array.isArray(
        resposta?.indicadores
      )
    ) {
      indicadores =
        resposta.indicadores;
    } else if (
      Array.isArray(
        resposta?.data
      )
    ) {
      indicadores =
        resposta.data;
    }

    return indicadores.map(
      normalizarIndicador
    );
  }

  // ==========================================================
  // LISTAR ATIVOS
  // ==========================================================

  async listarAtivos(): Promise<
    ParceiroIndicador[]
  > {
    const response =
      await api.get<
        | ParceiroIndicador[]
        | ListaIndicadoresResponse
      >(
        "/admin/indicadores/ativos"
      );

    const resposta = response.data;

    let indicadores:
      ParceiroIndicador[] = [];

    if (Array.isArray(resposta)) {
      indicadores = resposta;
    } else if (
      Array.isArray(
        resposta?.items
      )
    ) {
      indicadores =
        resposta.items;
    } else if (
      Array.isArray(
        resposta?.indicadores
      )
    ) {
      indicadores =
        resposta.indicadores;
    } else if (
      Array.isArray(
        resposta?.data
      )
    ) {
      indicadores =
        resposta.data;
    }

    return indicadores.map(
      normalizarIndicador
    );
  }

  // ==========================================================
  // BUSCAR POR ID
  // ==========================================================

  async buscarPorId(
    id: number
  ): Promise<ParceiroIndicador> {
    const response =
      await api.get(
        `/admin/indicadores/${id}`
      );

    const indicador =
      response.data?.indicador ??
      response.data?.data ??
      response.data;

    return normalizarIndicador(
      indicador
    );
  }

  // ==========================================================
  // CRIAR INDICADOR
  // ==========================================================

  async criar(
    dados: CriarIndicadorDTO
  ): Promise<ParceiroIndicador> {
    /**
     * IMPORTANTE:
     *
     * dados.senha deve ser enviada como:
     *
     * {
     *    ...
     *    senha: "teste123"
     * }
     *
     * O bcrypt fica SOMENTE no backend.
     */

    const payload: CriarIndicadorDTO = {
      ...dados,

      nome:
        dados.nome.trim(),

      nomeResposavel:
        dados.nomeResposavel.trim(),

      cnpj:
        dados.cnpj.replace(
          /\D/g,
          ""
        ),

      email:
        dados.email?.trim() ||
        undefined,

      telefone:
        dados.telefone?.replace(
          /\D/g,
          ""
        ) || undefined,

      site:
        dados.site?.trim() ||
        undefined,

      municipio:
        dados.municipio?.trim() ||
        null,

      senha:
        dados.senha?.trim() ||
        undefined,
    };

    const response =
      await api.post(
        "/admin/indicadores",
        payload
      );

    const indicador =
      response.data?.indicador ??
      response.data?.data ??
      response.data;

    return normalizarIndicador(
      indicador
    );
  }

  // ==========================================================
  // ATUALIZAR INDICADOR
  // ==========================================================

  async atualizar(
    id: number,
    dados: AtualizarIndicadorDTO
  ): Promise<ParceiroIndicador> {
    const payload:
      AtualizarIndicadorDTO = {
      ...dados,
    };

    if (
      dados.nome !== undefined
    ) {
      payload.nome =
        dados.nome.trim();
    }

    if (
      dados.nomeResposavel !==
      undefined
    ) {
      payload.nomeResposavel =
        dados.nomeResposavel.trim();
    }

    if (
      dados.cnpj !== undefined
    ) {
      payload.cnpj =
        dados.cnpj.replace(
          /\D/g,
          ""
        );
    }

    if (
      dados.email !== undefined
    ) {
      payload.email =
        dados.email.trim();
    }

    if (
      dados.telefone !==
      undefined
    ) {
      payload.telefone =
        dados.telefone.replace(
          /\D/g,
          ""
        );
    }

    if (
      dados.site !== undefined
    ) {
      payload.site =
        dados.site.trim();
    }

    if (
      dados.municipio !==
      undefined
    ) {
      payload.municipio =
        dados.municipio?.trim() ||
        null;
    }

    if (
      dados.senha !== undefined
    ) {
      payload.senha =
        dados.senha.trim() ||
        undefined;
    }

    const response =
      await api.put(
        `/admin/indicadores/${id}`,
        payload
      );

    const indicador =
      response.data?.indicador ??
      response.data?.data ??
      response.data;

    return normalizarIndicador(
      indicador
    );
  }

  // ==========================================================
  // DEFINIR / ALTERAR SENHA
  // ==========================================================

  /**
   * Essa é a chamada que estava faltando para o fluxo
   * de dar acesso ao parceiro indicador.
   *
   * Backend:
   *
   * PUT /admin/indicadores/:id/senha
   *
   * BODY:
   *
   * {
   *   "senha": "teste123"
   * }
   */
  async definirSenha(
    indicadorId: number,
    senha: string
  ): Promise<void> {
    if (!indicadorId) {
      throw new Error(
        "ID do parceiro indicador é obrigatório."
      );
    }

    const senhaTratada =
      senha.trim();

    if (!senhaTratada) {
      throw new Error(
        "A senha é obrigatória."
      );
    }

    if (
      senhaTratada.length < 6
    ) {
      throw new Error(
        "A senha deve possuir pelo menos 6 caracteres."
      );
    }

    await api.put(
      `/admin/indicadores/${indicadorId}/senha`,
      {
        senha: senhaTratada,
      } satisfies DefinirSenhaIndicadorDTO
    );
  }

  // ==========================================================
  // ATUALIZAR INDICADOR + SENHA
  // ==========================================================

  /**
   * Método auxiliar.
   *
   * Atualiza os dados do indicador e, caso uma nova senha
   * tenha sido informada, chama a rota específica de senha.
   */
  async atualizarComSenha(
    id: number,
    dados: AtualizarIndicadorDTO,
    novaSenha?: string
  ): Promise<ParceiroIndicador> {
    const {
      senha: senhaDoDTO,
      ...dadosSemSenha
    } = dados;

    const indicador =
      await this.atualizar(
        id,
        dadosSemSenha
      );

    const senha =
      novaSenha?.trim() ||
      senhaDoDTO?.trim();

    if (senha) {
      await this.definirSenha(
        id,
        senha
      );
    }

    /**
     * Busca novamente para garantir que a tela tenha
     * os dados mais recentes do indicador/ponto.
     *
     * senhaHash NÃO deve ser retornado para o frontend.
     */
    try {
      return await this.buscarPorId(
        id
      );
    } catch {
      return indicador;
    }
  }

  // ==========================================================
  // EXCLUIR INDICADOR
  // ==========================================================

  async excluir(
    id: number
  ): Promise<void> {
    await api.delete(
      `/admin/indicadores/${id}`
    );
  }

  // ==========================================================
  // CRIAR PONTO
  // ==========================================================

  async criarPonto(
    indicadorId: number,
    dados: CriarPontoIndicadorDTO
  ): Promise<PontoColetaIndicador> {
    const payload:
      CriarPontoIndicadorDTO = {
      ...dados,

      cep:
        dados.cep.replace(
          /\D/g,
          ""
        ),

      nomePontoColeta:
        dados.nomePontoColeta.trim(),

      logradouro:
        dados.logradouro.trim(),

      numero:
        dados.numero.trim(),

      bairro:
        dados.bairro.trim(),

      cidade:
        dados.cidade.trim(),

      estado:
        dados.estado.trim(),

      complemento:
        dados.complemento?.trim() ||
        undefined,

      capacidadeBombona:
        Number(
          dados.capacidadeBombona
        ),

      expectativaGeracao:
        Number(
          dados.expectativaGeracao ??
            0
        ),

      nivelAtualPct:
        Number(
          dados.nivelAtualPct ??
            0
        ),

      latitude:
        Number(
          dados.latitude
        ),

      longitude:
        Number(
          dados.longitude
        ),
    };

    const response =
      await api.post(
        `/admin/indicadores/${indicadorId}/pontos`,
        payload
      );

    return (
      response.data?.ponto ??
      response.data?.data ??
      response.data
    );
  }

  // ==========================================================
  // LISTAR PONTOS
  // ==========================================================

  async listarPontos(
    indicadorId: number
  ): Promise<
    PontoColetaIndicador[]
  > {
    const response =
      await api.get<
        | PontoColetaIndicador[]
        | ListaPontosResponse
      >(
        `/admin/indicadores/${indicadorId}/pontos`
      );

    const resposta =
      response.data;

    if (
      Array.isArray(resposta)
    ) {
      return resposta;
    }

    if (
      Array.isArray(
        resposta?.pontos
      )
    ) {
      return resposta.pontos;
    }

    if (
      Array.isArray(
        resposta?.items
      )
    ) {
      return resposta.items;
    }

    if (
      Array.isArray(
        resposta?.data
      )
    ) {
      return resposta.data;
    }

    return [];
  }

  // ==========================================================
  // BUSCAR PRIMEIRO PONTO
  // ==========================================================

  async buscarPrimeiroPonto(
    indicadorId: number
  ): Promise<
    PontoColetaIndicador | null
  > {
    const pontos =
      await this.listarPontos(
        indicadorId
      );

    return pontos[0] ?? null;
  }

  // ==========================================================
  // VERIFICAR SE POSSUI PONTO
  // ==========================================================

  async possuiPonto(
    indicadorId: number
  ): Promise<boolean> {
    /**
     * Primeiro tenta buscar o indicador porque seu backend
     * já devolve temPontoColeta.
     */

    try {
      const indicador =
        await this.buscarPorId(
          indicadorId
        );

      return (
        indicador.temPontoColeta ||
        indicador.pontosColeta.length >
          0
      );
    } catch {
      /**
       * Fallback para a rota de pontos.
       */
      const pontos =
        await this.listarPontos(
          indicadorId
        );

      return pontos.length > 0;
    }
  }
}

// ============================================================
// EXPORT
// ============================================================

export const adminIndicadorService =
  new AdminIndicadorService();

export default adminIndicadorService;