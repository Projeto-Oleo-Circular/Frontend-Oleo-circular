import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  Handshake,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";

import AdminTopNav from "../../../../components/layout/AdminTopNav";
import Footer from "../../../../components/layout/Footer";

import Button from "../../../../components/ui/Button";
import SummaryCard from "../../../../components/ui/SummaryCard";

import AdminFilterDropdown, {
  type FilterOption,
} from "../../../../components/ui/AdminFilterDropdown";

import useToast from "../../../../hooks/useToast";

import {
  adminIndicadorService,
  type ParceiroIndicador,
  type TipoIndicador,
  type CriarIndicadorDTO,
} from "../../../../services/AdminIndicadorService";

// ============================================================
// TIPOS
// ============================================================

type FiltroStatus = "" | "ATIVOS" | "INATIVOS";

interface FormIndicador {
  nome: string;
  tipo: TipoIndicador;
  cnpj: string;
  email: string;
  telefone: string;
  site: string;
  ativo: boolean;
}

// ============================================================
// FORM INICIAL
// ============================================================

const FORM_INICIAL: FormIndicador = {
  nome: "",
  tipo: "ASSOCIACAO",
  cnpj: "",
  email: "",
  telefone: "",
  site: "",
  ativo: true,
};

// ============================================================
// FORMATADORES E HELPERS AUXILIARES
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
    return numeros.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros.replace(/^(\d{2})(\d)/, "($1) $2").replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatarTelefoneInput(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 10) {
    return numeros.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros.replace(/^(\d{2})(\d)/, "($1) $2").replace(/^(\d{5})(\d)/, "$1-$2");
}

function obterLabelTipo(tipo: TipoIndicador): string {
  const labels: Record<TipoIndicador, string> = {
    ASSOCIACAO: "Associação",
    COOPERATIVA: "Cooperativa",
    ONG: "ONG",
  };
  return labels[tipo];
}

function obterNomeOuRazaoSocial(indicador: ParceiroIndicador): string {
  return indicador.nome || "—";
}

// ============================================================
// MODAL CRIAR / EDITAR
// ============================================================

interface IndicadorModalProps {
  aberto: boolean;
  indicador: ParceiroIndicador | null;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (dados: CriarIndicadorDTO) => Promise<void>;
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

  useEffect(() => {
    if (!aberto) return;

    if (indicador) {
      setForm({
        nome: indicador.nome ?? "",
        tipo: indicador.tipo ?? "ASSOCIACAO",
        cnpj: formatarCNPJInput(indicador.cnpj ?? ""),
        email: indicador.email ?? "",
        telefone: formatarTelefoneInput(indicador.telefone ?? ""),
        site: indicador.site ?? "",
        ativo: indicador.ativo ?? true,
      });
    } else {
      setForm(FORM_INICIAL);
    }
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

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim()) {
      novosErros.nome = "Informe o nome do indicador.";
    }

    const cnpj = form.cnpj.replace(/\D/g, "");
    if (!cnpj) {
      novosErros.cnpj = "Informe o CNPJ.";
    } else if (cnpj.length !== 14) {
      novosErros.cnpj = "Informe um CNPJ válido.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      novosErros.email = "Informe um e-mail válido.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validar()) return;

    await onSalvar({
      nome: form.nome.trim(),
      tipo: form.tipo,
      cnpj: form.cnpj.replace(/\D/g, ""),
      email: form.email.trim() || undefined,
      telefone: form.telefone.replace(/\D/g, "") || undefined,
      site: form.site.trim() || undefined,
      ativo: form.ativo,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-white-100">
          <div>
            <h2 className="font-bold text-xl text-green-primary">
              {indicador ? "Editar Parceiro Indicador" : "Novo Parceiro Indicador"}
            </h2>
            <p className="text-sm text-white-500 mt-1">
              {indicador
                ? "Atualize os dados do parceiro indicador."
                : "Cadastre uma nova associação, cooperativa ou ONG."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="text-red-primary hover:text-red-hover cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-white-600 mb-1">
                E-mail
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

            <div>
              <label className="block text-sm font-medium text-white-600 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) =>
                  atualizarCampo("telefone", formatarTelefoneInput(e.target.value))
                }
                placeholder="(77) 99999-9999"
                className="w-full px-3 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
              />
            </div>

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
                  onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                  className="w-5 h-5 accent-green-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white-100">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={salvando}>
              {indicador ? "Salvar Alterações" : "Cadastrar Indicador"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL EXCLUSÃO
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
          Deseja excluir o parceiro indicador <strong>{indicador.nome}</strong>?
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
  const limit = 10;

  const [modalAberto, setModalAberto] = useState(false);
  const [indicadorEditando, setIndicadorEditando] = useState<ParceiroIndicador | null>(null);
  const [indicadorExclusao, setIndicadorExclusao] = useState<ParceiroIndicador | null>(null);
  const [indicadorDetalhes, setIndicadorDetalhes] = useState<ParceiroIndicador | null>(null);

  // Estados locais para edição dentro do Modal de Detalhes
  const [modoEdicaoDetalhes, setModoEdicaoDetalhes] = useState(false);
  const [indicadorEditandoDetalhes, setIndicadorEditandoDetalhes] = useState<ParceiroIndicador | null>(null);

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
    const ativos = indicadores.filter((ind) => ind.ativo).length;
    const inativos = indicadores.filter((ind) => !ind.ativo).length;
    const cooperativas = indicadores.filter((ind) => ind.tipo === "COOPERATIVA").length;
    const ongs = indicadores.filter((ind) => ind.tipo === "ONG").length;
    const associacoes = indicadores.filter((ind) => ind.tipo === "ASSOCIACAO").length;

    return { total, ativos, inativos, cooperativas, ongs, associacoes };
  }, [indicadores]);

  const indicadoresFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();

    const filtrados = indicadores.filter((indicador) => {
      const busca =
        !termo ||
        indicador.nome?.toLowerCase().includes(termo) ||
        indicador.email?.toLowerCase().includes(termo) ||
        indicador.cnpj?.replace(/\D/g, "").includes(termo.replace(/\D/g, ""));

      const status =
        !statusFiltro ||
        (statusFiltro === "ATIVOS" && indicador.ativo) ||
        (statusFiltro === "INATIVOS" && !indicador.ativo);

      const tipo = !tipoFiltro || indicador.tipo === tipoFiltro;

      return busca && status && tipo;
    });

    return filtrados.sort((a, b) => {
      if (a.ativo === b.ativo) return 0;
      return a.ativo ? -1 : 1;
    });
  }, [indicadores, termoBusca, statusFiltro, tipoFiltro]);

  const totalPages = Math.max(1, Math.ceil(indicadoresFiltrados.length / limit));

  const indicadoresPaginados = useMemo(() => {
    const inicio = (page - 1) * limit;
    return indicadoresFiltrados.slice(inicio, inicio + limit);
  }, [indicadoresFiltrados, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTermoBusca(event.target.value);
    setPage(1);
  };

  const abrirModalCriar = () => {
    setIndicadorEditando(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (indicador: ParceiroIndicador) => {
    setIndicadorEditando(indicador);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setIndicadorEditando(null);
  };

  const abrirDetalhes = (indicador: ParceiroIndicador) => {
    setIndicadorDetalhes(indicador);
    setIndicadorEditandoDetalhes({ ...indicador });
    setModoEdicaoDetalhes(false);
  };

  const fecharDetalhes = () => {
    setIndicadorDetalhes(null);
    setIndicadorEditandoDetalhes(null);
    setModoEdicaoDetalhes(false);
  };

  const salvarIndicador = async (dados: CriarIndicadorDTO) => {
    setSalvando(true);
    try {
      if (indicadorEditando) {
        await adminIndicadorService.atualizar(indicadorEditando.id, dados);
        addToast("Parceiro indicador atualizado com sucesso!", "success");
      } else {
        await adminIndicadorService.criar(dados);
        addToast("Parceiro indicador criado com sucesso!", "success");
      }

      setModalAberto(false);
      setIndicadorEditando(null);
      await carregarIndicadores();
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

  const handleSalvarEdicaoDetalhes = async () => {
    if (!indicadorEditandoDetalhes) return;

    if (!indicadorEditandoDetalhes.nome?.trim()) {
      addToast("O nome é obrigatório.", "error");
      return;
    }

    setSalvando(true);
    try {
      await adminIndicadorService.atualizar(indicadorEditandoDetalhes.id, {
        nome: indicadorEditandoDetalhes.nome,
        tipo: indicadorEditandoDetalhes.tipo,
        cnpj: indicadorEditandoDetalhes.cnpj?.replace(/\D/g, "") || "",
        email: indicadorEditandoDetalhes.email || undefined,
        telefone: indicadorEditandoDetalhes.telefone?.replace(/\D/g, "") || undefined,
        site: indicadorEditandoDetalhes.site || undefined,
        ativo: indicadorEditandoDetalhes.ativo,
      });

      addToast("Parceiro indicador atualizado com sucesso!", "success");
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
              Gerencie os parceiros responsáveis pela indicação de novos cadastros.
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

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard
            label="Ativos"
            value={contagens.ativos}
            subtext="Indicadores"
            labelColor="text-green-primary"
            iconBgColor="bg-green-bg-card"
            icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
          <SummaryCard
            label="Inativos"
            value={contagens.inativos}
            subtext="Indicadores"
            labelColor="text-red-primary"
            iconBgColor="bg-red-200"
            icon={<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-primary" />}
          />
          <SummaryCard
            label="Cooperativas"
            value={contagens.cooperativas}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
          <SummaryCard
            label="Associações"
            value={contagens.associacoes}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
          <SummaryCard
            label="ONGs"
            value={contagens.ongs}
            subtext="Cadastradas"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<User className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
          <SummaryCard
            label="Total"
            value={contagens.total}
            subtext="Cadastrados"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<User className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
        </div>

        {/* BOTÃO NOVO INDICADOR */}
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

        {/* TABELA */}
        <div className="bg-white rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white bg-green-primary text-sm font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-64">Nome</th>
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
                  <td colSpan={7} className="p-8 text-center text-white-500">
                    Carregando parceiros indicadores...
                  </td>
                </tr>
              ) : indicadoresPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white-500">
                    Nenhum parceiro indicador encontrado com os filtros aplicados.
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

        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white-200 disabled:opacity-50 hover:bg-white-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-white-600">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white-200 disabled:opacity-50 hover:bg-white-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL DETALHES COM EDIÇÃO INTEGRADA                          */}
        {/* ============================================================ */}
        {indicadorDetalhes && indicadorEditandoDetalhes && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">
                    {modoEdicaoDetalhes ? "Editar Indicador" : "Detalhes do Indicador"}
                  </h2>
                  <p className="text-xs text-white-500">
                    ID do Indicador: #{indicadorDetalhes.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!modoEdicaoDetalhes && (
                    <button
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
                {/* STATUS */}
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

                {/* IDENTIFICAÇÃO */}
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
                        <label className="text-xs text-white-500">CNPJ</label>
                        <input
                          type="text"
                          value={formatarCNPJInput(indicadorEditandoDetalhes.cnpj || "")}
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
                        {obterNomeOuRazaoSocial(indicadorDetalhes)}
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

                {/* CONTATO */}
                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Contato
                  </h3>

                  {modoEdicaoDetalhes ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-white-500">E-mail</label>
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
                        <label className="text-xs text-white-500">Telefone</label>
                        <input
                          type="text"
                          value={formatarTelefoneInput(indicadorEditandoDetalhes.telefone || "")}
                          onChange={(e) =>
                            setIndicadorEditandoDetalhes((prev) =>
                              prev ? { ...prev, telefone: e.target.value } : null
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
              </div>

              {/* BOTÕES DE AÇÃO */}
              {modoEdicaoDetalhes ? (
                <div className="flex gap-3 mt-6 pt-4 border-t border-white-100">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setModoEdicaoDetalhes(false);
                      setIndicadorEditandoDetalhes({ ...indicadorDetalhes });
                    }}
                    disabled={salvando}
                    fullWidth
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

        <IndicadorModal
          aberto={modalAberto}
          indicador={indicadorEditando}
          salvando={salvando}
          onClose={fecharModal}
          onSalvar={salvarIndicador}
        />

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