// src/pages/Admin/Requests/index.tsx

import { useEffect, useState, useCallback } from "react";
import {
  adminSolicitacoesService,
  type SolicitacaoColeta,
  type StatusSolicitacao,
} from "../../../../services/AdminSolicitacaoService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import AdminFilterDropdown, { FilterOption } from "../../../../components/ui/AdminFilterDropdown";
import { Clock, CalendarCheck, Truck, CheckCircle2, X, Eye, MapPin, User, Building2, Phone, Mail, Plus, Search } from "lucide-react";
import SummaryCard from "../../../../components/ui/SummaryCard";
import Button from "../../../../components/ui/Button";
import Pagination from "../../../../components/ui/Pagination";
import Footer from "../../../../components/layout/Footer";
import {
  authService,
  type ParceiroIndicador,
} from "../../../../services/authService";
import { adminPontosService, type PontoColetaAdmin } from "../../../../services/adminPontosService";
import { adminParceiroService, type Parceiro } from "../../../../services/adminParceiroService";

interface Contagens {
  aguardando: number;
  agendada: number;
  emRota: number;
  concluid: number;
  total: number;
}

type ModalTipo = "agendar" | "concluir" | "detalhes" | null;
type StepCriar = "selecionar_parceiro" | "selecionar_ponto" | "dados_solicitacao";

const TURNOS_AGENDAMENTO = [
  {
    turno: 'Manhã',
    slots: ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00']
  },
  {
    turno: 'Tarde',
    slots: ['13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00']
  },
  {
    turno: 'Noite',
    slots: ['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00']
  }
];

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (isNaN(data.getTime())) return "—";
  
  const dataFormatada = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return `${dataFormatada} às ${horaFormatada}`;
}

function formatarAgendamentoCompleto(isoData: string | null): string {
  if (!isoData) return "—";
  
  const data = new Date(isoData);
  if (isNaN(data.getTime())) return "—";

  const dataFormatada = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const horaInicio = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });

  const [h] = horaInicio.split(":").map(Number);
  const horaFimNum = h + 1;
  const horaFim = `${String(horaFimNum).padStart(2, '0')}:00`;

  let turno = "";
  if (h >= 8 && h < 12) turno = "Manhã";
  else if (h >= 13 && h < 17) turno = "Tarde";
  else if (h >= 18 && h < 22) turno = "Noite";
  else turno = "Comercial";

  return `${dataFormatada} • ${turno} (${horaInicio} - ${horaFim})`;
}

function formatarEndereco(ponto: SolicitacaoColeta["pontoColeta"]): string {
  if (!ponto) return "—";
  const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
  return ponto.estado ? `${base}/${ponto.estado}` : base;
}

function obterNomeExibicaoParceiro(parceiro: Parceiro): string {
  if (parceiro.tipoParceiro === "SOLIDARIO") {
    return parceiro.nome || "—";
  }
  return parceiro.razaoSocial || parceiro.nome || "—";
}

function formatarEnderecoPonto(ponto: PontoColetaAdmin): string {
  const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
  return ponto.estado ? `${base}/${ponto.estado}` : base;
}

export function Requests() {
  const [itens, setItens] = useState<SolicitacaoColeta[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | "">("");
  const [loading, setLoading] = useState(true);
  const historicoSemanalTotal = [10, 15, 8, 22, 18, 30, 25];
  const [indicadores, setIndicadores] = useState<ParceiroIndicador[]>([]);
  
  // Modais
  const [isModalCriarOpen, setIsModalCriarOpen] = useState(false);
  const [stepCriar, setStepCriar] = useState<StepCriar>("selecionar_parceiro");
  const [parceiroSelecionado, setParceiroSelecionado] = useState<Parceiro | null>(null);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoColetaAdmin | null>(null);
  const [pontosDisponiveis, setPontosDisponiveis] = useState<PontoColetaAdmin[]>([]);
  const [observacaoCriar, setObservacaoCriar] = useState("");
  const [volumeInformado, setVolumeInformado] = useState<number>(50);
  const [parceirosList, setParceirosList] = useState<Parceiro[]>([]);
  const [buscaParceiro, setBuscaParceiro] = useState("");
  const [carregandoParceiros, setCarregandoParceiros] = useState(false);

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
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
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

  useEffect(() => {
    if (isModalCriarOpen && stepCriar === "selecionar_parceiro") {
      carregarParceirosModal();
    }
  }, [isModalCriarOpen, stepCriar]);

  const carregarParceirosModal = async () => {
    setCarregandoParceiros(true);
    try {
      const resposta = await adminParceiroService.listarParceiros({
        limit: 100,
        statusAprovacao: "APROVADO",
      });
      const itensArr = Array.isArray(resposta) ? resposta : resposta.items || [];
      setParceirosList(itensArr);
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
    } finally {
      setCarregandoParceiros(false);
    }
  };

  const handleSelecionarParceiroModal = async (parceiro: Parceiro) => {
    setCarregandoParceiros(true);
    try {
      setParceiroSelecionado(parceiro);
      const resposta = await adminPontosService.listarPontos({
        limit: 100,
        statusAprovacao: "APROVADO",
      });
      const pontosFiltrados = (resposta.items || []).filter((p) => p.parceiro?.id === parceiro.id);
      setPontosDisponiveis(pontosFiltrados);
      
      if (pontosFiltrados.length === 0) {
        setStepCriar("dados_solicitacao");
        setObservacaoCriar("Este parceiro não possui pontos de coleta aprovados.");
      } else {
        setStepCriar("selecionar_ponto");
      }
    } catch (error) {
      console.error("Erro ao carregar pontos:", error);
    } finally {
      setCarregandoParceiros(false);
    }
  };

  const fecharModalCriar = () => {
    setIsModalCriarOpen(false);
    setStepCriar("selecionar_parceiro");
    setParceiroSelecionado(null);
    setPontoSelecionado(null);
    setPontosDisponiveis([]);
    setObservacaoCriar("");
    setVolumeInformado(50);
    setBuscaParceiro("");
  };

  const handleCriarSolicitacaoAdminSubmit = async () => {
    if (!pontoSelecionado) return;
    setSalvando(true);
    try {
      await SolicitacoesService.criar({
        pontoColetaId: pontoSelecionado.id,
        volumeInformado: Number(volumeInformado),
        observacoes: observacaoCriar || undefined,
      });

      fecharModalCriar();
      setStatusFiltro("");
      setPage(1);
      await Promise.all([carregarLista(), carregarContagens()]);
    } catch (error) {
      console.error("Erro ao criar solicitação via admin:", error);
    } finally {
      setSalvando(false);
    }
  };

  const obterNomeParceiroIndicador = (solicitacao: SolicitacaoColeta): string => {
    if (solicitacao.parceiro?.parceiroIndicadorId) {
      const encontrado = indicadores.find(
        (ind) => String(ind.id) === String(solicitacao.parceiro?.parceiroIndicadorId)
      );
      if (encontrado) return encontrado.nome;
    }
    return "—";
  };

  const abrirModal = (tipo: ModalTipo, solicitacao: SolicitacaoColeta) => {
    setModal({ tipo, solicitacao });
    setDataAgendamento("");
    setHorarioSelecionado("");
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
        const horaInicio = horarioSelecionado.split(" - ")[0]; 
        const dataHoraLocal = `${dataAgendamento} ${horaInicio}:00`;

        await adminSolicitacoesService.atualizarStatus(modal.solicitacao.id, {
          status: "AGENDADA",
          dataAgendamento: dataHoraLocal, 
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

  const parceirosFiltrados = parceirosList.filter((p) => {
    const termo = buscaParceiro.toLowerCase().trim();
    if (!termo) return true;
    const nome = p.nome?.toLowerCase() || "";
    const razao = p.razaoSocial?.toLowerCase() || "";
    const email = p.email?.toLowerCase() || "";
    const documento = p.documento || "";
    return nome.includes(termo) || razao.includes(termo) || email.includes(termo) || documento.includes(termo);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-5 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
              Solicitações de coleta
            </h1>
            <p className="text-sm sm:text-base text-white-500">
              Acompanhe e gerencie todas as solicitações de coleta de óleo de cozinha usado.
            </p>
          </div>

          <div className="flex items-center justify-start gap-3">
            <AdminFilterDropdown
              placeholder="Filtros"
              options={statusOptions}
              value={statusFiltro}
              onChange={(val) => {
                setPage(1);
                setStatusFiltro(val as StatusSolicitacao | "");
              }}
            />
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

        {/* BOTÃO NOVA SOLICITAÇÃO */}
        <div className="flex justify-end mb-4">
          <div className="inline-block">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalCriarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Solicitação
            </Button>
          </div>
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
                <th className="p-3 w-40">Volume Informado</th>
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
                      <p className="font-medium text-sm text-black-primary">{s.parceiro?.razaoSocial || s.parceiro?.nome || "—"}</p>
                      {s.parceiro?.documento && (
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
                    
                    <td className="p-4 text-sm text-black-primary font-medium">{s.pontoColeta?.nomePontoColeta || "—"}</td>
                    
                    <td className="p-4 text-sm text-black-primary font-medium whitespace-nowrap">{s.volumeInformado || s.pontoColeta?.capacidadeBombona || "—"} L</td>
                    
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

        {/* MODAL: CRIAR SOLICITAÇÃO ADMIN */}
        {isModalCriarOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">
                    {stepCriar === "selecionar_parceiro" && "Selecionar Parceiro"}
                    {stepCriar === "selecionar_ponto" && "Selecionar Ponto de Coleta"}
                    {stepCriar === "dados_solicitacao" && "Nova Solicitação de Coleta"}
                  </h2>
                  <p className="text-xs text-white-500">
                    {stepCriar === "selecionar_parceiro" && "Escolha o parceiro que fará a solicitação"}
                    {stepCriar === "selecionar_ponto" && "Escolha um dos pontos de coleta do parceiro"}
                    {stepCriar === "dados_solicitacao" && "Preencha os dados da solicitação"}
                  </p>
                </div>
                <button onClick={fecharModalCriar} className="text-red-primary hover:text-red-hover cursor-pointer" disabled={salvando}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {stepCriar === "selecionar_parceiro" && (
                <div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Buscar por nome, razão social, e-mail ou documento..."
                      value={buscaParceiro}
                      onChange={(e) => setBuscaParceiro(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
                    />
                    <Search className="w-4 h-4 text-white-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {carregandoParceiros ? (
                      <div className="flex items-center justify-center h-40">
                        <p className="text-white-500">Carregando parceiros...</p>
                      </div>
                    ) : parceirosFiltrados.length === 0 ? (
                      <div className="flex items-center justify-center h-40">
                        <p className="text-white-500 text-sm">
                          {buscaParceiro ? "Nenhum parceiro encontrado." : "Nenhum parceiro aprovado disponível."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {parceirosFiltrados.map((parceiro) => (
                          <button
                            key={parceiro.id}
                            onClick={() => handleSelecionarParceiroModal(parceiro)}
                            disabled={carregandoParceiros || salvando}
                            className="w-full text-left p-3 rounded-lg border border-white-100 hover:border-green-primary hover:bg-green-50 transition-all group disabled:opacity-50 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-black-primary truncate">
                                  {obterNomeExibicaoParceiro(parceiro)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-xs text-white-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {parceiro.tipoParceiro} ({parceiro.tipoPessoa})
                                  </span>
                                </div>
                                <p className="text-xs text-white-400 mt-1 truncate">
                                  {parceiro.email} • {parceiro.documento || "—"}
                                </p>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <span className="text-xs font-medium text-green-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  Selecionar →
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {stepCriar === "selecionar_ponto" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-primary/20">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-primary" />
                      <span className="text-sm text-black-primary">
                        Parceiro: <strong>{parceiroSelecionado && obterNomeExibicaoParceiro(parceiroSelecionado)}</strong>
                      </span>
                    </div>
                    <button onClick={() => { setStepCriar("selecionar_parceiro"); setPontoSelecionado(null); }} className="text-xs text-green-primary hover:underline cursor-pointer" disabled={salvando}>
                      Trocar
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {pontosDisponiveis.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-white-500">Este parceiro não possui pontos de coleta aprovados.</p>
                      </div>
                    ) : (
                      pontosDisponiveis.map((ponto) => (
                        <button
                          key={ponto.id}
                          onClick={() => { setPontoSelecionado(ponto); setStepCriar("dados_solicitacao"); }}
                          className="w-full text-left p-3 rounded-lg border border-white-100 hover:border-green-primary hover:bg-green-50 transition-all group cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-black-primary">{ponto.nomePontoColeta}</p>
                              <p className="text-xs text-white-500 flex items-start gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {formatarEnderecoPonto(ponto)}
                              </p>
                              <p className="text-xs text-white-400 mt-1">Capacidade: {ponto.capacidadeBombona} L</p>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <span className="text-xs font-medium text-green-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Selecionar →
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {stepCriar === "dados_solicitacao" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white-50 rounded-lg border border-white-100">
                      <span className="text-xs text-white-500 block">Parceiro</span>
                      <p className="text-sm font-semibold text-black-primary">
                        {parceiroSelecionado && obterNomeExibicaoParceiro(parceiroSelecionado)}
                      </p>
                      <button onClick={() => setStepCriar("selecionar_parceiro")} className="text-xs text-green-primary hover:underline mt-1 cursor-pointer" disabled={salvando}>
                        Trocar parceiro
                      </button>
                    </div>
                    <div className="p-3 bg-white-50 rounded-lg border border-white-100">
                      <span className="text-xs text-white-500 block">Ponto de Coleta</span>
                      <p className="text-sm font-semibold text-black-primary">
                        {pontoSelecionado ? pontoSelecionado.nomePontoColeta : "Nenhum ponto selecionado"}
                      </p>
                      {pontoSelecionado && (
                        <button onClick={() => setStepCriar("selecionar_ponto")} className="text-xs text-green-primary hover:underline mt-1 cursor-pointer" disabled={salvando}>
                          Trocar ponto
                        </button>
                      )}
                    </div>
                  </div>

                  {pontoSelecionado ? (
                    <>
                      <label className="block">
                        <span className="text-xs text-white-600 font-medium">Volume Informado (Litros) *</span>
                        <input
                          type="number"
                          min={1}
                          value={volumeInformado}
                          onChange={(e) => setVolumeInformado(Number(e.target.value))}
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                          disabled={salvando}
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs text-white-600 font-medium">Observações (opcional)</span>
                        <textarea
                          rows={3}
                          placeholder="Observações sobre a solicitação..."
                          value={observacaoCriar}
                          onChange={(e) => setObservacaoCriar(e.target.value)}
                          className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
                          disabled={salvando}
                        />
                      </label>

                      <div className="flex gap-3 pt-2">
                        <Button variant="danger" size="sm" onClick={fecharModalCriar} disabled={salvando} fullWidth>
                          Cancelar
                        </Button>
                        <Button variant="primary" size="sm" loading={salvando} onClick={handleCriarSolicitacaoAdminSubmit} fullWidth disabled={salvando}>
                          Criar Solicitação
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white-500">Selecione um ponto de coleta para continuar.</p>
                      <Button variant="primary" size="sm" onClick={() => setStepCriar("selecionar_ponto")} className="mt-4">
                        Voltar para seleção de pontos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: AGENDAR COLETA */}
        {modal.tipo === "agendar" && modal.solicitacao && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-green-primary">
                  Agendar coleta — #{modal.solicitacao.id}
                </h2>
                <button onClick={fecharModal} className="text-red-primary hover:text-red-hover cursor-pointer" disabled={salvando}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <label className="block">
                  <span className="text-sm text-gray-700 font-medium">Data da Coleta</span>
                  <input
                    type="date"
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white cursor-pointer"
                  />
                </label>

                {dataAgendamento && (
                  <div>
                    <span className="text-sm text-gray-700 font-medium block mb-2">Selecione o Turno e Horário (Blocos de 1h)</span>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {TURNOS_AGENDAMENTO.map((grupo) => (
                        <div key={grupo.turno} className="border border-gray-100 p-2.5 rounded-lg bg-gray-50">
                          <span className="text-xs font-bold text-green-700 uppercase"> {grupo.turno}</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {grupo.slots.map((slot) => {
                              const isSelected = horarioSelecionado === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setHorarioSelecionado(slot)}
                                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="danger" size="sm" onClick={fecharModal} disabled={salvando} fullWidth>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={salvando}
                  onClick={confirmarModal}
                  disabled={salvando || !dataAgendamento || !horarioSelecionado}
                  fullWidth
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONCLUIR COLETA */}
        {modal.tipo === "concluir" && modal.solicitacao && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-green-primary">Concluir coleta — #{modal.solicitacao.id}</h2>
                <button onClick={fecharModal} className="text-red-primary hover:text-red-hover cursor-pointer" disabled={salvando}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <label className="block mb-4">
                <span className="text-sm text-gray-700 font-medium">Volume coletado (litros)</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Ex: 50"
                  value={volumeColetado}
                  onChange={(e) => setVolumeColetado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                />
              </label>

              <div className="flex gap-3">
                <Button variant="danger" size="sm" onClick={fecharModal} disabled={salvando} fullWidth>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={salvando}
                  onClick={confirmarModal}
                  disabled={!volumeColetado || salvando}
                  fullWidth
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DETALHES DA SOLICITAÇÃO */}
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
                  <p className="text-sm font-semibold text-black-primary">{modal.solicitacao.parceiro?.razaoSocial || modal.solicitacao.parceiro?.nome || "—"}</p>
                  {modal.solicitacao.parceiro?.email && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" /> {modal.solicitacao.parceiro.email}
                    </p>
                  )}
                  {modal.solicitacao.parceiro?.telefone && (
                    <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {modal.solicitacao.parceiro.telefone}
                    </p>
                  )}
                </div>

                <div className="border border-white-100 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Ponto de Coleta
                  </h3>
                  <p className="text-sm font-semibold text-black-primary">{modal.solicitacao.pontoColeta?.nomePontoColeta || "—"}</p>
                  <p className="text-xs text-white-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-primary" /> 
                    <span>{formatarEndereco(modal.solicitacao.pontoColeta)}</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-white-100 flex items-center justify-between text-xs">
                    <span className="text-white-500">Volume Informado:</span>
                    <span className="font-semibold text-black-primary">{modal.solicitacao.volumeInformado || modal.solicitacao.pontoColeta?.capacidadeBombona || "—"} Litros</span>
                  </div>
                </div>

                {modal.solicitacao?.observacoes && (
                  <div className="bg-white-primary border border-white-100 rounded-lg p-3">
                    <span className="text-xs font-bold text-green-primary uppercase tracking-wider block mb-1">
                      Observações:
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
                        <span className="font-semibold text-black-primary">
                          {formatarAgendamentoCompleto(modal.solicitacao.dataAgendamento)}
                        </span>
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
                <Button variant="primary" size="sm" onClick={fecharModal} fullWidth>
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