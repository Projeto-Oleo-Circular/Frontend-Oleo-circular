// src/pages/Admin/PointsApproval/index.tsx

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  adminPontosService,
  Parceiro,
  type PontoColetaAdmin,
  type StatusAprovacao,
} from "../../../../services/adminPontosService";
import {
  pontosColetaService,
  type CriarPontoColetaPayload,
} from "../../../../services/pontosColetaService";

import StatusBadge from "../../../../components/ui/StatusBadge";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import AdminFilterDropdown, {
  type FilterOption,
} from "../../../../components/ui/AdminFilterDropdown";
import AddressMapPicker, { type AddressMapValue } from "../../../../components/ui/AddressMapPicker";

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
  Plus,
  Pencil,
  Save,
} from "lucide-react";

import SummaryCard from "../../../../components/ui/SummaryCard";
import Button from "../../../../components/ui/Button";
import Pagination from "../../../../components/ui/Pagination";
import Footer from "../../../../components/layout/Footer";
import { CriarPontoColetaModal } from "../../../../components/modal/CriarPontoColetaModal";
import { SelecionarParceiroModal } from "../../../../components/modal/SelecionarParceiroModal";
import { IndicadoresAmbientais } from "../../../../components/dash/IndicadoresAmbientais";

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

// Helper para obter o Nome do Ponto / Razão Social
function obterNomePontoOuRazaoSocial(ponto: PontoColetaAdmin): string {
  if (ponto.nomePontoColeta && ponto.nomePontoColeta.trim() !== "") {
    return ponto.nomePontoColeta;
  }

  const parceiro = ponto.parceiro as any;
  if (!parceiro) return "—";

  if (parceiro.tipoParceiro === "SOLIDARIO" || parceiro.tipoPessoa === "FISICA") {
    return parceiro.nome || "—";
  }

  return parceiro.razaoSocial || parceiro.nome || "—";
}

// Helper para obter o Responsável Legal / Nome da Pessoa
function obterNomeResponsavel(ponto: PontoColetaAdmin): string {
  const parceiro = ponto.parceiro as any;
  if (!parceiro) return "—";

  if (parceiro.tipoParceiro === "SOLIDARIO" || parceiro.tipoPessoa === "FISICA") {
    return parceiro.nome || "—";
  }

  return parceiro.responsavelLegal || parceiro.responsavelLegalNome || parceiro.nome || "—";
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
  const [mensagemErroModal, setMensagemErroModal] = useState("");

  // Estados para criação e edição de ponto
  const [parceiroSelecionado, setParceiroSelecionado] = useState<Parceiro | null>(null);
  const [isModalCriarOpen, setIsModalCriarOpen] = useState(false);
  const [isModalSelecionarParceiroOpen, setIsModalSelecionarParceiroOpen] = useState(false);
  const [mostrarResumoAmbiental, setMostrarResumoAmbiental] = useState(false);
  
  // Estado para controlar modo de edição dentro do modal de detalhes
  const [editandoPonto, setEditandoPonto] = useState(false);
  const [formDataEdicao, setFormDataEdicao] = useState({
    nomePontoColeta: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    capacidadeBombona: 0,
    expectativaGeracao: 0,
    latitude: "" as string | number,
    longitude: "" as string | number,
  });

  const atualizandoDoMapa = useRef(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        pendentes: pendentes.total ?? 0,
        aprovados: aprovados.total ?? 0,
        rejeitados: rejeitados.total ?? 0,
        total: total.total ?? 0,
      });
    } catch (error) {
      console.error("Erro ao carregar contagens:", error);
    }
  }, []);

  useEffect(() => {
    carregarPontos();
    carregarContagensPontos();
  }, [carregarPontos, carregarContagensPontos]);

  // Busca de coordenadas via Nominatim para edição
  const buscarCoordenadasEdicao = async () => {
    const temDados = formDataEdicao.cep || (formDataEdicao.cidade && formDataEdicao.estado) || (formDataEdicao.logradouro && formDataEdicao.cidade);
    if (!temDados) return;

    try {
      const queryParts = [
        formDataEdicao.logradouro,
        formDataEdicao.numero,
        formDataEdicao.bairro,
        formDataEdicao.cidade,
        formDataEdicao.estado,
        formDataEdicao.cep,
        "Brasil",
      ].filter(Boolean).join(", ");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParts)}&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );

      if (!response.ok) return;
      const data = await response.json();
      if (!data || data.length === 0) return;

      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      atualizandoDoMapa.current = true;
      setFormDataEdicao((prev) => ({
        ...prev,
        latitude: Number(lat.toFixed(7)),
        longitude: Number(lon.toFixed(7)),
      }));

      setTimeout(() => {
        atualizandoDoMapa.current = false;
      }, 100);
    } catch (e) {
      console.error("Erro ao buscar coordenadas na edição:", e);
    }
  };

  useEffect(() => {
    if (!editandoPonto) return;
    if (atualizandoDoMapa.current) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    const temMinimo = formDataEdicao.cep || (formDataEdicao.cidade && formDataEdicao.estado);
    if (!temMinimo) return;

    debounceTimeout.current = setTimeout(() => {
      buscarCoordenadasEdicao();
    }, 1000);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [editandoPonto, formDataEdicao.cep, formDataEdicao.logradouro, formDataEdicao.numero, formDataEdicao.bairro, formDataEdicao.cidade, formDataEdicao.estado]);

  const handleAbrirSelecionarParceiro = () => {
    setIsModalSelecionarParceiroOpen(true);
  };

  const handleSelecionarParceiro = (parceiro: Parceiro) => {
    setParceiroSelecionado(parceiro);
    setIsModalSelecionarParceiroOpen(false);
    setIsModalCriarOpen(true);
  };

  const handleCriarPonto = async (dados: CriarPontoColetaPayload) => {
    setSalvando(true);
    try {
      const payload = {
        ...dados,
        parceiroId: parceiroSelecionado?.id ? Number(parceiroSelecionado.id) : undefined,
        statusAprovacaoPontoColeta: "APROVADO" as const,
      };
      
      await pontosColetaService.criarPontoColetaAdmin(payload);
      
      setStatusFiltro(""); 
      setPage(1);

      await Promise.all([carregarPontos(), carregarContagensPontos()]);
      
      setIsModalCriarOpen(false);
      setParceiroSelecionado(null);
    } catch (error) {
      console.error("Erro ao criar ponto de coleta:", error);
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const abrirModal = (tipo: ModalTipo, ponto: PontoColetaAdmin) => {
    setMostrarResumoAmbiental(false);
    setObservacaoModal("");
    setEditandoPonto(false);

    if (tipo === "detalhes") {
      setFormDataEdicao({
        nomePontoColeta: ponto.nomePontoColeta || "",
        cep: ponto.cep || "",
        logradouro: ponto.logradouro || "",
        numero: String(ponto.numero || ""),
        bairro: ponto.bairro || "",
        cidade: ponto.cidade || "",
        estado: ponto.estado || "",
        capacidadeBombona: ponto.capacidadeBombona || 0,
        expectativaGeracao: (ponto as any).expectativaGeracao || 0,
        latitude: (ponto as any).latitude || "",
        longitude: (ponto as any).longitude || "",
      });
    }

    setModal({ tipo, ponto });
  };

  const fecharModal = () => {
    setMostrarResumoAmbiental(false);
    setEditandoPonto(false);
    setModal({ tipo: null, ponto: null });
    setObservacaoModal("");
  };

  // Função para salvar a edição do ponto com latitude/longitude
  const handleSalvarEdicao = async () => {
    if (!modal.ponto) return;

    setSalvando(true);
    try {
      await pontosColetaService.atualizarPontoColeta(modal.ponto.id, {
        nomePontoColeta: formDataEdicao.nomePontoColeta,
        cep: formDataEdicao.cep,
        logradouro: formDataEdicao.logradouro,
        numero: formDataEdicao.numero,
        bairro: formDataEdicao.bairro,
        cidade: formDataEdicao.cidade,
        estado: formDataEdicao.estado,
        capacidadeBombona: Number(formDataEdicao.capacidadeBombona),
        expectativaGeracao: Number(formDataEdicao.expectativaGeracao),
        latitude: formDataEdicao.latitude ? String(formDataEdicao.latitude) : undefined,
        longitude: formDataEdicao.longitude ? String(formDataEdicao.longitude) : undefined,
      });

      await carregarPontos();
      setEditandoPonto(false);
      fecharModal();
    } catch (error) {
      console.error("Erro ao atualizar ponto de coleta:", error);
    } finally {
      setSalvando(false);
    }
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

      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
        status = error.response?.status;
      } else if (error instanceof Error) {
        msg = error.message;
      }

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

      <main className="w-full max-w-[1440px] mx-auto p-6 flex-1">
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

        {/* BOTÃO NOVO PONTO */}
        <div className="flex justify-end mb-4">
          <div className="inline-block">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAbrirSelecionarParceiro}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Ponto
            </Button>
          </div>
        </div>

        {/* TABELA DE PONTOS */}
        <div className="bg-white rounded-xl shadow-sm border border-white-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white bg-green-primary text-sm font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-56">Nome do Ponto / Razão Social</th>
                <th className="p-3 w-56">Responsável</th>
                <th className="p-3">Endereço</th>
                <th className="p-3 w-32">Capacidade</th>
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

                  const nomeExibicaoPonto = obterNomePontoOuRazaoSocial(ponto);
                  const responsavel = obterNomeResponsavel(ponto);
                  const parceiro = ponto.parceiro as any;

                  return (
                    <tr
                      key={ponto.id}
                      className="border-b border-white-100 last:border-0 hover:bg-white-50 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium text-black-primary">
                        #{ponto.id}
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-sm text-black-primary">
                          {nomeExibicaoPonto}
                        </p>
                        {parceiro?.tipoParceiro && (
                          <span className="text-xs text-white-400">
                            {parceiro.tipoParceiro} ({parceiro.tipoPessoa || "PJ"})
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="text-sm font-medium text-black-primary">
                          {responsavel}
                        </p>
                        {parceiro?.documento && (
                          <p className="text-xs text-white-500 mt-0.5">
                            {parceiro.documento}
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

        {/* MODAL: SELECIONAR PARCEIRO */}
        <SelecionarParceiroModal
          isOpen={isModalSelecionarParceiroOpen}
          onClose={() => setIsModalSelecionarParceiroOpen(false)}
          onSelecionar={handleSelecionarParceiro}
          loading={salvando}
        />

        {/* MODAL: CRIAR PONTO DE COLETA */}
        <CriarPontoColetaModal
          isOpen={isModalCriarOpen}
          onClose={() => {
            setIsModalCriarOpen(false);
            setParceiroSelecionado(null);
          }}
          onSubmit={handleCriarPonto}
          loading={salvando}
          parceiro={parceiroSelecionado}
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
                <strong>{obterNomePontoOuRazaoSocial(modal.ponto)}</strong>?
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

        {/* MODAL DETALHES & EDIÇÃO COM MAPA */}
        {modal.tipo === "detalhes" && modal.ponto && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                <div>
                  <h2 className="font-bold text-xl text-green-primary">
                    {editandoPonto ? "Editar Ponto de Coleta" : "Detalhes do Ponto de Coleta"}
                  </h2>
                  <p className="text-xs text-white-500">
                    ID do ponto: #{modal.ponto.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!editandoPonto && (
                    <button
                      onClick={() => setEditandoPonto(true)}
                      className="p-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                      title="Editar Ponto"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  
                 
                </div>
              </div>

              {editandoPonto ? (
                /* FORMULÁRIO DE EDIÇÃO COM MAPA */
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs text-white-600 font-medium">Nome do Ponto de Coleta</span>
                    <input
                      type="text"
                      value={formDataEdicao.nomePontoColeta}
                      onChange={(e) => setFormDataEdicao({ ...formDataEdicao, nomePontoColeta: e.target.value })}
                      className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">CEP</span>
                      <input
                        type="text"
                        value={formDataEdicao.cep}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, cep: e.target.value })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Logradouro</span>
                      <input
                        type="text"
                        value={formDataEdicao.logradouro}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, logradouro: e.target.value })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Número</span>
                      <input
                        type="text"
                        value={formDataEdicao.numero}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, numero: e.target.value })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                    <label className="block col-span-2">
                      <span className="text-xs text-white-600 font-medium">Bairro</span>
                      <input
                        type="text"
                        value={formDataEdicao.bairro}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, bairro: e.target.value })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Cidade</span>
                      <input
                        type="text"
                        value={formDataEdicao.cidade}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, cidade: e.target.value })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Estado (UF)</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={formDataEdicao.estado}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, estado: e.target.value.toUpperCase() })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                  </div>

                  {/* MAPA DE EDIÇÃO */}
                  <div className="pt-2">
                    <span className="text-xs text-white-600 font-medium block mb-1">Localização no Mapa (Ajuste o pin se necessário)</span>
                    <AddressMapPicker
                      value={{
                        cep: formDataEdicao.cep,
                        logradouro: formDataEdicao.logradouro,
                        bairro: formDataEdicao.bairro,
                        cidade: formDataEdicao.cidade,
                        estado: formDataEdicao.estado || "",
                        numero: formDataEdicao.numero || "",
                        complemento: "",
                        latitude: formDataEdicao.latitude ? Number(formDataEdicao.latitude) : null,
                        longitude: formDataEdicao.longitude ? Number(formDataEdicao.longitude) : null,
                      }}
                      onChange={(data: Partial<AddressMapValue>) => {
                        atualizandoDoMapa.current = true;
                        setFormDataEdicao((prev) => ({
                          ...prev,
                          cep: data.cep ?? prev.cep,
                          logradouro: data.logradouro ?? prev.logradouro,
                          bairro: data.bairro ?? prev.bairro,
                          cidade: data.cidade ?? prev.cidade,
                          estado: data.estado ?? prev.estado,
                          numero: data.numero ?? prev.numero,
                          latitude: data.latitude ?? prev.latitude,
                          longitude: data.longitude ?? prev.longitude,
                        }));
                        setTimeout(() => {
                          atualizandoDoMapa.current = false;
                        }, 100);
                      }}
                      height={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Capacidade Bombona (L)</span>
                      <input
                        type="number"
                        value={formDataEdicao.capacidadeBombona}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, capacidadeBombona: Number(e.target.value) })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-white-600 font-medium">Expectativa Geração (L/mês)</span>
                      <input
                        type="number"
                        value={formDataEdicao.expectativaGeracao}
                        onChange={(e) => setFormDataEdicao({ ...formDataEdicao, expectativaGeracao: Number(e.target.value) })}
                        className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditandoPonto(false)}
                      fullWidth
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={salvando}
                      onClick={handleSalvarEdicao}
                      fullWidth
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              ) : (
                /* EXIBIÇÃO DE DETALHES */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white-50 p-3 rounded-lg border border-white-100">
                    <div>
                      <span className="text-xs text-white-500 block">
                        Status de Aprovação
                      </span>
                      <StatusBadge
                        status={modal.ponto.statusAprovacaoPontoColeta || "PENDENTE"}
                        tipo="ponto"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white-500 block">
                        Capacidade Bombona
                      </span>
                      <span className="text-xs font-semibold text-black-primary">
                        {modal.ponto.capacidadeBombona} Litros
                      </span>
                    </div>
                  </div>

                  <div className="border border-white-100 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Informações do Ponto
                    </h3>
                    <p className="text-sm font-semibold text-black-primary">
                      {obterNomePontoOuRazaoSocial(modal.ponto)}
                    </p>
                    <p className="text-xs text-white-500 flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-primary" />
                      <span>{formatarEndereco(modal.ponto)}</span>
                    </p>
                  </div>

                  <div className="border border-white-100 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Responsável
                    </h3>
                    <p className="text-sm font-semibold text-black-primary">
                      {obterNomeResponsavel(modal.ponto)}
                    </p>
                    {(modal.ponto.parceiro as any)?.documento && (
                      <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" />
                        {(modal.ponto.parceiro as any).documento}
                      </p>
                    )}
                    {(modal.ponto.parceiro as any)?.email && (
                      <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {(modal.ponto.parceiro as any).email}
                      </p>
                    )}
                  </div>

                  {modal.ponto.statusAprovacaoPontoColeta === "APROVADO" && (
                    <div className="border border-green-100 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setMostrarResumoAmbiental((v) => !v)}
                        className="w-full flex items-center justify-between gap-4 p-4 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-primary" />
                            <p className="text-sm font-bold text-green-primary">
                              Resumo Ambiental
                            </p>
                          </div>
                          <p className="text-xs text-white-500 mt-1">
                            Consulte o impacto ambiental gerado pelas coletas realizadas neste ponto.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-green-primary whitespace-nowrap">
                          {mostrarResumoAmbiental ? "Ocultar" : "Visualizar"}
                        </span>
                      </button>

                      {mostrarResumoAmbiental && (
                        <div className="p-4 border-t border-green-100">
                          <IndicadoresAmbientais
                            tipo="admin-ponto"
                            pontoId={modal.ponto.id}
                            titulo="Impacto Ambiental do Ponto"
                            variant="modal"
                          />
                        </div>
                      )}
                    </div>
                  )}

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
              )}
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
                  <strong>{obterNomePontoOuRazaoSocial(modal.ponto)}</strong>{" "}
                  para depois aprovar este ponto.
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