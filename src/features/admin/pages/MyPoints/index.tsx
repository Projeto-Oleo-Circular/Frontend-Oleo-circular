import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  adminPontosService,
  type PontoColetaAdmin,
  type StatusAprovacao,
} from "../../../../services/adminPontosService";

import StatusBadge from "../../../../components/ui/StatusBadge";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import AdminFilterDropdown, {
  FilterOption,
} from "../../../../components/ui/AdminFilterDropdown";

import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Building2,
  Mail,
  Eye,
  X,
  Check,
  FileText,
} from "lucide-react";

import SummaryCard from "../../../../components/ui/SummaryCard";
import Button from "../../../../components/ui/Button";
import Pagination from "../../../../components/ui/Pagination";
import Footer from "../../../../components/layout/Footer";

interface ContagensPontos {
  pendentes: number;
  aprovados: number;
  rejeitados: number;
  total: number;
}

type ModalTipo = "aprovar" | "rejeitar" | "detalhes" | "erro_parceiro" | null;

function formatarEndereco(ponto: PontoColetaAdmin): string {
  const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
  return ponto.estado ? `${base}/${ponto.estado}` : base;
}

export function PointsApproval() {
  const [pontos, setPontos] = useState<PontoColetaAdmin[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFiltro, setStatusFiltro] = useState<StatusAprovacao | "">("");
  const [contagens, setContagens] = useState<ContagensPontos | null>(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [observacaoModal, setObservacaoModal] = useState("");
  const [mensagemErroModal, setMensagemErroModal] = useState("")

  const [modal, setModal] = useState<{
    tipo: ModalTipo;
    ponto: PontoColetaAdmin | null;
  }>({
    tipo: null,
    ponto: null,
  });

  const statusOptions: FilterOption[] = [
    { value: "", label: "Todos os Status" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "APROVADO", label: "Aprovado" },
    { value: "REJEITADO", label: "Rejeitado" },
  ];

  const carregarPontos = useCallback(async () => {
    setLoading(true);
    try {
      const resposta = await adminPontosService.listarPontos({
        page,
        limit,
        statusAprovacao: statusFiltro || undefined,
      });

      setPontos(resposta.items || []);
      setTotalPages(resposta.totalPages || 1);
      setTotalItems(resposta.total || 0);
    } catch (error) {
      console.error("Erro ao carregar pontos de coleta:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFiltro]);

  const carregarContagensPontos = useCallback(async () => {
    try {
      const [pendentes, aprovados, rejeitados, total] = await Promise.all([
        adminPontosService.listarPontos({ statusAprovacao: "PENDENTE", limit: 1 }),
        adminPontosService.listarPontos({ statusAprovacao: "APROVADO", limit: 1 }),
        adminPontosService.listarPontos({ statusAprovacao: "REJEITADO", limit: 1 }),
        adminPontosService.listarPontos({ limit: 1 }),
      ]);

      setContagens({
        pendentes: pendentes.total,
        aprovados: aprovados.total,
        rejeitados: rejeitados.total,
        total: total.total,
      });
    } catch (error) {
      console.error("Erro ao carregar contagens:", error);
    }
  }, []);

  useEffect(() => {
    carregarPontos();
    carregarContagensPontos();
  }, [carregarPontos, carregarContagensPontos]);

  const abrirModal = (tipo: ModalTipo, ponto: PontoColetaAdmin) => {
    setObservacaoModal("");
    setModal({ tipo, ponto });
  };

  const fecharModal = () => {
    setModal({ tipo: null, ponto: null });
    setObservacaoModal("");
  };

  const processarAcaoModal = async () => {
    if (!modal.tipo || !modal.ponto) return;

    setSalvando(true);
    try {
      const novoStatus: StatusAprovacao =
        modal.tipo === "aprovar" ? "APROVADO" : "REJEITADO";

      await adminPontosService.atualizarStatusPonto({
        id: modal.ponto.id,
        status: novoStatus,
        observacao: observacaoModal.trim() || undefined,
      });

      await Promise.all([carregarPontos(), carregarContagensPontos()]);
      fecharModal();
    } catch (error) {
      console.error("Erro ao atualizar status do ponto:", error);

        let msg = "Não foi possível concluir a ação no ponto de coleta.";
        let status: number | undefined;

        // Verifica se o erro veio de uma requisição do Axios
        if (axios.isAxiosError(error)) {
          msg = error.response?.data?.message || msg;
          status = error.response?.status;
        } else if (error instanceof Error) {
          msg = error.message;
        }

        // Verifica se a mensagem contém o motivo do parceiro ou se foi status 400
        if (msg.includes("parceiro") || status === 400) {
          setMensagemErroModal(msg);
          setModal((prev) => ({ ...prev, tipo: "erro_parceiro" }));
        }
      } finally {
    setSalvando(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
              Pontos de Coleta
            </h1>
            <p className="text-sm sm:text-base text-white-500">
              Acompanhe, gerencie e aprove a criação de novos pontos de coleta.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AdminFilterDropdown
              placeholder="Filtros"
              options={statusOptions}
              value={statusFiltro}
              onChange={(val) => {
                setPage(1);
                setStatusFiltro(val as StatusAprovacao | "");
              }}
            />
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="Pendentes"
            value={contagens?.pendentes}
            subtext="Pontos"
            labelColor="text-orange-primary"
            iconBgColor="bg-orange-200"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-primary" />}
          />

          <SummaryCard
            label="Aprovados"
            value={contagens?.aprovados}
            subtext="Pontos"
            labelColor="text-green-primary"
            iconBgColor="bg-green-bg-card"
            icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />

          <SummaryCard
            label="Rejeitados"
            value={contagens?.rejeitados}
            subtext="Pontos"
            labelColor="text-red-primary"
            iconBgColor="bg-red-200"
            icon={<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-primary" />}
          />

          <SummaryCard
            label="Total de Pontos"
            value={contagens?.total}
            subtext="Cadastrados"
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />
        </div>

        {/* TABELA DE PONTOS */}
        <div className="bg-white-primary rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white-primary bg-green-400">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-48">Nome do Ponto</th>
                <th className="p-3 w-64">Parceiro Responsável</th>
                <th className="p-3">Endereço</th>
                <th className="p-3 w-40">Capacidade</th>
                <th className="p-3 w-32">Aprovação</th>
                <th className="p-3 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white-500">
                    Carregando pontos de coleta...
                  </td>
                </tr>
              ) : pontos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white-500">
                    Nenhum ponto de coleta encontrado.
                  </td>
                </tr>
              ) : (
                pontos.map((ponto) => {
                  const status: StatusAprovacao =
                    ponto.statusAprovacaoPontoColeta || "PENDENTE";

                  return (
                    <tr
                      key={ponto.id}
                      className="border-b border-white-100 last:border-0 hover:bg-white-50 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium text-black-primary">
                        #{ponto.id}
                      </td>
                      <td className="p-4 text-sm font-medium text-black-primary">
                        {ponto.nomePontoColeta}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-black-primary">
                          {ponto.parceiro?.nomeRazaoSocial}
                        </p>
                        {ponto.parceiro?.documento && (
                          <p className="text-xs text-white-500 mt-0.5">
                            {ponto.parceiro.documento}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-black-primary max-w-xs">
                        <div
                          className="flex items-start gap-1.5"
                          title={formatarEndereco(ponto)}
                        >
                          <MapPin className="w-4 h-4 shrink-0 text-green-primary mt-0.5" />
                          <span className="text-sm leading-relaxed truncate">
                            {formatarEndereco(ponto)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-black-primary whitespace-nowrap">
                        {ponto.capacidadeBombona} L
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={status} tipo="ponto" />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {status === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => abrirModal("aprovar", ponto)}
                                className="p-1.5 rounded-lg border border-green-primary text-green-primary hover:bg-green-100 transition-colors cursor-pointer"
                                title="Aprovar Ponto"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModal("rejeitar", ponto)}
                                className="p-1.5 rounded-lg border border-red-primary text-red-primary hover:bg-red-100 transition-colors cursor-pointer"
                                title="Rejeitar Ponto"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => abrirModal("detalhes", ponto)}
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

        {/* PAGINAÇÃO */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={(novaPagina) => setPage(novaPagina)}
          onItemsPerPageChange={(novoLimite) => {
            setLimit(novoLimite);
            setPage(1);
          }}
        />

        {/* MODAL CONFIRMAÇÃO */}
        {(modal.tipo === "aprovar" || modal.tipo === "rejeitar") && modal.ponto && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-green-primary">
                  {modal.tipo === "aprovar" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
                </h2>
                <button onClick={fecharModal} className="text-red-primary hover:text-red-hover cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-white-600 mb-4">
                Deseja {modal.tipo === "aprovar" ? "aprovar" : "rejeitar"} o ponto de coleta{" "}
                <strong>{modal.ponto.nomePontoColeta}</strong>?
              </p>

              <label className="block mb-4">
                <span className="text-sm text-white-600 font-medium">Observações (opcional)</span>
                <textarea
                  rows={3}
                  placeholder="Escreva um comentário..."
                  value={observacaoModal}
                  onChange={(e) => setObservacaoModal(e.target.value)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
                />
              </label>

              <div className="flex gap-3">
                <Button variant="danger" size="sm" onClick={fecharModal} disabled={salvando} fullWidth>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" loading={salvando} onClick={processarAcaoModal} fullWidth>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALHES */}
        {modal.tipo === "detalhes" && modal.ponto && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">Detalhes do Ponto de Coleta</h2>
                  <p className="text-xs text-white-500">ID do ponto: #{modal.ponto.id}</p>
                </div>
                <button onClick={fecharModal} className="text-white-500 hover:text-black-primary cursor-pointer">
                  <X className="w-5 h-5 text-red-primary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white-50 p-3 rounded-lg border border-white-100">
                  <div>
                    <span className="text-xs text-white-500 block">Status de Aprovação</span>
                    <StatusBadge status={modal.ponto.statusAprovacaoPontoColeta || "PENDENTE"} tipo="ponto" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white-500 block">Capacidade Bombona</span>
                    <span className="text-xs font-semibold text-black-primary">{modal.ponto.capacidadeBombona} Litros</span>
                  </div>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Informações do Ponto
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">{modal.ponto.nomePontoColeta}</p>
                  <p className="text-xs text-white-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-primary" />
                    <span>{formatarEndereco(modal.ponto)}</span>
                  </p>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Parceiro Responsável
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">{modal.ponto.parceiro.nomeRazaoSocial}</p>
                  {modal.ponto.parceiro.documento && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3" /> {modal.ponto.parceiro.documento}
                    </p>
                  )}
                  {modal.ponto.parceiro.email && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" /> {modal.ponto.parceiro.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button variant="primary" size="sm" onClick={fecharModal} fullWidth>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE ERRO - PARCEIRO PENDENTE OU REJEITADO */}
        {modal.tipo === "erro_parceiro" && modal.ponto && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4 border-b border-white-100 pb-3">
                <div className="flex items-center gap-2 text-red-primary">
                  <XCircle className="w-5 h-5" />
                  <h2 className="font-bold text-lg">Ação Impedida</h2>
                </div>
                <button
                  onClick={fecharModal}
                  className="text-white-500 hover:text-black-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-sm text-black-primary leading-relaxed">
                  {mensagemErroModal}
                </p>
                <p className="text-xs text-white-500">
                  Você precisa primeiro aprovar o cadastro do parceiro{" "}
                  <strong>{modal.ponto.parceiro?.nomeRazaoSocial}</strong> para depois aprovar este ponto.
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={fecharModal} fullWidth>
                  Entendi
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

export default PointsApproval;