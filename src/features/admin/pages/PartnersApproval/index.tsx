import { useEffect, useState, useCallback } from "react";
import {
  adminParceiroService,
  type ListarParceirosResponse,
  type Parceiro,
  type StatusAprovacao,
} from "../../../../services/adminParceiroService";
import {
  authService,
  type ParceiroIndicador,
} from "../../../../services/authService";

import StatusBadge from "../../../../components/ui/StatusBadge";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import AdminFilterDropdown, {
  type FilterOption,
} from "../../../../components/ui/AdminFilterDropdown";

import {
  User,
  Phone,
  Mail,
  Eye,
  X,
  Check,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import Footer from "../../../../components/layout/Footer";
import SummaryCard from "../../../../components/ui/SummaryCard";

interface ContagensParceiros {
  pendentes: number;
  aprovados: number;
  rejeitados: number;
  total: number;
}

type ModalTipo = "aprovar" | "rejeitar" | "detalhes" | null;

function formatarData(iso?: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// Helper para padronizar o extrato da contagem total independente da resposta
function extrairTotal(resposta: ListarParceirosResponse | Parceiro[]): number {
  if (Array.isArray(resposta)) {
    return resposta.length;
  }
  return resposta.total ?? 0;
}

// Helper para padronizar a lista de itens
function extrairItens(resposta: ListarParceirosResponse | Parceiro[]): Parceiro[] {
  if (Array.isArray(resposta)) {
    return resposta;
  }
  return resposta.items ?? [];
}

// Helper para obter o nome ou razão social com base no tipo de parceiro
function obterNomeOuRazaoSocial(parceiro: Parceiro): string {
  if (parceiro.tipoParceiro === "SOLIDARIO") {
    return parceiro.nome || "—";
  }
  // Para INSTITUCIONAL, COMUNITARIO e demais pessoas jurídicas
  return parceiro.razaoSocial || parceiro.nome || "—";
}

export function PartnersApproval() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [indicadores, setIndicadores] = useState<ParceiroIndicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [observacaoModal, setObservacaoModal] = useState("");
  const [contagens, setContagens] = useState<ContagensParceiros | null>(null);

  // Paginação e Filtros
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<StatusAprovacao | "">("");
  const [termoBusca, setTermoBusca] = useState("");

  const [modal, setModal] = useState<{
    tipo: ModalTipo;
    parceiro: Parceiro | null;
  }>({
    tipo: null,
    parceiro: null,
  });

  const statusOptions: FilterOption[] = [
    { value: "", label: "Todos os Status" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "APROVADO", label: "Aprovado" },
    { value: "REJEITADO", label: "Rejeitado" },
  ];

  // Carrega a listagem do grid respeitando o parâmetro de busca/filtros
  const carregarParceiros = useCallback(async () => {
    setLoading(true);
    try {
      const resposta = await adminParceiroService.listarParceiros({
        page,
        limit,
        statusAprovacao: statusFiltro || undefined,
        busca: termoBusca.trim() || undefined,
      });

      const itens = extrairItens(resposta);
      setParceiros(itens);

      if (!Array.isArray(resposta)) {
        setTotalPages(resposta.totalPages || 1);
      } else {
        setTotalPages(Math.ceil(itens.length / limit) || 1);
      }
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFiltro, termoBusca]);

  // Carrega os dados para os cards de resumo estatístico
  const carregarContagensParceiros = useCallback(async () => {
    try {
      const resposta = await adminParceiroService.listarParceiros();

      if (!Array.isArray(resposta) && resposta.items) {
        const [pendentes, aprovados, rejeitados] = await Promise.all([
          adminParceiroService.listarParceiros({ statusAprovacao: "PENDENTE" }),
          adminParceiroService.listarParceiros({ statusAprovacao: "APROVADO" }),
          adminParceiroService.listarParceiros({ statusAprovacao: "REJEITADO" }),
        ]);

        setContagens({
          pendentes: extrairTotal(pendentes),
          aprovados: extrairTotal(aprovados),
          rejeitados: extrairTotal(rejeitados),
          total: resposta.total ?? extrairTotal(resposta),
        });
        return;
      }

      const lista = Array.isArray(resposta) ? resposta : [];

      setContagens({
        pendentes: lista.filter((p) => p.statusAprovacaoParceiro === "PENDENTE").length,
        aprovados: lista.filter((p) => p.statusAprovacaoParceiro === "APROVADO").length,
        rejeitados: lista.filter((p) => p.statusAprovacaoParceiro === "REJEITADO").length,
        total: lista.length,
      });
    } catch (error) {
      console.error("Erro ao carregar contagens de parceiros:", error);
    }
  }, []);

  useEffect(() => {
    carregarParceiros();
  }, [carregarParceiros]);

  useEffect(() => {
    carregarContagensParceiros();
  }, [carregarContagensParceiros]);

  useEffect(() => {
    async function carregarIndicadores() {
      try {
        const lista = await authService.listarParceirosIndicadores();
        setIndicadores(lista);
      } catch (error) {
        console.error("Erro ao carregar parceiros indicadores:", error);
      }
    }
    carregarIndicadores();
  }, []);

  // Reseta para página 1 ao mudar filtros ou busca
  const handleFilterChange = (val: StatusAprovacao | "") => {
    setStatusFiltro(val);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoBusca(e.target.value);
    setPage(1);
  };

  const obterNomeParceiroIndicador = (parceiro: Parceiro): string => {
    if (parceiro.parceiroIndicador?.nome) {
      return parceiro.parceiroIndicador.nome;
    }

    if (parceiro.parceiroIndicadorId) {
      const encontrado = indicadores.find(
        (ind) => String(ind.id) === String(parceiro.parceiroIndicadorId)
      );
      if (encontrado) return encontrado.nome;
    }

    if (parceiro.outroParceiro) {
      return parceiro.outroParceiro;
    }

    return "—";
  };

  // Garante filtragem client-side caso a API devolva lista inteira e não filtre no backend
  const parceirosFiltrados = parceiros.filter((parceiro) => {
    const atendeStatus =
      !statusFiltro || parceiro.statusAprovacaoParceiro === statusFiltro;

    const termo = termoBusca.toLowerCase().trim();
    const nomeExibicao = obterNomeOuRazaoSocial(parceiro).toLowerCase();
    const atendeBusca =
      !termo ||
      nomeExibicao.includes(termo) ||
      parceiro.nome?.toLowerCase().includes(termo) ||
      parceiro.razaoSocial?.toLowerCase().includes(termo) ||
      parceiro.email?.toLowerCase().includes(termo) ||
      parceiro.documento?.includes(termo);

    return atendeStatus && atendeBusca;
  });

  const abrirModal = (tipo: ModalTipo, parceiro: Parceiro) => {
    setObservacaoModal("");
    setModal({ tipo, parceiro });
  };

  const fecharModal = () => {
    setModal({ tipo: null, parceiro: null });
    setObservacaoModal("");
  };

  const processarAcaoModal = async () => {
    if (!modal.tipo || !modal.parceiro) return;

    setSalvando(true);
    try {
      const novoStatus: StatusAprovacao =
        modal.tipo === "aprovar" ? "APROVADO" : "REJEITADO";

      await adminParceiroService.atualizarStatusParceiro({
        id: modal.parceiro.id,
        status: novoStatus,
        observacao: observacaoModal.trim() || undefined,
      });

      await Promise.all([carregarParceiros(), carregarContagensParceiros()]);
      fecharModal();
    } catch (error) {
      console.error("Erro ao atualizar status do parceiro:", error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
              Aprovação de Parceiros
            </h1>
            <p className="text-sm sm:text-base text-white-500">
              Analise, filtre e aprove os parceiros cadastrados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar parceiro..."
                value={termoBusca}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
              />
              <Search className="w-4 h-4 text-white-400 absolute left-3 top-2.5" />
            </div>

            <AdminFilterDropdown
              placeholder="Filtros"
              options={statusOptions}
              value={statusFiltro}
              onChange={(val) => handleFilterChange(val as StatusAprovacao | "")}
            />
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="Pendentes"
            value={contagens?.pendentes}
            subtext="Parceiros"
            labelColor="text-orange-primary"
            iconBgColor="bg-orange-200"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-primary" />}
          />

          <SummaryCard
            label="Aprovados"
            value={contagens?.aprovados}
            subtext="Parceiros"
            labelColor="text-green-primary"
            iconBgColor="bg-green-bg-card"
            icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />

          <SummaryCard
            label="Rejeitados"
            value={contagens?.rejeitados}
            subtext="Parceiros"
            labelColor="text-red-primary"
            iconBgColor="bg-red-200"
            icon={<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-primary" />}
          />

          <SummaryCard
            label="Total de Parceiros"
            value={contagens?.total}
            subtext="Cadastrados"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<User className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white bg-green-primary text-sm font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-64">Nome / Razão Social</th>
                <th className="p-3 w-48">Parceiro Indicador</th>
                <th className="p-3 w-48">E-mail / Telefone</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white-500">
                    Carregando parceiros...
                  </td>
                </tr>
              ) : parceirosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white-500">
                    Nenhum parceiro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                parceirosFiltrados.map((parceiro) => {
                  const status = parceiro.statusAprovacaoParceiro || "PENDENTE";
                  const nomeExibicao = obterNomeOuRazaoSocial(parceiro);

                  return (
                    <tr
                      key={parceiro.id}
                      className="border-b border-white-100 last:border-0 hover:bg-white-50 transition-colors"
                    >
                      {/* 1. Coluna ID */}
                      <td className="p-4 font-medium text-sm text-black-primary">
                        #{parceiro.id}
                      </td>

                      {/* 2. Coluna Nome / Razão Social */}
                      <td className="p-4">
                        <p className="font-semibold text-sm text-black-primary">
                          {nomeExibicao}
                        </p>
                        <span className="text-xs text-white-400">
                          {parceiro.tipoParceiro} ({parceiro.tipoPessoa})
                        </span>
                      </td>

                      {/* 3. Coluna Parceiro Indicador */}
                      <td className="p-4 text-sm text-black-primary font-medium whitespace-nowrap">
                        {obterNomeParceiroIndicador(parceiro)}
                      </td>

                      {/* 4. Coluna E-mail / Telefone */}
                      <td className="p-4">
                        <p className="text-black-primary text-sm font-medium">
                          {parceiro.email}
                        </p>
                        <p className="text-xs text-white-500 mt-0.5">
                          {parceiro.telefone || "—"}
                        </p>
                      </td>

                      {/* 5. Coluna Status de Aprovação */}
                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={status} tipo="parceiro" />
                      </td>

                      {/* 6. Coluna Ações */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {status === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => abrirModal("aprovar", parceiro)}
                                className="p-1.5 rounded-lg border border-green-primary text-green-primary hover:bg-green-100 transition-colors cursor-pointer"
                                title="Aprovar Parceiro"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModal("rejeitar", parceiro)}
                                className="p-1.5 rounded-lg border border-red-primary text-red-primary hover:bg-red-100 transition-colors cursor-pointer"
                                title="Rejeitar Parceiro"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => abrirModal("detalhes", parceiro)}
                            className="p-1.5 rounded-lg border border-white-200 text-white-600 hover:text-black-primary hover:bg-green-100 transition-colors cursor-pointer"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 mt-4">
            <button
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white-200 disabled:opacity-50 hover:bg-white-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO (APROVAR/REJEITAR) */}
        {(modal.tipo === "aprovar" || modal.tipo === "rejeitar") && modal.parceiro && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-green-primary">
                  {modal.tipo === "aprovar"
                    ? "Confirmar Aprovação"
                    : "Confirmar Rejeição"}
                </h2>
                <button
                  onClick={fecharModal}
                  className="text-red-primary hover:text-red-hover cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-white-600 mb-4">
                Deseja {modal.tipo === "aprovar" ? "aprovar" : "rejeitar"} o parceiro{" "}
                <strong>{obterNomeOuRazaoSocial(modal.parceiro)}</strong>?
              </p>

              <label className="block mb-4">
                <span className="text-sm text-white-600 font-medium">
                  Observações (opcional)
                </span>
                <textarea
                  rows={3}
                  placeholder="Escreva um comentário..."
                  value={observacaoModal}
                  onChange={(e) => setObservacaoModal(e.target.value)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
                />
              </label>

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={fecharModal}
                  disabled={salvando}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={salvando}
                  onClick={processarAcaoModal}
                  fullWidth
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALHES */}
        {modal.tipo === "detalhes" && modal.parceiro && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">
                    Detalhes do Parceiro
                  </h2>
                  <p className="text-xs text-white-500">
                    ID do Parceiro: #{modal.parceiro.id}
                  </p>
                </div>
                <button
                  onClick={fecharModal}
                  className="text-white-500 hover:text-black-primary cursor-pointer"
                >
                  <X className="w-5 h-5 text-red-primary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white-50 p-3 rounded-lg border border-white-100">
                  <div>
                    <span className="text-xs text-white-500 block">
                      Status de Cadastro
                    </span>
                    <StatusBadge
                      status={
                        modal.parceiro.statusAprovacaoParceiro || "PENDENTE"
                      }
                      tipo="parceiro"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white-500 block">
                      Data de Cadastro
                    </span>
                    <span className="text-xs font-semibold text-black-primary">
                      {formatarData(modal.parceiro.criadoEm)}
                    </span>
                  </div>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Identificação
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">
                    {obterNomeOuRazaoSocial(modal.parceiro)}
                  </p>
                  {modal.parceiro.tipoParceiro !== "SOLIDARIO" && modal.parceiro.nome && (
                    <p className="text-xs text-white-500">
                      Nome Fantasia / Nome: {modal.parceiro.nome}
                    </p>
                  )}
                  {modal.parceiro.responsavelLegal && (
                    <p className="text-xs text-white-500 mt-1">
                      Responsável Legal: {modal.parceiro.responsavelLegal}
                    </p>
                  )}
                  <p className="text-xs text-white-500 mt-1">
                    Tipo: <strong>{modal.parceiro.tipoPessoa}</strong> (
                    {modal.parceiro.tipoParceiro})
                  </p>
                  <p className="text-xs text-white-500 mt-0.5">
                    Parceiro Indicador:{" "}
                    <strong>{obterNomeParceiroIndicador(modal.parceiro)}</strong>
                  </p>
                  <p className="text-xs text-white-500 mt-0.5">
                    CPF/CNPJ: {modal.parceiro.documento || "—"}
                  </p>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Contato
                  </h3>
                  <p className="text-xs text-white-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {modal.parceiro.email}
                  </p>
                  <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {modal.parceiro.telefone || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={fecharModal}
                  fullWidth
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PartnersApproval;