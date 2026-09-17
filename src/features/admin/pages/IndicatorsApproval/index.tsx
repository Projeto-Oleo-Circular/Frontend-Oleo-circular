import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  Handshake,
  MapPin,
  Phone,
  Plus,
  Recycle,
  Search,
  User,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

import AdminTopNav from "../../../../components/layout/AdminTopNav";
import Footer from "../../../../components/layout/Footer";

import Button from "../../../../components/ui/Button";
import SummaryCard from "../../../../components/ui/SummaryCard";
import Pagination from "../../../../components/ui/Pagination";

import AdminFilterDropdown, {
  type FilterOption,
} from "../../../../components/ui/AdminFilterDropdown";

import AddressMapPicker, {
  type AddressMapValue,
} from "../../../../components/ui/AddressMapPicker";

import useToast from "../../../../hooks/useToast";

// ⚠️ AJUSTE ESTE IMPORT CONFORME O CAMINHO DO SEU PROJETO
import api from "../../../../services/api";

// ============================================================
// SERVICE INLINE — AdminIndicadorService
// ============================================================

type TipoIndicador = "ASSOCIACAO" | "COOPERATIVA" | "ONG";

interface PontoColetaIndicador {
  id: number;
  parceiroId: number | null;
  parceiroIndicadorId: number | null;
  categoria: number;
  nomePontoColeta: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string | null;
  capacidadeBombona: number;
  expectativaGeracao: number;
  nivelAtualPct: number;
  statusBombona: string;
  statusAprovacaoPontoColeta: string;
  latitude: string | number;
  longitude: string | number;
  criadoEm?: string;
  atualizadoEm?: string;
}

interface ParceiroIndicador {
  id: number;
  nome: string | null;
  nomeResposavel: string;
  tipo: TipoIndicador;
  cnpj: string;
  email?: string | null;
  telefone?: string | null;
  site?: string | null;
  ativo: boolean;
  municipio: string | null;
  criadoEm?: string;
  createdAt?: string;
  updatedAt?: string;

  // Informações enriquecidas retornadas pelo backend
  temPontoColeta?: boolean;
  quantidadePontosColeta?: number;
  pontosColeta?: PontoColetaIndicador[];
}

interface CriarIndicadorDTO {
  nome: string;
  nomeResposavel: string;
  tipo: TipoIndicador;
  cnpj: string;
  email?: string;
  telefone?: string;
  site?: string;
  ativo?: boolean;
  municipio: string | null;
}

interface AtualizarIndicadorDTO {
  nome?: string;
  nomeResposavel: string;
  tipo?: TipoIndicador;
  cnpj?: string;
  email?: string;
  telefone?: string;
  site?: string;
  ativo?: boolean;
  municipio: string | null;
}

interface CriarPontoIndicadorDTO {
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

interface AcessoCriado {
  email?: string;
  senhaTemporaria?: string;
  primeiroAcesso?: boolean;
}

interface CriarPontoIndicadorResponse {
  ponto?: PontoColetaIndicador;
  parceiro?: { id?: number; email?: string; nome?: string };
  acesso?: AcessoCriado | null;
}

const adminIndicadorService = {
  async listar(): Promise<ParceiroIndicador[]> {
    const response = await api.get("/admin/indicadores");

    if (Array.isArray(response.data)) return response.data;
    return response.data.items ?? [];
  },

  async criar(dados: CriarIndicadorDTO): Promise<ParceiroIndicador> {
    const response = await api.post("/admin/indicadores", dados);
    return response.data;
  },

  async atualizar(
    id: number,
    dados: AtualizarIndicadorDTO
  ): Promise<ParceiroIndicador> {
    const response = await api.put(`/admin/indicadores/${id}`, dados);
    return response.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/admin/indicadores/${id}`);
  },

  async criarPonto(
    indicadorId: number,
    dados: CriarPontoIndicadorDTO
  ): Promise<CriarPontoIndicadorResponse> {
    const response = await api.post(
      `/admin/indicadores/${indicadorId}/pontos`,
      dados
    );
    return response.data;
  },
};

// ============================================================
// TIPOS AUXILIARES
// ============================================================

type FiltroStatus = "" | "ATIVOS" | "INATIVOS";

interface PontoIndicadorPayload {
  nomePontoColeta: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  capacidadeBombona: number;
  expectativaGeracao: number;
  latitude: number;
  longitude: number;
}

interface FormIndicador {
  nome: string;
  nomeResposavel: string;
  tipo: TipoIndicador;
  cnpj: string;
  email: string;
  telefone: string;
  site: string;
  municipio: string;
  ativo: boolean;
  tambemPontoColeta: boolean;
}

const FORM_INICIAL: FormIndicador = {
  nome: "",
  nomeResposavel: "",
  tipo: "ASSOCIACAO",
  cnpj: "",
  email: "",
  telefone: "",
  site: "",
  municipio: "",
  ativo: true,
  tambemPontoColeta: false,
};

// ============================================================
// FORMATADORES
// ============================================================

function formatarCNPJ(valor?: string | null): string {
  if (!valor) return "—";
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  if (!numeros) return "—";

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarCNPJInput(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarTelefone(valor?: string | null): string {
  if (!valor) return "—";
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (!numeros) return "—";

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatarTelefoneInput(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

function obterLabelTipo(tipo: TipoIndicador): string {
  const labels: Record<TipoIndicador, string> = {
    ASSOCIACAO: "Associação",
    COOPERATIVA: "Cooperativa",
    ONG: "ONG",
  };
  return labels[tipo];
}

// ============================================================
// MÁSCARAS DO PONTO
// ============================================================

const somenteNumeros = (valor: string): string =>
  valor.replace(/\D/g, "");

const mascaraCEP = (valor: string): string => {
  const numeros = somenteNumeros(valor).slice(0, 8);
  return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
};

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES",
  "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

// ============================================================
// MODAL — PONTO DE COLETA DO INDICADOR
// ============================================================

interface PontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PontoIndicadorPayload) => Promise<void> | void;
  loading?: boolean;
  indicadorNome?: string;
  initialData?: PontoIndicadorPayload | null;
}

const PONTO_INICIAL = {
  nomePontoColeta: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  complemento: "",
  capacidadeBombona: "",
  expectativaGeracao: "",
  latitude: "" as string | number,
  longitude: "" as string | number,
};

function CriarPontoColetaIndicadorModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  indicadorNome,
  initialData,
}: PontoModalProps) {
  const [form, setForm] = useState(PONTO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);

  const atualizandoDoMapa = useRef(false);
  const debounceTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(PONTO_INICIAL);
      setErro(null);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }

      atualizandoDoMapa.current = false;
      return;
    }

    if (initialData) {
      setForm({
        nomePontoColeta: initialData.nomePontoColeta ?? "",
        cep: mascaraCEP(initialData.cep ?? ""),
        logradouro: initialData.logradouro ?? "",
        numero: initialData.numero ?? "",
        bairro: initialData.bairro ?? "",
        cidade: initialData.cidade ?? "",
        estado: initialData.estado ?? "",
        complemento: initialData.complemento ?? "",
        capacidadeBombona: String(initialData.capacidadeBombona ?? ""),
        expectativaGeracao: String(initialData.expectativaGeracao ?? ""),
        latitude: initialData.latitude ?? "",
        longitude: initialData.longitude ?? "",
      });
    } else {
      setForm(PONTO_INICIAL);
    }

    setErro(null);
  }, [isOpen, initialData]);

  const buscarCoordenadasPorTexto = async () => {
    const temDadosParaBuscar =
      form.cep ||
      (form.cidade && form.estado) ||
      (form.logradouro && form.cidade);

    if (!temDadosParaBuscar) return;

    try {
      const queryParts = [
        form.logradouro,
        form.numero,
        form.bairro,
        form.cidade,
        form.estado,
        form.cep,
        "Brasil",
      ]
        .filter(Boolean)
        .join(", ");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          queryParts
        )}&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (!data || data.length === 0) return;

      const latitude = Number(data[0].lat);
      const longitude = Number(data[0].lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      atualizandoDoMapa.current = true;

      setForm((atual) => ({
        ...atual,
        latitude: Number(latitude.toFixed(7)),
        longitude: Number(longitude.toFixed(7)),
      }));

      setTimeout(() => {
        atualizandoDoMapa.current = false;
      }, 100);
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (atualizandoDoMapa.current) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    const temDadosMinimos =
      form.cep || (form.cidade && form.estado);

    if (!temDadosMinimos) return;

    debounceTimeout.current = setTimeout(() => {
      buscarCoordenadasPorTexto();
    }, 1000);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [
    form.cep,
    form.logradouro,
    form.numero,
    form.bairro,
    form.cidade,
    form.estado,
  ]);

  if (!isOpen) return null;

  const atualizarCampo = async <
    K extends keyof typeof PONTO_INICIAL
  >(
    campo: K,
    valor: (typeof PONTO_INICIAL)[K]
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erro) setErro(null);

    if (campo === "cep") {
      const cepLimpo = somenteNumeros(String(valor));

      if (cepLimpo.length === 8) {
        try {
          const res = await fetch(
            `https://viacep.com.br/ws/${cepLimpo}/json/`
          );
          const dadosCep = await res.json();

          if (!dadosCep.erro) {
            setForm((atual) => ({
              ...atual,
              cep: mascaraCEP(String(valor)),
              logradouro: dadosCep.logradouro || atual.logradouro,
              bairro: dadosCep.bairro || atual.bairro,
              cidade: dadosCep.localidade || atual.cidade,
              estado: dadosCep.uf || atual.estado,
            }));
          }
        } catch (e) {
          console.error("Erro ao buscar CEP:", e);
        }
      }
    }
  };

  const atualizarEnderecoDoMapa = (
    data: Partial<AddressMapValue>
  ) => {
    atualizandoDoMapa.current = true;

    setForm((atual) => ({
      ...atual,
      cep: data.cep ? mascaraCEP(data.cep) : atual.cep,
      logradouro: data.logradouro ?? atual.logradouro,
      bairro: data.bairro ?? atual.bairro,
      cidade: data.cidade ?? atual.cidade,
      estado: data.estado ?? atual.estado,
      numero: data.numero ?? atual.numero,
      complemento: data.complemento ?? atual.complemento,
      latitude: data.latitude ?? atual.latitude,
      longitude: data.longitude ?? atual.longitude,
    }));

    setTimeout(() => {
      atualizandoDoMapa.current = false;
    }, 100);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.nomePontoColeta.trim() ||
      !form.cep.trim() ||
      !form.logradouro.trim() ||
      !form.numero.trim() ||
      !form.bairro.trim() ||
      !form.cidade.trim() ||
      !form.estado
    ) {
      setErro("Preencha todos os campos obrigatórios (*).");
      return;
    }

    if (
      !form.latitude ||
      !form.longitude ||
      (Number(form.latitude) === 0 && Number(form.longitude) === 0)
    ) {
      setErro("Selecione a localização correta do ponto no mapa.");
      return;
    }

    const capacidade = Number(form.capacidadeBombona);
    if (
      !form.capacidadeBombona.toString().trim() ||
      Number.isNaN(capacidade) ||
      capacidade <= 0
    ) {
      setErro("Informe uma capacidade de bombona válida (Litros).");
      return;
    }

    const expectativa = Number(form.expectativaGeracao);
    if (
      !form.expectativaGeracao.toString().trim() ||
      Number.isNaN(expectativa) ||
      expectativa <= 0
    ) {
      setErro("Informe a expectativa de geração (Litros/Mês).");
      return;
    }

    setErro(null);

    const payload: PontoIndicadorPayload = {
      nomePontoColeta: form.nomePontoColeta.trim(),
      cep: form.cep.trim(),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado,
      complemento: form.complemento?.trim() || undefined,
      capacidadeBombona: capacidade,
      expectativaGeracao: expectativa,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      console.error(
        "Erro ao criar ponto do indicador:",
        error?.response?.data || error
      );

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao salvar ponto de coleta.";

      setErro(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(PONTO_INICIAL);
    setErro(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Configurar Ponto de Coleta
            </h2>

            {indicadorNome && (
              <p className="text-xs text-white-500 mt-1">
                Vinculado ao indicador: <strong>{indicadorNome}</strong>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-red-primary hover:opacity-70 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-primary/30 p-3 text-xs text-red-primary">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IDENTIFICAÇÃO */}
          <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
              Identificação
            </h3>

            <label className="block">
              <span className="text-xs text-white-600 font-medium">
                Nome do Ponto de Coleta *
              </span>
              <input
                type="text"
                value={form.nomePontoColeta}
                onChange={(e) =>
                  atualizarCampo("nomePontoColeta", e.target.value)
                }
                placeholder="Ex.: Ponto Associação Recicla"
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>
          </div>

          {/* ENDEREÇO */}
          <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
              Endereço & Localização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">CEP *</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) =>
                    atualizarCampo("cep", mascaraCEP(e.target.value))
                  }
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-white-600 font-medium">
                  Logradouro *
                </span>
                <input
                  type="text"
                  value={form.logradouro}
                  onChange={(e) =>
                    atualizarCampo("logradouro", e.target.value)
                  }
                  placeholder="Rua, Avenida..."
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Número *</span>
                <input
                  type="text"
                  value={form.numero}
                  onChange={(e) => atualizarCampo("numero", e.target.value)}
                  placeholder="123"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>

              <label className="block sm:col-span-3">
                <span className="text-xs text-white-600 font-medium">
                  Complemento
                </span>
                <input
                  type="text"
                  value={form.complemento || ""}
                  onChange={(e) =>
                    atualizarCampo("complemento", e.target.value)
                  }
                  placeholder="Apto, Sala, Bloco..."
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Bairro *</span>
                <input
                  type="text"
                  value={form.bairro}
                  onChange={(e) => atualizarCampo("bairro", e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-xs text-white-600 font-medium">Cidade *</span>
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => atualizarCampo("cidade", e.target.value)}
                  placeholder="Cidade"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-xs text-white-600 font-medium">Estado *</span>
                <select
                  value={form.estado || ""}
                  onChange={(e) => atualizarCampo("estado", e.target.value)}
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                >
                  <option value="">Selecionar</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pt-2">
              <span className="text-xs text-white-600 font-medium block mb-1">
                Localização no Mapa (Ajuste o pin se necessário) *
              </span>

              <AddressMapPicker
                value={{
                  cep: form.cep,
                  logradouro: form.logradouro,
                  bairro: form.bairro,
                  cidade: form.cidade,
                  estado: form.estado || "",
                  numero: form.numero,
                  complemento: form.complemento || "",
                  latitude: form.latitude ? Number(form.latitude) : null,
                  longitude: form.longitude ? Number(form.longitude) : null,
                }}
                onChange={atualizarEnderecoDoMapa}
                height={240}
              />
            </div>
          </div>

          {/* PARÂMETROS */}
          <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
              Parâmetros Operacionais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">
                  Capacidade da Bombona (Litros) *
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.capacidadeBombona}
                  onChange={(e) =>
                    atualizarCampo("capacidadeBombona", e.target.value)
                  }
                  placeholder="0"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-xs text-white-600 font-medium">
                  Expectativa de Geração (Litros/Mês) *
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.expectativaGeracao}
                  onChange={(e) =>
                    atualizarCampo("expectativaGeracao", e.target.value)
                  }
                  placeholder="0"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              fullWidth
            >
              Salvar Ponto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL — CRIAR / EDITAR INDICADOR
// ============================================================

interface IndicadorModalProps {
  aberto: boolean;
  indicador: ParceiroIndicador | null;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (
    dados: CriarIndicadorDTO,
    ponto?: PontoIndicadorPayload
  ) => Promise<void>;
}

function IndicadorModal({
  aberto,
  indicador,
  salvando,
  onClose,
  onSalvar,
}: IndicadorModalProps) {
  const [form, setForm] = useState<FormIndicador>(FORM_INICIAL);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [pontoModalAberto, setPontoModalAberto] = useState(false);
  const [pontoData, setPontoData] =
    useState<PontoIndicadorPayload | null>(null);

  useEffect(() => {
    if (!aberto) return;

    if (indicador) {
      const pontoExistente = indicador.pontosColeta?.[0] ?? null;
      const temPonto =
        indicador.temPontoColeta === true ||
        (indicador.pontosColeta?.length ?? 0) > 0;

      setForm({
        nome: indicador.nome ?? "",
        nomeResposavel: indicador.nomeResposavel ?? "",
        tipo: indicador.tipo ?? "ASSOCIACAO",
        cnpj: formatarCNPJInput(indicador.cnpj ?? ""),
        email: indicador.email ?? "",
        telefone: formatarTelefoneInput(indicador.telefone ?? ""),
        site: indicador.site ?? "",
        municipio: indicador.municipio ?? "",
              ativo: indicador.ativo ?? true,
        tambemPontoColeta: temPonto,
      });

      if (pontoExistente) {
        setPontoData({
          nomePontoColeta: pontoExistente.nomePontoColeta ?? "",
          cep: pontoExistente.cep ?? "",
          logradouro: pontoExistente.logradouro ?? "",
          numero: pontoExistente.numero ?? "",
          bairro: pontoExistente.bairro ?? "",
          cidade: pontoExistente.cidade ?? "",
          estado: pontoExistente.estado ?? "",
          complemento: pontoExistente.complemento ?? undefined,
          capacidadeBombona: Number(pontoExistente.capacidadeBombona ?? 0),
          expectativaGeracao: Number(pontoExistente.expectativaGeracao ?? 0),
          latitude: Number(pontoExistente.latitude),
          longitude: Number(pontoExistente.longitude),
        });
      } else {
        setPontoData(null);
      }
    } else {
      setForm(FORM_INICIAL);
      setPontoData(null);
    }

    setPontoModalAberto(false);
    setErros({});
  }, [aberto, indicador]);

  if (!aberto) return null;

  const atualizarCampo = <K extends keyof FormIndicador>(
    campo: K,
    valor: FormIndicador[K]
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));

    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: "" }));
    }
  };

  const handleTogglePonto = (checked: boolean) => {
    const jaPossuiPonto =
      indicador?.temPontoColeta === true ||
      (indicador?.pontosColeta?.length ?? 0) > 0;

    if (!checked && jaPossuiPonto) {
      // Um ponto persistido não é excluído ao desmarcar o toggle.
      atualizarCampo("tambemPontoColeta", true);
      return;
    }

    atualizarCampo("tambemPontoColeta", checked);

    if (checked && !jaPossuiPonto && !pontoData) {
      setPontoModalAberto(true);
    }

    if (!checked) setPontoData(null);
  };

  const validar = () => {
    const novosErros: Record<string, string> = {};

    if (!form.nome.trim())
      novosErros.nome = "Informe o nome do indicador.";

    if (!form.nomeResposavel.trim())
      novosErros.nomeResposavel = "Informe o nome do responsável.";

    if (!form.municipio.trim())
      novosErros.municipio = "Informe o município.";

    const cnpj = form.cnpj.replace(/\D/g, "");
    if (!cnpj) novosErros.cnpj = "Informe o CNPJ.";
    else if (cnpj.length !== 14)
      novosErros.cnpj = "Informe um CNPJ válido.";

    if (form.tambemPontoColeta) {
      if (!form.email.trim()) {
        novosErros.email = "E-mail é obrigatório para ponto de coleta.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        novosErros.email = "Informe um e-mail válido.";
      }

      if (!pontoData) {
        novosErros.ponto = "Configure os dados do ponto de coleta.";
      }
    } else if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      novosErros.email = "Informe um e-mail válido.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validar()) return;

    const dadosIndicador: CriarIndicadorDTO = {
      nome: form.nome.trim(),
      nomeResposavel: form.nomeResposavel.trim(),
      tipo: form.tipo,
      cnpj: form.cnpj.replace(/\D/g, ""),
      email: form.email.trim() || undefined,
      telefone: form.telefone.replace(/\D/g, "") || undefined,
      site: form.site.trim() || undefined,
      municipio: form.municipio.trim() || null,
      ativo: form.ativo,
    };

    const pontoFinal = form.tambemPontoColeta
      ? pontoData ?? undefined
      : undefined;

    await onSalvar(dadosIndicador, pontoFinal);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-white-100">
            <div>
              <h2 className="font-bold text-xl text-green-primary">
                {indicador
                  ? "Editar Parceiro Indicador"
                  : "Novo Parceiro Indicador"}
              </h2>
              <p className="text-sm text-white-500 mt-1">
                {indicador
                  ? "Atualize os dados do parceiro indicador."
                  : "Cadastre uma nova associação, cooperativa ou ONG."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NOME */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex.: Associação Recicla Bahia"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
                {erros.nome && (
                  <p className="text-xs text-red-primary mt-1">{erros.nome}</p>
                )}
              </div>

              {/* RESPONSÁVEL */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Nome do Responsável *
                </label>
                <input
                  type="text"
                  value={form.nomeResposavel}
                  onChange={(e) =>
                    atualizarCampo("nomeResposavel", e.target.value)
                  }
                  placeholder="Ex.: João da Silva"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
                {erros.nomeResposavel && (
                  <p className="text-xs text-red-primary mt-1">
                    {erros.nomeResposavel}
                  </p>
                )}
              </div>

              {/* TIPO */}
              <div>
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Tipo *
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    atualizarCampo("tipo", e.target.value as TipoIndicador)
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                >
                  <option value="ASSOCIACAO">Associação</option>
                  <option value="COOPERATIVA">Cooperativa</option>
                  <option value="ONG">ONG</option>
                </select>
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-white-600 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) =>
                    atualizarCampo("cnpj", formatarCNPJInput(e.target.value))
                  }
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
                {erros.cnpj && (
                  <p className="text-xs text-red-primary mt-1">{erros.cnpj}</p>
                )}
              </div>

              {/* MUNICÍPIO */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Município *
                </label>
                <input
                  type="text"
                  value={form.municipio}
                  onChange={(e) =>
                    atualizarCampo("municipio", e.target.value)
                  }
                  placeholder="Ex.: Vitória da Conquista"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
                {erros.municipio && (
                  <p className="text-xs text-red-primary mt-1">
                    {erros.municipio}
                  </p>
                )}
              </div>

              {/* TOGGLE PONTO */}
              <div className="sm:col-span-2">
                <label className="flex items-center justify-between gap-4 bg-green-50 border border-green-100 rounded-lg p-3 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Recycle className="w-5 h-5 text-green-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-black-primary">
                        {indicador?.temPontoColeta ||
                        (indicador?.pontosColeta?.length ?? 0) > 0
                          ? "Este indicador possui ponto de coleta"
                          : indicador
                            ? "Adicionar um ponto de coleta a este indicador?"
                            : "Também será ponto de coleta?"}
                      </p>
                      <p className="text-xs text-white-500">
                        {indicador?.temPontoColeta ||
                        (indicador?.pontosColeta?.length ?? 0) > 0
                          ? "O ponto já está vinculado a este parceiro indicador e seus dados podem ser consultados abaixo."
                          : indicador
                            ? "Ao marcar, será criado um perfil de acesso para o responsável acompanhar as coletas."
                            : "Ao marcar, o parceiro receberá doações em um ponto físico e ganhará acesso à plataforma."}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.tambemPontoColeta}
                    onChange={(e) => handleTogglePonto(e.target.checked)}
                    className="w-5 h-5 accent-green-primary"
                  />
                </label>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-white-600 mb-1">
                  E-mail {form.tambemPontoColeta ? "*" : ""}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => atualizarCampo("email", e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
                {erros.email && (
                  <p className="text-xs text-red-primary mt-1">{erros.email}</p>
                )}
              </div>

              {/* TELEFONE */}
              <div>
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) =>
                    atualizarCampo(
                      "telefone",
                      formatarTelefoneInput(e.target.value)
                    )
                  }
                  placeholder="(77) 99999-9999"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
              </div>

              {/* SITE */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white-600 mb-1">
                  Site
                </label>
                <input
                  type="text"
                  value={form.site}
                  onChange={(e) => atualizarCampo("site", e.target.value)}
                  placeholder="https://www.exemplo.com.br"
                  className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                />
              </div>

              {/* CONFIGURAR PONTO */}
              {form.tambemPontoColeta && (
                <div className="sm:col-span-2 border border-green-100 rounded-lg p-4 bg-green-50/40 space-y-3">
                  <h3 className="text-sm font-bold text-green-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Recycle className="w-4 h-4 shrink-0" />
                    Dados do Ponto
                  </h3>

                  {pontoData ? (
                    <div className="text-xs text-white-600 space-y-1">
                      <p className="break-words">
                        <strong>Nome:</strong> {pontoData.nomePontoColeta}
                      </p>
                      <p className="break-words">
                        <strong>Endereço:</strong> {pontoData.logradouro},{" "}
                        {pontoData.numero} — {pontoData.bairro},{" "}
                        {pontoData.cidade}/{pontoData.estado}
                      </p>
                      <p className="break-words">
                        <strong>Capacidade:</strong>{" "}
                        {pontoData.capacidadeBombona} L{" | "}
                        <strong>Expectativa:</strong>{" "}
                        {pontoData.expectativaGeracao} L/mês
                      </p>
                      <p className="break-words">
                        <strong>Coordenadas:</strong> {pontoData.latitude},{" "}
                        {pontoData.longitude}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-white-500">
                      Nenhum ponto configurado ainda. Clique no botão
                      abaixo para preencher o endereço, capacidade da
                      bombona, expectativa de geração e localização no
                      mapa.
                    </p>
                  )}

                  {erros.ponto && (
                    <p className="text-xs text-red-primary">{erros.ponto}</p>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setPontoModalAberto(true)}
                    fullWidth
                  >
                    {pontoData
                      ? "Editar Ponto de Coleta"
                      : "Configurar Ponto de Coleta"}
                  </Button>
                </div>
              )}

              {/* ATIVO */}
              <div className="sm:col-span-2">
                <label className="flex items-center justify-between gap-4 bg-white-50 border border-white-100 rounded-lg p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-black-primary">
                      Indicador ativo
                    </p>
                    <p className="text-xs text-white-500">
                      Permite utilizar este indicador em novos cadastros.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      atualizarCampo("ativo", e.target.checked)
                    }
                    className="w-5 h-5 accent-green-primary"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={salvando}
                fullWidth
                className="rounded-full border border-green-primary text-green-primary bg-white hover:bg-green-50"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={salvando}
              >
                {indicador ? "Salvar Alterações" : "Cadastrar Indicador"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL DE PONTO */}
      <CriarPontoColetaIndicadorModal
        isOpen={pontoModalAberto}
        onClose={() => setPontoModalAberto(false)}
        indicadorNome={form.nome || undefined}
        initialData={pontoData}
        onSubmit={async (data) => {
          setPontoData(data);
          setPontoModalAberto(false);

          if (erros.ponto) {
            setErros((prev) => ({ ...prev, ponto: "" }));
          }
        }}
      />
    </>
  );
}

// ============================================================
// MODAL — EXCLUSÃO
// ============================================================

interface ExcluirModalProps {
  indicador: ParceiroIndicador | null;
  excluindo: boolean;
  onCancelar: () => void;
  onConfirmar: () => Promise<void>;
}

function ExcluirModal({
  indicador,
  excluindo,
  onCancelar,
  onConfirmar,
}: ExcluirModalProps) {
  if (!indicador) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-slide-down">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-green-primary">
            Confirmar Exclusão
          </h2>
          <button
            type="button"
            onClick={onCancelar}
            disabled={excluindo}
            className="text-red-primary hover:text-red-hover cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-white-600 mb-5">
          Deseja excluir o parceiro indicador{" "}
          <strong>{indicador.nome}</strong>?
        </p>

        <p className="text-xs text-red-primary mb-5">
          Essa ação não poderá ser desfeita.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancelar}
            disabled={excluindo}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={excluindo}
            onClick={onConfirmar}
            fullWidth
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ParceirosIndicadores() {
  const { addToast } = useToast();

  const [indicadores, setIndicadores] = useState<ParceiroIndicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [termoBusca, setTermoBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("");
  const [tipoFiltro, setTipoFiltro] = useState<"" | TipoIndicador>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalAberto, setModalAberto] = useState(false);
  const [indicadorEditando, setIndicadorEditando] =
    useState<ParceiroIndicador | null>(null);
  const [indicadorExclusao, setIndicadorExclusao] =
    useState<ParceiroIndicador | null>(null);
  const [indicadorDetalhes, setIndicadorDetalhes] =
    useState<ParceiroIndicador | null>(null);

  const [modoEdicaoDetalhes, setModoEdicaoDetalhes] = useState(false);
  const [indicadorEditandoDetalhes, setIndicadorEditandoDetalhes] =
    useState<ParceiroIndicador | null>(null);

  // ---- Ponto no modo DETALHES ----
  const [adicionarPontoDetalhes, setAdicionarPontoDetalhes] = useState(false);
  const [pontoDetalhesModalAberto, setPontoDetalhesModalAberto] =
    useState(false);
  const [pontoDetalhesData, setPontoDetalhesData] =
    useState<PontoIndicadorPayload | null>(null);

  const [acessoCriado, setAcessoCriado] = useState<AcessoCriado | null>(null);

  const statusOptions: FilterOption[] = [
    { value: "", label: "Todos os Status" },
    { value: "ATIVOS", label: "Ativos" },
    { value: "INATIVOS", label: "Inativos" },
  ];

  const tipoOptions: FilterOption[] = [
    { value: "", label: "Todos os Tipos" },
    { value: "ASSOCIACAO", label: "Associação" },
    { value: "COOPERATIVA", label: "Cooperativa" },
    { value: "ONG", label: "ONG" },
  ];

  const carregarIndicadores = useCallback(async () => {
    setLoading(true);

    try {
      const dados = await adminIndicadorService.listar();
      setIndicadores(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar parceiros indicadores:", error);
      setIndicadores([]);
      addToast("Erro ao carregar parceiros indicadores.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    carregarIndicadores();
  }, [carregarIndicadores]);

  const contagens = useMemo(() => {
    const total = indicadores.length;
    const ativos = indicadores.filter((i) => i.ativo).length;
    const inativos = indicadores.filter((i) => !i.ativo).length;
    const cooperativas = indicadores.filter(
      (i) => i.tipo === "COOPERATIVA"
    ).length;
    const ongs = indicadores.filter((i) => i.tipo === "ONG").length;
    const associacoes = indicadores.filter(
      (i) => i.tipo === "ASSOCIACAO"
    ).length;

    return { total, ativos, inativos, cooperativas, ongs, associacoes };
  }, [indicadores]);

  const indicadoresFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    const termoNumerico = termo.replace(/\D/g, "");

    const filtrados = indicadores.filter((indicador) => {
      const nome = indicador.nome?.toLowerCase() ?? "";
      const nomeResposavel =
        indicador.nomeResposavel?.toLowerCase() ?? "";
      const municipio = indicador.municipio?.toLowerCase() ?? "";
      const email = indicador.email?.toLowerCase() ?? "";
      const cnpj = indicador.cnpj?.replace(/\D/g, "") ?? "";
      const telefone = indicador.telefone?.replace(/\D/g, "") ?? "";
      const tipo = indicador.tipo?.toLowerCase() ?? "";

      const busca =
        !termo ||
        nome.includes(termo) ||
        nomeResposavel.includes(termo) ||
        municipio.includes(termo) ||
        email.includes(termo) ||
        tipo.includes(termo) ||
        (termoNumerico.length > 0 &&
          (cnpj.includes(termoNumerico) ||
            telefone.includes(termoNumerico)));

      const status =
        !statusFiltro ||
        (statusFiltro === "ATIVOS" && indicador.ativo) ||
        (statusFiltro === "INATIVOS" && !indicador.ativo);

      const tipoCorresponde = !tipoFiltro || indicador.tipo === tipoFiltro;

      return busca && status && tipoCorresponde;
    });

    return filtrados.sort((a, b) => {
      if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
      return Number(a.id) - Number(b.id);
    });
  }, [indicadores, termoBusca, statusFiltro, tipoFiltro]);

  const totalPages = Math.max(
    1,
    Math.ceil(indicadoresFiltrados.length / limit)
  );

  const indicadoresPaginados = useMemo(() => {
    const inicio = (page - 1) * limit;
    const fim = inicio + limit;
    return indicadoresFiltrados.slice(inicio, fim);
  }, [indicadoresFiltrados, page, limit]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setTermoBusca(event.target.value);
    setPage(1);
  };

  const handlePageChange = (novaPagina: number) => {
    if (novaPagina < 1 || novaPagina > totalPages) return;
    setPage(novaPagina);
  };

  const handleItemsPerPageChange = (novoLimit: number) => {
    setLimit(novoLimit);
    setPage(1);
  };

  const abrirModalCriar = () => {
    setIndicadorEditando(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setIndicadorEditando(null);
  };

  const abrirDetalhes = (indicador: ParceiroIndicador) => {
    const pontoExistente = indicador.pontosColeta?.[0] ?? null;
    const temPonto =
      indicador.temPontoColeta === true ||
      (indicador.pontosColeta?.length ?? 0) > 0;

    setIndicadorDetalhes(indicador);
    setIndicadorEditandoDetalhes({ ...indicador });
    setModoEdicaoDetalhes(false);

    setAdicionarPontoDetalhes(temPonto);

    if (pontoExistente) {
      setPontoDetalhesData({
        nomePontoColeta: pontoExistente.nomePontoColeta ?? "",
        cep: pontoExistente.cep ?? "",
        logradouro: pontoExistente.logradouro ?? "",
        numero: pontoExistente.numero ?? "",
        bairro: pontoExistente.bairro ?? "",
        cidade: pontoExistente.cidade ?? "",
        estado: pontoExistente.estado ?? "",
        complemento: pontoExistente.complemento ?? undefined,
        capacidadeBombona: Number(pontoExistente.capacidadeBombona ?? 0),
        expectativaGeracao: Number(pontoExistente.expectativaGeracao ?? 0),
        latitude: Number(pontoExistente.latitude),
        longitude: Number(pontoExistente.longitude),
      });
    } else {
      setPontoDetalhesData(null);
    }

    setPontoDetalhesModalAberto(false);
  };

  const fecharDetalhes = () => {
    setIndicadorDetalhes(null);
    setIndicadorEditandoDetalhes(null);
    setModoEdicaoDetalhes(false);

    setAdicionarPontoDetalhes(false);
    setPontoDetalhesData(null);
    setPontoDetalhesModalAberto(false);
  };

  // ============================================================
  // SALVAR — criar/editar via MODAL principal
  // ============================================================

  const salvarIndicador = async (
    dados: CriarIndicadorDTO,
    ponto?: PontoIndicadorPayload
  ) => {
    setSalvando(true);

    try {
      if (indicadorEditando) {
        await adminIndicadorService.atualizar(indicadorEditando.id, dados);

        const jaPossuiPonto =
          indicadorEditando.temPontoColeta === true ||
          (indicadorEditando.pontosColeta?.length ?? 0) > 0;

        if (ponto && !jaPossuiPonto) {
          try {
            const resultadoPonto = await adminIndicadorService.criarPonto(indicadorEditando.id, {
              nomePontoColeta: ponto.nomePontoColeta,
              cep: ponto.cep.replace(/\D/g, ""),
              logradouro: ponto.logradouro,
              numero: ponto.numero,
              bairro: ponto.bairro,
              cidade: ponto.cidade,
              estado: ponto.estado,
              complemento: ponto.complemento,
              capacidadeBombona: ponto.capacidadeBombona,
              expectativaGeracao: ponto.expectativaGeracao,
              latitude: ponto.latitude,
              longitude: ponto.longitude,
            });

            if (resultadoPonto?.acesso?.senhaTemporaria) {
              setAcessoCriado(resultadoPonto.acesso);
            }

            addToast(
              "Indicador atualizado e ponto de coleta criado!",
              "success"
            );
          } catch (errPonto: any) {
            console.error("Erro ao criar ponto:", errPonto);
            const msg =
              errPonto?.response?.data?.message ||
              errPonto?.response?.data?.erro ||
              "Indicador atualizado, mas houve erro ao criar o ponto.";
            addToast(msg, "error");
          }
        } else {
          addToast("Parceiro indicador atualizado com sucesso!", "success");
        }
      } else {
        const criado = await adminIndicadorService.criar(dados);

        if (ponto && criado?.id) {
          try {
            const resultadoPonto = await adminIndicadorService.criarPonto(criado.id, {
              nomePontoColeta: ponto.nomePontoColeta,
              cep: ponto.cep.replace(/\D/g, ""),
              logradouro: ponto.logradouro,
              numero: ponto.numero,
              bairro: ponto.bairro,
              cidade: ponto.cidade,
              estado: ponto.estado,
              complemento: ponto.complemento,
              capacidadeBombona: ponto.capacidadeBombona,
              expectativaGeracao: ponto.expectativaGeracao,
              latitude: ponto.latitude,
              longitude: ponto.longitude,
            });

            if (resultadoPonto?.acesso?.senhaTemporaria) {
              setAcessoCriado(resultadoPonto.acesso);
            }

            addToast(
              "Indicador e ponto de coleta criados com sucesso!",
              "success"
            );
          } catch (errPonto: any) {
            console.error("Erro ao criar ponto:", errPonto);
            const msg =
              errPonto?.response?.data?.message ||
              errPonto?.response?.data?.erro ||
              "Indicador criado, mas houve erro ao criar o ponto de coleta.";
            addToast(msg, "error");
          }
        } else {
          addToast("Parceiro indicador criado com sucesso!", "success");
        }
      }

      setModalAberto(false);
      setIndicadorEditando(null);

      await carregarIndicadores();
      setPage(1);
    } catch (error: any) {
      console.error("Erro ao salvar parceiro indicador:", error);
      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        "Não foi possível salvar o parceiro indicador.";
      addToast(mensagem, "error");
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // SALVAR EDIÇÃO — via MODAL DE DETALHES
  // ============================================================

  const handleSalvarEdicaoDetalhes = async () => {
    if (!indicadorEditandoDetalhes) return;

    if (!indicadorEditandoDetalhes.nome?.trim()) {
      addToast("O nome é obrigatório.", "error");
      return;
    }

    if (!indicadorEditandoDetalhes.nomeResposavel?.trim()) {
      addToast("O nome do responsável é obrigatório.", "error");
      return;
    }

    if (!indicadorEditandoDetalhes.municipio?.trim()) {
      addToast("O município é obrigatório.", "error");
      return;
    }

    if (adicionarPontoDetalhes && !pontoDetalhesData) {
      addToast(
        "Configure os dados do ponto de coleta antes de salvar.",
        "error"
      );
      return;
    }

    const jaPossuiPontoDetalhes =
      indicadorDetalhes?.temPontoColeta === true ||
      (indicadorDetalhes?.pontosColeta?.length ?? 0) > 0;

    setSalvando(true);

    try {
      await adminIndicadorService.atualizar(indicadorEditandoDetalhes.id, {
        nome: indicadorEditandoDetalhes.nome,
        nomeResposavel: indicadorEditandoDetalhes.nomeResposavel,
        tipo: indicadorEditandoDetalhes.tipo,
        cnpj:
          indicadorEditandoDetalhes.cnpj?.replace(/\D/g, "") || "",
        email: indicadorEditandoDetalhes.email || undefined,
        telefone:
          indicadorEditandoDetalhes.telefone?.replace(/\D/g, "") ||
          undefined,
        site: indicadorEditandoDetalhes.site || undefined,
        municipio: indicadorEditandoDetalhes.municipio || null,
        ativo: indicadorEditandoDetalhes.ativo,
      });

      if (
        adicionarPontoDetalhes &&
        pontoDetalhesData &&
        !jaPossuiPontoDetalhes
      ) {
        try {
          const resultadoPonto = await adminIndicadorService.criarPonto(indicadorEditandoDetalhes.id, {
            nomePontoColeta: pontoDetalhesData.nomePontoColeta,
            cep: pontoDetalhesData.cep.replace(/\D/g, ""),
            logradouro: pontoDetalhesData.logradouro,
            numero: pontoDetalhesData.numero,
            bairro: pontoDetalhesData.bairro,
            cidade: pontoDetalhesData.cidade,
            estado: pontoDetalhesData.estado,
            complemento: pontoDetalhesData.complemento,
            capacidadeBombona: pontoDetalhesData.capacidadeBombona,
            expectativaGeracao: pontoDetalhesData.expectativaGeracao,
            latitude: pontoDetalhesData.latitude,
            longitude: pontoDetalhesData.longitude,
          });

          if (resultadoPonto?.acesso?.senhaTemporaria) {
            setAcessoCriado(resultadoPonto.acesso);
          }

          addToast(
            "Indicador atualizado e ponto criado com sucesso!",
            "success"
          );

          setAdicionarPontoDetalhes(false);
          setPontoDetalhesData(null);
        } catch (errPonto: any) {
          console.error("Erro ao criar ponto:", errPonto);
          const msg =
            errPonto?.response?.data?.message ||
            errPonto?.response?.data?.erro ||
            "Indicador atualizado, mas houve erro ao criar o ponto.";
          addToast(msg, "error");
        }
      } else {
        addToast("Parceiro indicador atualizado com sucesso!", "success");
      }

      await carregarIndicadores();
      setIndicadorDetalhes({ ...indicadorEditandoDetalhes });
      setModoEdicaoDetalhes(false);
    } catch (error: any) {
      console.error("Erro ao atualizar indicador:", error);
      addToast("Erro ao salvar alterações.", "error");
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // EXCLUSÃO
  // ============================================================

  const confirmarExclusao = async () => {
    if (!indicadorExclusao) return;

    setExcluindo(true);

    try {
      await adminIndicadorService.excluir(indicadorExclusao.id);

      addToast("Parceiro indicador excluído com sucesso!", "success");

      setIndicadorExclusao(null);
      fecharDetalhes();

      await carregarIndicadores();
    } catch (error: any) {
      console.error("Erro ao excluir parceiro indicador:", error);
      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        "Não foi possível excluir o parceiro indicador.";
      addToast(mensagem, "error");
    } finally {
      setExcluindo(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
              Parceiros Indicadores
            </h1>
            <p className="text-sm sm:text-base text-white-500">
              Gerencie os parceiros responsáveis pela indicação de novos
              cadastros.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar indicador..."
                value={termoBusca}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
              />
              <Search className="w-4 h-4 text-white-400 absolute left-3 top-2.5" />
            </div>

            <AdminFilterDropdown
              placeholder="Status"
              options={statusOptions}
              value={statusFiltro}
              onChange={(val) => {
                setStatusFiltro(val as FiltroStatus);
                setPage(1);
              }}
            />

            <AdminFilterDropdown
              placeholder="Tipo"
              options={tipoOptions}
              value={tipoFiltro}
              onChange={(val) => {
                setTipoFiltro(val as "" | TipoIndicador);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard
            label="Ativos"
            value={contagens.ativos}
            subtext="Indicadores"
            labelColor="text-green-primary"
            iconBgColor="bg-green-bg-card"
            icon={
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />
            }
          />
          <SummaryCard
            label="Inativos"
            value={contagens.inativos}
            subtext="Indicadores"
            labelColor="text-red-primary"
            iconBgColor="bg-red-200"
            icon={
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-primary" />
            }
          />
          <SummaryCard
            label="Cooperativas"
            value={contagens.cooperativas}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={
              <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />
            }
          />
          <SummaryCard
            label="Associações"
            value={contagens.associacoes}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />
            }
          />
          <SummaryCard
            label="ONGs"
            value={contagens.ongs}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />
            }
          />
          <SummaryCard
            label="Total"
            value={contagens.total}
            subtext="Cadastrados"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />
            }
          />
        </div>

        <div className="flex justify-end mb-4">
          <div className="inline-block">
            <Button
              variant="primary"
              size="sm"
              onClick={abrirModalCriar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Indicador
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white bg-green-primary text-sm font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-64">Nome</th>
                <th className="p-3 w-56">Responsável</th>
                <th className="p-3 w-40">Tipo</th>
                <th className="p-3 w-48">CNPJ</th>
                <th className="p-3 w-64">E-mail / Telefone</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-white-500">
                    Carregando parceiros indicadores...
                  </td>
                </tr>
              ) : indicadoresPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-white-500">
                    Nenhum parceiro indicador encontrado com os filtros
                    aplicados.
                  </td>
                </tr>
              ) : (
                indicadoresPaginados.map((indicador) => (
                  <tr
                    key={indicador.id}
                    className="border-b border-white-100 last:border-0 hover:bg-white-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-sm text-black-primary">
                      #{indicador.id}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-sm text-black-primary">
                            {indicador.nome}
                          </p>

                          {indicador.municipio && (
                            <p className="text-xs text-white-500 mt-0.5 inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {indicador.municipio}
                            </p>
                          )}

                          {indicador.site && (
                            <a
                              href={indicador.site}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-green-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              Site
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-black-primary">
                      {indicador.nomeResposavel || "—"}
                    </td>

                    <td className="p-4 text-sm text-black-primary font-medium">
                      {obterLabelTipo(indicador.tipo)}
                    </td>

                    <td className="p-4 text-sm text-black-primary whitespace-nowrap">
                      {formatarCNPJ(indicador.cnpj)}
                    </td>

                    <td className="p-4">
                      <p className="text-black-primary text-sm font-medium">
                        {indicador.email || "—"}
                      </p>
                      <p className="text-xs text-white-500 mt-1">
                        {formatarTelefone(indicador.telefone)}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {indicador.ativo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-primary text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-primary rounded-full" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-primary text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-red-primary rounded-full" />
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirDetalhes(indicador)}
                          className="p-1.5 rounded-lg border border-white-200 text-white-600 hover:text-black-primary hover:bg-green-100 transition-colors cursor-pointer"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && indicadoresFiltrados.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={indicadoresFiltrados.length}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[10, 20, 50]}
          />
        )}

        {/* MODAL DETALHES */}
        {indicadorDetalhes && indicadorEditandoDetalhes && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">
                    {modoEdicaoDetalhes
                      ? "Editar Indicador"
                      : "Detalhes do Indicador"}
                  </h2>
                  <p className="text-xs text-white-500">
                    ID do Indicador: #{indicadorDetalhes.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!modoEdicaoDetalhes && (
                    <button
                      type="button"
                      onClick={() => setModoEdicaoDetalhes(true)}
                      className="p-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                      title="Editar Indicador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white-50 p-3 rounded-lg border border-white-100">
                  <div>
                    <span className="text-xs text-white-500 block">Status</span>
                    {indicadorEditandoDetalhes.ativo ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-primary text-xs font-semibold mt-1">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-primary text-xs font-semibold mt-1">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white-500 block">Tipo</span>
                    <span className="text-xs font-semibold text-black-primary">
                      {obterLabelTipo(indicadorEditandoDetalhes.tipo)}
                    </span>
                  </div>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Identificação
                  </h3>

                  {modoEdicaoDetalhes ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-white-500">Nome</label>
                        <input
                          type="text"
                          value={indicadorEditandoDetalhes.nome || ""}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev ? { ...prev, nome: e.target.value } : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white-500">
                          Nome do Responsável
                        </label>
                        <input
                          type="text"
                          value={
                            indicadorEditandoDetalhes.nomeResposavel || ""
                          }
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    nomeResposavel: e.target.value,
                                  }
                                : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white-500">
                          Município
                        </label>
                        <input
                          type="text"
                          value={indicadorEditandoDetalhes.municipio || ""}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev
                                ? { ...prev, municipio: e.target.value }
                                : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white-500">CNPJ</label>
                        <input
                          type="text"
                          value={formatarCNPJInput(
                            indicadorEditandoDetalhes.cnpj || ""
                          )}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev ? { ...prev, cnpj: e.target.value } : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white-500">Site</label>
                        <input
                          type="text"
                          value={indicadorEditandoDetalhes.site || ""}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev ? { ...prev, site: e.target.value } : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-black-primary">
                        {indicadorDetalhes.nome || "—"}
                      </p>
                      <p className="text-xs text-white-500 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Responsável: {indicadorDetalhes.nomeResposavel || "—"}
                      </p>
                      <p className="text-xs text-white-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Município: {indicadorDetalhes.municipio || "—"}
                      </p>
                      <p className="text-xs text-white-500 mt-1">
                        CNPJ: {formatarCNPJ(indicadorDetalhes.cnpj) || "—"}
                      </p>
                      {indicadorDetalhes.site && (
                        <p className="text-xs text-white-500 mt-1">
                          Site: {indicadorDetalhes.site}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Contato
                  </h3>

                  {modoEdicaoDetalhes ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-white-500">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={indicadorEditandoDetalhes.email || ""}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev ? { ...prev, email: e.target.value } : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white-500">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={formatarTelefoneInput(
                            indicadorEditandoDetalhes.telefone || ""
                          )}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev
                                ? { ...prev, telefone: e.target.value }
                                : null
                            )
                          }
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white-500 flex items-center gap-1">
                        E-mail: {indicadorDetalhes.email || "—"}
                      </p>
                      <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                        Telefone: {formatarTelefone(indicadorDetalhes.telefone)}
                      </p>
                    </>
                  )}
                </div>

                {!modoEdicaoDetalhes && indicadorDetalhes.temPontoColeta && (
                  <div className="border border-green-100 rounded-lg p-3 bg-green-50/40">
                    <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Recycle className="w-3.5 h-3.5" />
                      Ponto de Coleta
                    </h3>

                    {indicadorDetalhes.pontosColeta?.length ? (
                      <div className="space-y-3">
                        {indicadorDetalhes.pontosColeta.map((ponto) => (
                          <div
                            key={ponto.id}
                            className="text-xs text-white-600 border-b border-green-100 last:border-0 pb-3 last:pb-0"
                          >
                            <p>
                              <strong>Nome:</strong>{" "}
                              {ponto.nomePontoColeta || "—"}
                            </p>
                            <p className="mt-1">
                              <strong>Endereço:</strong>{" "}
                              {ponto.logradouro}, {ponto.numero} —{" "}
                              {ponto.bairro}, {ponto.cidade}/{ponto.estado}
                            </p>
                            <p className="mt-1">
                              <strong>CEP:</strong> {mascaraCEP(ponto.cep || "")}
                            </p>
                            <p className="mt-1">
                              <strong>Capacidade:</strong>{" "}
                              {ponto.capacidadeBombona} L{" | "}
                              <strong>Expectativa:</strong>{" "}
                              {ponto.expectativaGeracao} L/mês
                            </p>
                            
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white-500">
                        O backend informou que este indicador possui ponto,
                        mas não retornou os dados do ponto.
                      </p>
                    )}
                  </div>
                )}

                {/* ============================================== */}
                {/* BLOCO PONTO DE COLETA — modo edição             */}
                {/* ============================================== */}
                {modoEdicaoDetalhes && (
                  <>
                    <div className="pt-1">
                      <label className="flex items-center justify-between gap-4 bg-green-50 border border-green-100 rounded-lg p-3 cursor-pointer">
                        <div className="flex items-start gap-2">
                          <Recycle className="w-5 h-5 text-green-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-black-primary">
                              {indicadorDetalhes.temPontoColeta ||
                              (indicadorDetalhes.pontosColeta?.length ?? 0) > 0
                                ? "Este indicador possui ponto de coleta"
                                : "Adicionar ponto de coleta a este indicador?"}
                            </p>
                            <p className="text-xs text-white-500">
                              {indicadorDetalhes.temPontoColeta ||
                              (indicadorDetalhes.pontosColeta?.length ?? 0) > 0
                                ? "O ponto já está vinculado ao indicador."
                                : "Ao marcar, será criado um perfil de acesso para o responsável acompanhar as coletas."}
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={adicionarPontoDetalhes}
                          onChange={(e) => {
                            const checked = e.target.checked;

                            const jaPossuiPonto =
                              indicadorDetalhes.temPontoColeta === true ||
                              (indicadorDetalhes.pontosColeta?.length ?? 0) > 0;

                            if (checked) {
                              if (jaPossuiPonto) {
                                setAdicionarPontoDetalhes(true);
                                return;
                              }

                              setAdicionarPontoDetalhes(true);
                              if (!pontoDetalhesData) setPontoDetalhesModalAberto(true);
                              return;
                            }

                            // Não removemos silenciosamente um ponto persistido.
                            if (jaPossuiPonto) {
                              setAdicionarPontoDetalhes(true);
                              return;
                            }

                            setAdicionarPontoDetalhes(false);
                            setPontoDetalhesData(null);
                                                  }}
                          className="w-5 h-5 accent-green-primary"
                        />
                      </label>
                    </div>

                    {/* DADOS DO PONTO */}
                    {adicionarPontoDetalhes && (
                      <div className="border border-green-100 rounded-lg p-4 bg-green-50/40 space-y-3">
                        <h3 className="text-sm font-bold text-green-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Recycle className="w-4 h-4 shrink-0" />
                          Dados do Ponto
                        </h3>

                        {pontoDetalhesData ? (
                          <div className="text-xs text-white-600 space-y-1">
                            <p className="break-words">
                              <strong>Nome:</strong>{" "}
                              {pontoDetalhesData.nomePontoColeta}
                            </p>
                            <p className="break-words">
                              <strong>Endereço:</strong>{" "}
                              {pontoDetalhesData.logradouro},{" "}
                              {pontoDetalhesData.numero} —{" "}
                              {pontoDetalhesData.bairro},{" "}
                              {pontoDetalhesData.cidade}/
                              {pontoDetalhesData.estado}
                            </p>
                            <p className="break-words">
                              <strong>Capacidade:</strong>{" "}
                              {pontoDetalhesData.capacidadeBombona} L{" | "}
                              <strong>Expectativa:</strong>{" "}
                              {pontoDetalhesData.expectativaGeracao} L/mês
                            </p>
                            <p className="break-words">
                              <strong>Coordenadas:</strong>{" "}
                              {pontoDetalhesData.latitude},{" "}
                              {pontoDetalhesData.longitude}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-white-500">
                            Nenhum ponto configurado ainda. Clique no botão
                            abaixo para preencher o endereço, capacidade
                            da bombona, expectativa de geração e
                            localização no mapa.
                          </p>
                        )}

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => setPontoDetalhesModalAberto(true)}
                          fullWidth
                        >
                          {pontoDetalhesData
                            ? "Editar Ponto de Coleta"
                            : "Configurar Ponto de Coleta"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {modoEdicaoDetalhes ? (
                <div className="flex gap-3 mt-6 pt-4 border-t border-white-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setModoEdicaoDetalhes(false);
                      setIndicadorEditandoDetalhes({
                        ...indicadorDetalhes,
                      });
                      const pontoExistente =
                        indicadorDetalhes.pontosColeta?.[0] ?? null;
                      const temPonto =
                        indicadorDetalhes.temPontoColeta === true ||
                        (indicadorDetalhes.pontosColeta?.length ?? 0) > 0;

                      setAdicionarPontoDetalhes(temPonto);
                      setPontoDetalhesData(
                        pontoExistente
                          ? {
                              nomePontoColeta:
                                pontoExistente.nomePontoColeta ?? "",
                              cep: pontoExistente.cep ?? "",
                              logradouro: pontoExistente.logradouro ?? "",
                              numero: pontoExistente.numero ?? "",
                              bairro: pontoExistente.bairro ?? "",
                              cidade: pontoExistente.cidade ?? "",
                              estado: pontoExistente.estado ?? "",
                              complemento:
                                pontoExistente.complemento ?? undefined,
                              capacidadeBombona: Number(
                                pontoExistente.capacidadeBombona ?? 0
                              ),
                              expectativaGeracao: Number(
                                pontoExistente.expectativaGeracao ?? 0
                              ),
                              latitude: Number(pontoExistente.latitude),
                              longitude: Number(pontoExistente.longitude),
                            }
                          : null
                      );
                                      }}
                    disabled={salvando}
                    fullWidth
                    className="rounded-full border border-green-primary text-green-primary bg-white hover:bg-green-50"
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSalvarEdicaoDetalhes}
                    loading={salvando}
                    fullWidth
                  >
                    Salvar Alterações
                  </Button>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-white-100">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={fecharDetalhes}
                    fullWidth
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CRIAR / EDITAR INDICADOR */}
        <IndicadorModal
          aberto={modalAberto}
          indicador={indicadorEditando}
          salvando={salvando}
          onClose={fecharModal}
          onSalvar={salvarIndicador}
        />

        {/* MODAL PONTO — modo DETALHES */}
        <CriarPontoColetaIndicadorModal
          isOpen={pontoDetalhesModalAberto}
          onClose={() => setPontoDetalhesModalAberto(false)}
          indicadorNome={indicadorEditandoDetalhes?.nome || undefined}
          initialData={pontoDetalhesData}
          onSubmit={async (data) => {
            setPontoDetalhesData(data);
            setPontoDetalhesModalAberto(false);
          }}
        />

        {acessoCriado?.senhaTemporaria && (
          <div className="fixed inset-0 z-[12000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-lg text-green-primary">Acesso criado</h2>
                  <p className="text-xs text-white-500 mt-1">
                    Copie estas credenciais agora. A senha temporária é exibida somente após a criação do acesso.
                  </p>
                </div>
                <button type="button" onClick={() => setAcessoCriado(null)} className="text-red-primary cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="border border-white-200 rounded-lg p-3">
                  <p className="text-[10px] uppercase font-bold text-white-500">E-mail</p>
                  <p className="text-sm text-black-primary break-all">{acessoCriado.email || "—"}</p>
                </div>
                <div className="border border-white-200 rounded-lg p-3">
                  <p className="text-[10px] uppercase font-bold text-white-500">Senha temporária</p>
                  <p className="text-sm font-mono text-black-primary break-all">{acessoCriado.senhaTemporaria}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `E-mail: ${acessoCriado.email || ""}\nSenha temporária: ${acessoCriado.senhaTemporaria || ""}`
                    );
                    addToast("Credenciais copiadas.", "success");
                  }}
                >
                  Copiar credenciais
                </Button>
                <Button type="button" variant="primary" size="sm" fullWidth onClick={() => setAcessoCriado(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EXCLUSÃO */}
        <ExcluirModal
          indicador={indicadorExclusao}
          excluindo={excluindo}
          onCancelar={() => {
            if (!excluindo) setIndicadorExclusao(null);
          }}
          onConfirmar={confirmarExclusao}
        />
      </main>

      <Footer />
    </div>
  );
}

export default ParceirosIndicadores;