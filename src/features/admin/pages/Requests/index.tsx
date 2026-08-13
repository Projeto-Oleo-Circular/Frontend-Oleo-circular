import { useEffect, useState, useCallback } from "react"
import {
  adminSolicitacoesService,
  type SolicitacaoColeta,
  type StatusSolicitacao,
} from "../../../../services/AdminSolicitacaoService"
import StatusBadge from "../../../../components/ui/StatusBadge"
import AdminTopNav from "../../../../components/layout/AdminTopNav"
import AdminFilterDropdown, { FilterOption } from "../../../../components/ui/AdminFilterDropdown"
import { Clock, CalendarCheck, Truck, CheckCircle2, X, Eye, MapPin, User, Building2, Phone, Mail, Download } from "lucide-react"
import SummaryCard from "../../../../components/ui/SummaryCard"
import Button from "../../../../components/ui/Button"
import Pagination from "../../../../components/ui/Pagination"
import Footer from "../../../../components/layout/Footer"
import {
  authService,
  type ParceiroIndicador, // ← ADICIONE ESTE IMPORT
} from "../../../../services/authService";

interface Contagens {
  aguardando: number
  agendada: number
  emRota: number
  concluid: number
  total: number
}

type ModalTipo = "agendar" | "concluir" | "detalhes" | null;

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  
  // Garante a formatação no fuso horário de Brasília
  const dataFormatada = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return `${dataFormatada} ${horaFormatada}`;
}

function formatarEndereco(ponto: SolicitacaoColeta["pontoColeta"]): string {
  const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
  return ponto.estado ? `${base}/${ponto.estado}` : base;
}

function Requests() {
  const [itens, setItens] = useState<SolicitacaoColeta[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | "">("");
  const [loading, setLoading] = useState(true);
  const historicoSemanalTotal = [10, 15, 8, 22, 18, 30, 25];
  const [indicadores, setIndicadores] = useState<ParceiroIndicador[]>([]);

  const statusOptions: FilterOption[] = [
    { value: "", label: "Todos os Status" },
    { value: "AGUARDANDO", label: "Aguardando" },
    { value: "AGENDADA", label: "Agendada" },
    { value: "EM_ROTA", label: "Em Rota" },
    { value: "CONCLUIDA", label: "Concluída" },
  ];

  const [contagens, setContagens] = useState<Contagens | null>(null);

  const [modal, setModal] = useState<{ tipo: ModalTipo; solicitacao: SolicitacaoColeta | null }>({
    tipo: null,
    solicitacao: null,
  });
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [volumeColetado, setVolumeColetado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarLista = useCallback(async () => {
    setLoading(true);
    try {
      const resposta = await adminSolicitacoesService.listar({
        page,
        limit,
        status: statusFiltro || undefined,
      });
      setItens(resposta.items);
      setTotalPages(resposta.totalPages);
      setTotalItems(resposta.total);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFiltro]);

  const carregarContagens = useCallback(async () => {
    try {
      const [aguardando, agendada, emRota, concluida, total] = await Promise.all([
        adminSolicitacoesService.listar({ status: "AGUARDANDO", limit: 1 }),
        adminSolicitacoesService.listar({ status: "AGENDADA", limit: 1 }),
        adminSolicitacoesService.listar({ status: "EM_ROTA", limit: 1 }),
        adminSolicitacoesService.listar({ status: "CONCLUIDA", limit: 1 }),
        adminSolicitacoesService.listar({ limit: 1 }),
      ]);
      setContagens({
        aguardando: aguardando.total,
        agendada: agendada.total,
        emRota: emRota.total,
        concluid: concluida.total,
        total: total.total,
      });
    } catch (error) {
      console.error("Erro ao carregar contagens:", error);
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  useEffect(() => {
    carregarContagens();
  }, [carregarContagens]);

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

      const obterNomeParceiroIndicador = (solicitacao: SolicitacaoColeta): string => {
      // 1. Tenta buscar pelo ID na lista de indicadores
      if (solicitacao.parceiro?.parceiroIndicadorId) {
        const encontrado = indicadores.find(
          (ind) => String(ind.id) === String(solicitacao.parceiro?.parceiroIndicadorId)
        );
        if (encontrado) return encontrado.nome;
      }

      // 2. Se não encontrou, retorna "—"
      return "—";
    };
      const abrirModal = (tipo: ModalTipo, solicitacao: SolicitacaoColeta) => {
        setModal({ tipo, solicitacao });
        setDataAgendamento("");
        setVolumeColetado("");
      };

  const fecharModal = () => setModal({ tipo: null, solicitacao: null });

  const confirmarTransicaoSimples = async (solicitacao: SolicitacaoColeta, novoStatus: StatusSolicitacao) => {
    setSalvando(true);
    try {
      await adminSolicitacoesService.atualizarStatus(solicitacao.id, { status: novoStatus });
      await Promise.all([carregarLista(), carregarContagens()]);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarModal = async () => {
    if (!modal.solicitacao || !modal.tipo) return;
    setSalvando(true);
    try {
      if (modal.tipo === "agendar") {
        await adminSolicitacoesService.atualizarStatus(modal.solicitacao.id, {
          status: "AGENDADA",
          dataAgendamento: new Date(dataAgendamento).toISOString(),
        });
      } else if (modal.tipo === "concluir") {
        await adminSolicitacoesService.atualizarStatus(modal.solicitacao.id, {
          status: "CONCLUIDA",
          volumeColetado: Number(volumeColetado),
        });
      }
      await Promise.all([carregarLista(), carregarContagens()]);
      fecharModal();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setSalvando(false);
    }
  };

  const renderAcao = (solicitacao: SolicitacaoColeta) => {
    return (
      <div className="flex items-center gap-2">
        {solicitacao.status === "AGUARDANDO" && (
          <button
            onClick={() => abrirModal("agendar", solicitacao)}
            className="px-3 py-1.5 rounded-lg border border-green-primary text-green-primary text-xs font-semibold hover:bg-green-100 transition-colors cursor-pointer"
          >
            Agendar
          </button>
        )}
        {solicitacao.status === "AGENDADA" && (
          <button
            onClick={() => confirmarTransicaoSimples(solicitacao, "EM_ROTA")}
            disabled={salvando}
            className="px-3 py-1.5 rounded-lg border border-violet-500 text-violet-600 text-xs font-semibold hover:bg-violet-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Em Rota
          </button>
        )}
        {solicitacao.status === "EM_ROTA" && (
          <button
            onClick={() => abrirModal("concluir", solicitacao)}
            className="px-3 py-1.5 rounded-lg border border-green-primary text-green-primary text-xs font-semibold hover:bg-green-primary/10 transition-colors cursor-pointer"
          >
            Concluir
          </button>
        )}
        
        <button
          onClick={() => abrirModal("detalhes", solicitacao)}
          className="p-1.5 rounded-lg border border-white-200 text-white-600 hover:text-black-primary hover:bg-green-100 transition-colors cursor-pointer"
          title="Ver Detalhes"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
              Solicitações de coleta
            </h1>
            <p className="text-sm sm:text-base text-white-500">
              Acompanhe e gerencie todas as solicitações de coleta de óleo de cozinha usado.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AdminFilterDropdown
              placeholder="Filtros"
              options={statusOptions}
              value={statusFiltro}
              onChange={(val) => {
                setPage(1);
                setStatusFiltro(val as StatusSolicitacao | "");
              }}
            />
            <button
              onClick={() => {
                // Lógica de exportação de relatório
              }}
              className="flex items-center bg-green-primary hover:bg-green-hover text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <span>Exportar relatório</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            label="Aguardando"
            value={contagens?.aguardando}
            subtext="Solicitações"
            labelColor="text-orange-primary"
            iconBgColor="bg-orange-200"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-primary" />}
          />

          <SummaryCard
            label="Agendadas"
            value={contagens?.agendada}
            subtext="Solicitações"
            labelColor="text-blue-primary"
            iconBgColor="bg-blue-bg-card"
            icon={<CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-primary" />}
          />

          <SummaryCard
            label="Em Rota"
            value={contagens?.emRota}
            subtext="Solicitações"
            labelColor="text-violet-primary"
            iconBgColor="bg-violet-bg-card"
            icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6 text-violet-primary" />}
          />

          <SummaryCard
            label="Concluídas"
            value={contagens?.concluid}
            subtext="Esta semana"
            labelColor="text-green-primary"
            iconBgColor="bg-green-bg-card"
            icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-primary" />}
          />

          <SummaryCard
            label="Total de Solicitações"
            value={contagens?.total}
            subtext="Esta semana"
            labelColor="text-green-primary"
            sparklineData={historicoSemanalTotal}
            sparklineColor="#1A6E3C"
          />
        </div>

        <div className="bg-white-primary rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white bg-green-primary text-sm font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-64">Solicitante</th>
                <th className="p-3 w-44">Data Solicitação</th>
                <th className="p-3">Endereço</th>
                <th className="p-3 w-48">Parceiro</th>
                <th className="p-3 w-48">Ponto de Coleta</th>
                <th className="p-3 w-40">Tamanho da Bombona</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-white-500">
                    Carregando solicitações...
                  </td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-white-500">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                itens.map((s) => (
                  <tr key={s.id} className="border-b border-white-100 last:border-0 hover:bg-white-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-black-primary">#{s.id}</td>
                    
                    <td className="p-4">
                      <p className="font-medium text-sm text-sm text-black-primary">{s.parceiro.razaoSocial}</p>
                        {s.parceiro.documento && (
                          <p className="text-xs text-white-500 mt-0.5">{s.parceiro.documento}</p>
                        )}
                      </td>

                    <td className="p-4 text-sm text-black-primary font-medium whitespace-nowrap">{formatarData(s.dataSolicitacao)}</td>
                    
                    <td className="p-4 text-black-primary font-medium max-w-xs">
                      <div className="flex items-start gap-1.5" title={formatarEndereco(s.pontoColeta)}>
                        <MapPin className="w-4 h-4 shrink-0 text-green-primary mt-0.5" />
                        <span className="text-sm leading-relaxed truncate">
                          {formatarEndereco(s.pontoColeta)}
                        </span>
                      </div>
                    </td>

                     <td className="p-4 text-sm font-medium text-black-primary">
                      {obterNomeParceiroIndicador(s)}
                    </td>
                    
                    <td className="p-4 text-sm text-black-primary font-medium">{s.pontoColeta.nomePontoColeta}</td>
                    
                    <td className="p-4 text-sm text-black-primary font-medium  whitespace-nowrap">{s.pontoColeta.capacidadeBombona} L</td>
                    
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-4 whitespace-nowrap">{renderAcao(s)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

        {(modal.tipo === "agendar" || modal.tipo === "concluir") && modal.solicitacao && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-green-primary">
                  {modal.tipo === "agendar" ? "Agendar coleta" : "Concluir coleta"} — #{modal.solicitacao.id}
                </h2>
                <button onClick={fecharModal} className="text-red-primary hover:text-red-hover cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modal.tipo === "agendar" && (
                <label className="block mb-4">
                  <span className="text-sm text-white-600 font-medium">Data e Hora do Agendamento</span>
                  <input
                    type="datetime-local"
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full border border-white-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  />
                </label>
              )}

              {modal.tipo === "concluir" && (
                <label className="block mb-4">
                  <span className="text-sm text-white-500 font-medium">Volume coletado (litros)</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 50"
                    value={volumeColetado}
                    onChange={(e) => setVolumeColetado(e.target.value)}
                    className="w-full border border-white-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  />
                </label>
              )}

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
                  onClick={confirmarModal}
                  disabled={
                    salvando ||
                    (modal.tipo === "agendar" && !dataAgendamento) ||
                    (modal.tipo === "concluir" && !volumeColetado)
                  }
                  fullWidth
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {modal.tipo === "detalhes" && modal.solicitacao && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-orange-primary">Detalhes da Solicitação</h2>
                  <p className="text-xs text-white-500">ID da solicitação: #{modal.solicitacao.id}</p>
                </div>
                <button onClick={fecharModal} className="text-white-500 hover:text-black-primary cursor-pointer">
                  <X className="w-5 h-5 text-red-primary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white-50 p-3 rounded-lg border border-white-100">
                  <div>
                    <span className="text-xs text-white-500 block">Status Atual</span>
                    <StatusBadge status={modal.solicitacao.status} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white-500 block">Data da Solicitação</span>
                    <span className="text-xs font-semibold text-black-primary">
                      {formatarData(modal.solicitacao.dataSolicitacao)}
                    </span>
                  </div>
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Solicitante / Parceiro
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">{modal.solicitacao.parceiro.razaoSocial}</p>
                  {modal.solicitacao.parceiro.email && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" /> {modal.solicitacao.parceiro.email}
                    </p>
                  )}
                  {modal.solicitacao.parceiro.telefone && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {modal.solicitacao.parceiro.telefone}
                    </p>
                  )}
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Ponto de Coleta
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">{modal.solicitacao.pontoColeta.nomePontoColeta}</p>
                  <p className="text-xs text-white-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-primary" /> 
                    <span>{formatarEndereco(modal.solicitacao.pontoColeta)}</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-white-100 flex items-center justify-between text-xs">
                    <span className="text-white-500">Capacidade da bombona:</span>
                    <span className="font-semibold text-black-primary">{modal.solicitacao.pontoColeta.capacidadeBombona} Litros</span>
                  </div>
                </div>

                {modal.solicitacao?.observacoes && (
                  <div className="bg-white-primary border border-white-100 rounded-lg p-3">
                    <span className="text-xs font-bold text-green-primary uppercase tracking-wider block mb-1">
                      Observações do Parceiro:
                    </span>
                    <p className="text-sm text-white-500 italic">
                      "{modal.solicitacao.observacoes}"
                    </p>
                  </div>
                )}
                
                {(modal.solicitacao.dataAgendamento || modal.solicitacao.volumeColetado) && (
                  <div className="border border-white-100 rounded-lg p-3 bg-green-primary/5">
                    <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
                      Histórico da Coleta
                    </h3>
                    {modal.solicitacao.dataAgendamento && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-white-500">Agendado para:</span>
                        <span className="font-semibold text-black-primary">{formatarData(modal.solicitacao.dataAgendamento)}</span>
                      </div>
                    )}
                    {modal.solicitacao.volumeColetado && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-white-500">Volume Real Coletado:</span>
                        <span className="font-bold text-green-primary">{modal.solicitacao.volumeColetado} Litros</span>
                      </div>
                    )}
                  </div>
                )}
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

export default Requests;