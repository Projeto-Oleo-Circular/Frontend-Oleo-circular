import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  BarChart3,
  Users,
  MapPin,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

import AdminTopNav from "../../../../components/layout/AdminTopNav";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import StatusBadge from "../../../../components/ui/StatusBadge";
import useToast from "../../../../hooks/useToast";
import SummaryCard from "../../../../components/ui/SummaryCard";
import {
  adminSolicitacoesService,
  type SolicitacaoColeta,
  type StatusSolicitacao,
} from "../../../../services/AdminSolicitacaoService";
import { adminPontosService } from "../../../../services/adminPontosService";
import { adminParceiroService } from "../../../../services/adminParceiroService";
import {
  adminPontosService as adminPontosService2,
  type PontoColetaAdmin,
  type StatusAprovacao,
} from "../../../../services/adminPontosService";
import Footer from "../../../../components/layout/Footer";


function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}
function startOfMonth(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfYear(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears, 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sumVolumeColetado(items: SolicitacaoColeta[], start: Date, end: Date) {
  return items.reduce((acc, item) => {
    if (!item.dataConclusao) return acc;
    const dt = new Date(item.dataConclusao);
    if (dt >= start && dt < end) {
      return acc + (item.volumeColetado ?? 0);
    }
    return acc;
  }, 0);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatLitros(v: number) {
  return `${v.toLocaleString("pt-BR")} L`;
}

async function fetchTodasConcluidas(): Promise<SolicitacaoColeta[]> {
  const limit = 200;
  let page = 1;
  let all: SolicitacaoColeta[] = [];
  while (true) {
    const resp = await adminSolicitacoesService.listar({
      status: "CONCLUIDA",
      page,
      limit,
    });
    all = all.concat(resp.items);
    if (page >= resp.totalPages || resp.items.length === 0) break;
    page++;
  }
  return all;
}

async function fetchPrevisaoColeta(): Promise<{ total: number; detalhes: { status: string; volume: number; count: number }[] }> {
  const limit = 200;
  const statusList: StatusSolicitacao[] = ["AGUARDANDO", "AGENDADA"];
  const detalhes: { status: string; volume: number; count: number }[] = [];
  let total = 0;

  for (const status of statusList) {
    let page = 1;
    let subtotal = 0;
    let count = 0;
    while (true) {
      const resp = await adminSolicitacoesService.listar({
        status,
        page,
        limit,
      });
      const sum = resp.items.reduce((acc, item) => {
        const volume = item.volumeInformado ?? item.volumeColetado ?? 0;
        return acc + volume;
      }, 0);
      subtotal += sum;
      count += resp.items.length;
      if (page >= resp.totalPages || resp.items.length === 0) break;
      page++;
    }
    detalhes.push({
      status: status === "AGUARDANDO" ? "Pendentes" : "Agendadas",
      volume: subtotal,
      count,
    });
    total += subtotal;
  }

  return { total, detalhes };
}

async function fetchContagemPorStatus(): Promise<Record<StatusSolicitacao, number>> {
  const statusList: StatusSolicitacao[] = ["AGUARDANDO", "AGENDADA", "EM_ROTA", "CONCLUIDA"];
  const results = await Promise.all(
    statusList.map(async (status) => {
      const resp = await adminSolicitacoesService.listar({ status, limit: 1 });
      return { status, total: resp.total };
    })
  );
  return results.reduce((acc, { status, total }) => ({ ...acc, [status]: total }), {} as Record<StatusSolicitacao, number>);
}

async function fetchTotalParceirosAprovados(): Promise<number> {
  const resp = await adminParceiroService.listarParceiros({
    statusAprovacao: "APROVADO",
    limit: 1,
  });
  if (Array.isArray(resp)) {
    return resp.filter((p) => p.statusAprovacaoParceiro === "APROVADO").length;
  }
  return resp.total;
}

async function fetchTotalPontosAprovados(): Promise<number> {
  const resp = await adminPontosService.listarPontos({
    statusAprovacao: "APROVADO",
    page: 1,
    limit: 1,
  });
  return resp.total;
}

interface ParceiroAdmin {
  id: number;
  razaoSocial: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface GeocodedPoint extends PontoColetaAdmin {
  latlng?: [number, number];
  hasSolicitacao: boolean;
  solicitacoes: SolicitacaoColeta[];
}

type FiltroModo = "todos" | "apenas-pontos" | "apenas-solicitacoes";
type CamadaMapa = "mapa" | "satelite";

const numeroValido = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};

const BRASIL_BOUNDS = { latMin: -34, latMax: 6, lngMin: -75, lngMax: -28 };

const dentroDoBrasil = (lat: number, lng: number): boolean =>
  lat >= BRASIL_BOUNDS.latMin &&
  lat <= BRASIL_BOUNDS.latMax &&
  lng >= BRASIL_BOUNDS.lngMin &&
  lng <= BRASIL_BOUNDS.lngMax;

const obterCoordenadasDoPonto = (ponto: PontoColetaAdmin): [number, number] | null => {
  const registro = ponto as PontoColetaAdmin & Record<string, unknown>;
  const parceiro = (registro.parceiro || {}) as ParceiroAdmin & Record<string, unknown>;

  const latitudeBruta = numeroValido(
    registro.latitude ??
      registro.lat ??
      parceiro.latitude ??
      parceiro.lat ??
      parceiro.enderecoLatitude
  );

  const longitudeBruta = numeroValido(
    registro.longitude ??
      registro.lng ??
      parceiro.longitude ??
      parceiro.lng ??
      parceiro.enderecoLongitude
  );

  if (
    latitudeBruta === null ||
    longitudeBruta === null ||
    Math.abs(latitudeBruta) > 90 ||
    Math.abs(longitudeBruta) > 180
  ) {
    return null;
  }

  if (dentroDoBrasil(latitudeBruta, longitudeBruta)) {
    return [latitudeBruta, longitudeBruta];
  }

  if (dentroDoBrasil(longitudeBruta, latitudeBruta)) {
    return [longitudeBruta, latitudeBruta];
  }

  return [latitudeBruta, longitudeBruta];
};

const criarIcone = (
  status: StatusAprovacao,
  hasSolicitacao: boolean,
  modo: FiltroModo
) => {
  let backgroundColor = "#9E9E9E";
  if (modo === "apenas-solicitacoes") {
    backgroundColor = hasSolicitacao ? "#1E88E5" : "#9E9E9E";
  } else {
    if (status === "APROVADO") {
      backgroundColor = hasSolicitacao ? "#1E88E5" : "#4CAF50";
    } else if (status === "PENDENTE") {
      backgroundColor = "#FB8C00";
    } else if (status === "REJEITADO") {
      backgroundColor = "#E53935";
    }
  }

  const size = 26;
  const border = 2;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${border}px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

function MapController({ pontos }: { pontos: GeocodedPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const coordenadas = pontos.map((p) => p.latlng).filter((v): v is [number, number] => Boolean(v));
    if (coordenadas.length === 1) map.setView(coordenadas[0], 15);
    else if (coordenadas.length > 1) map.fitBounds(L.latLngBounds(coordenadas), { padding: [40, 40], maxZoom: 15 });
  }, [map, pontos]);
  return null;
}

function MapSection({ solicitacoes }: { solicitacoes: SolicitacaoColeta[] }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [pontos, setPontos] = useState<GeocodedPoint[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [modoFiltro, setModoFiltro] = useState<FiltroModo>("todos");
  const [camada, setCamada] = useState<CamadaMapa>("mapa");
  const [carregandoPontos, setCarregandoPontos] = useState(true);

  const carregarPontos = useCallback(async () => {
    try {
      setCarregandoPontos(true);
      const todosPontos = await carregarTodosOsPontos();
      const solicitacoesPorPonto = solicitacoes.reduce<Record<number, SolicitacaoColeta[]>>(
        (acc, sol) => {
          const key = sol.pontoColetaId;
          if (!acc[key]) acc[key] = [];
          acc[key].push(sol);
          return acc;
        },
        {}
      );

      const pontosNormalizados = todosPontos.map((ponto) => {
        const sols = solicitacoesPorPonto[ponto.id] || [];
        const latlng = obterCoordenadasDoPonto(ponto);
        return {
          ...ponto,
          latlng: latlng || undefined,
          hasSolicitacao: sols.length > 0,
          solicitacoes: sols,
        };
      });
      setPontos(pontosNormalizados);
    } catch (error) {
      console.error(error);
      addToast("Erro ao carregar pontos", "error");
    } finally {
      setCarregandoPontos(false);
    }
  }, [solicitacoes, addToast]);

  useEffect(() => {
    carregarPontos();
  }, [carregarPontos]);

  const carregarTodosOsPontos = async (): Promise<PontoColetaAdmin[]> => {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const todos: PontoColetaAdmin[] = [];
    do {
      const resp = await adminPontosService2.listarPontos({ page, limit });
      todos.push(...resp.items);
      totalPages = resp.totalPages;
      page++;
    } while (page <= totalPages);
    return todos;
  };

  const pontosFiltrados = useMemo(() => {
    let resultado = pontos;
    if (filtroTexto.trim()) {
      const termo = filtroTexto.toLowerCase().trim();
      resultado = resultado.filter((p) => {
        const endereco = `${p.logradouro}, ${p.numero} - ${p.bairro}, ${p.cidade} ${p.estado || ""}`.toLowerCase();
        return (
          p.nomePontoColeta.toLowerCase().includes(termo) ||
          p.parceiro?.razaoSocial.toLowerCase().includes(termo) ||
          endereco.includes(termo)
        );
      });
    }
    if (modoFiltro === "apenas-pontos") return resultado;
    if (modoFiltro === "apenas-solicitacoes") return resultado.filter((p) => p.hasSolicitacao);
    return resultado;
  }, [filtroTexto, pontos, modoFiltro]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-white-200 overflow-hidden">
      <div className="p-4 border-b border-white-100 flex flex-wrap items-center gap-3">
        <h2 className="font-bold text-black-primary">Mapa de Pontos de Coleta</h2>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div className="flex gap-1 bg-white-100 rounded-lg p-1">
            <button
              onClick={() => setModoFiltro("todos")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoFiltro === "todos" 
                  ? "bg-green-400 text-white-primary shadow-sm" 
                  : "text-white-600 hover:bg-white-200 hover:text-black-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setModoFiltro("apenas-pontos")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoFiltro === "apenas-pontos" 
                  ? "bg-green-400 text-white-primary shadow-sm" 
                  : "text-white-600 hover:bg-white-200 hover:text-black-200"
              }`}
            >
              Pontos
            </button>
            <button
              onClick={() => setModoFiltro("apenas-solicitacoes")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoFiltro === "apenas-solicitacoes" 
                  ? "bg-green-400 text-white-primary shadow-sm" 
                  : "text-white-600 hover:bg-white-200 hover:text-black-200"
              }`}
            >
              Solicitações
            </button>
          </div>

          <div className="flex gap-1 bg-white-100 rounded-lg p-1">
            <button
              onClick={() => setCamada("mapa")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                camada === "mapa" 
                  ? "bg-green-400 text-white-primary shadow-sm" 
                  : "text-white-600 hover:bg-white-200 hover:text-black-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Mapa
            </button>
            <button
              onClick={() => setCamada("satelite")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                camada === "satelite" 
                  ? "bg-green-400 text-white-primary shadow-sm" 
                  : "text-white-600 hover:bg-white-200 hover:text-black-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Satélite
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nome, parceiro ou endereço"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

        <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate("/admin/map")}
              variant="secondary"
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 whitespace-nowrap px-4"
            >
              Ver mapa
            </Button>

            <Button
              onClick={carregarPontos}
              disabled={carregandoPontos}
              variant="terciary"
              className="flex-1 lg:flex-initial flex items-center justify-center whitespace-nowrap px-4"
            >
              {carregandoPontos ? (
                <div className="w-4 h-4 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                "Atualizar"
              )}
            </Button>
          </div>
        </div>

        <div className="h-[400px] rounded-xl overflow-hidden bg-white-100">
          {carregandoPontos ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MapContainer
              center={[-15.2483, -40.2481]}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
              zoomControl
              attributionControl
            >
              <TileLayer
                url={
                  camada === "mapa"
                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                }
                attribution={
                  camada === "mapa"
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    : '&copy; <a href="https://www.esri.com/">Esri</a>'
                }
              />
              {pontosFiltrados.map((ponto) => {
                if (!ponto.latlng) return null;
                return (
                  <Marker
                    key={ponto.id}
                    position={ponto.latlng}
                    icon={criarIcone(
                      ponto.statusAprovacaoPontoColeta,
                      ponto.hasSolicitacao,
                      modoFiltro
                    )}
                  >
                    <Popup>
                      <div className="text-sm max-w-xs">
                        <strong>{ponto.nomePontoColeta}</strong>
                        {ponto.parceiro?.razaoSocial && <p>Parceiro: {ponto.parceiro.razaoSocial}</p>}
                        <p>{`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`}</p>
                        <p>Capacidade: {ponto.capacidadeBombona} L</p>
                        {modoFiltro === "apenas-solicitacoes" ? (
                          ponto.solicitacoes.length > 0 ? (
                            <div>
                              <span className="text-xs text-white-500">Status:</span>
                              <StatusBadge status={ponto.solicitacoes[0].status} />
                            </div>
                          ) : (
                            <p className="text-xs text-white-400">Sem solicitação</p>
                          )
                        ) : (
                          <p>
                            Status: {ponto.statusAprovacaoPontoColeta}
                            {ponto.hasSolicitacao && (
                              <span className="ml-1 text-xs text-blue-600">(com solicitação)</span>
                            )}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              <MapController pontos={pontosFiltrados} />
            </MapContainer>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Aprovado
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Aprovado c/ solicitação
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> Pendente
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Rejeitado
          </div>
          {modoFiltro === "apenas-solicitacoes" && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white-400" /> Sem solicitação
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  volumeSemana: number;
  volumeSemanaPct: number;
  volumeMes: number;
  volumeMesPct: number;
  volumeAno: number;
  volumeAnoPct: number;
  parceirosAtivos: number;
  pontosColeta: number;
  previsao: { total: number; detalhes: { status: string; volume: number; count: number }[] };
  contagemStatus: Record<StatusSolicitacao, number>;
  historicoMensal: { mes: string; volume: number }[];
  topParceiros: { nome: string; volume: number }[];
}

function Dashboard() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [todasSolicitacoes, setTodasSolicitacoes] = useState<SolicitacaoColeta[]>([]);
  
  const [periodoHistorico, setPeriodoHistorico] = useState<number>(12);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const [concluidas, contagemStatus, previsao, parceiros, pontos, todasSolic] = await Promise.all([
          fetchTodasConcluidas(),
          fetchContagemPorStatus(),
          fetchPrevisaoColeta(),
          fetchTotalParceirosAprovados(),
          fetchTotalPontosAprovados(),
          adminSolicitacoesService.listar({ limit: 1000 }),
        ]);

        setTodasSolicitacoes(todasSolic.items);

        const semanaAtualInicio = daysAgo(6);
        const semanaAtualFim = new Date();
        const semanaAnteriorInicio = daysAgo(13);
        const semanaAnteriorFim = daysAgo(6);
        const volumeSemana = sumVolumeColetado(concluidas, semanaAtualInicio, semanaAtualFim);
        const volumeSemanaAnt = sumVolumeColetado(concluidas, semanaAnteriorInicio, semanaAnteriorFim);

        const mesAtualInicio = startOfMonth(0);
        const mesAtualFim = new Date();
        const mesAnteriorInicio = startOfMonth(-1);
        const mesAnteriorFim = startOfMonth(0);
        const volumeMes = sumVolumeColetado(concluidas, mesAtualInicio, mesAtualFim);
        const volumeMesAnt = sumVolumeColetado(concluidas, mesAnteriorInicio, mesAnteriorFim);

        const anoAtualInicio = startOfYear(0);
        const anoAtualFim = new Date();
        const anoAnteriorInicio = startOfYear(-1);
        const anoAnteriorFim = startOfYear(0);
        const volumeAno = sumVolumeColetado(concluidas, anoAtualInicio, anoAtualFim);
        const volumeAnoAnt = sumVolumeColetado(concluidas, anoAnteriorInicio, anoAnteriorFim);

        const volumePorParceiro = new Map<number, { nome: string; volume: number }>();
          concluidas.forEach((item) => {
            const parceiro = (item as any).parceiro;
            if (!parceiro || !item.volumeColetado) return;
            const atual = volumePorParceiro.get(parceiro.id) || { nome: parceiro.razaoSocial, volume: 0 };
            atual.volume += item.volumeColetado;
            volumePorParceiro.set(parceiro.id, atual);
          });
          const topParceiros = Array.from(volumePorParceiro.values())
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        const meses = [
          "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
          "Jan", "Fev", "Mar", "Abr", "Mai",
        ];
        const hoje = new Date();
        const historicoMensal = Array.from({ length: 12 }, (_, i) => {
        const offset = 11 - i;
        const inicioMes = startOfMonth(-offset);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() - offset + 1, 1);
        const volume = sumVolumeColetado(concluidas, inicioMes, fimMes);
        const rotulo = inicioMes.toLocaleDateString("pt-BR", { month: "short" });
        const mes = rotulo.charAt(0).toUpperCase() + rotulo.slice(1).replace(".", "");
        return { mes, volume };
      })

        setStats({
          volumeSemana,
          volumeSemanaPct: pctChange(volumeSemana, volumeSemanaAnt),
          volumeMes,
          volumeMesPct: pctChange(volumeMes, volumeMesAnt),
          volumeAno,
          volumeAnoPct: pctChange(volumeAno, volumeAnoAnt),
          parceirosAtivos: parceiros,
          pontosColeta: pontos,
          previsao,
          contagemStatus,
          historicoMensal,
          topParceiros,
        });
      } catch (e) {
        console.error(e);
        setErro("Não foi possível carregar os dados do dashboard.");
        addToast("Erro ao carregar dados", "error");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [addToast]);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336"];

  const dadosHistoricoFiltrados = useMemo(() => {
    if (!stats) return [];
    const { historicoMensal } = stats;
    return historicoMensal.slice(-periodoHistorico);
  }, [stats, periodoHistorico]);

  const metricasHistorico = useMemo(() => {
    const dados = dadosHistoricoFiltrados;
    if (dados.length === 0) return { total: 0, media: 0 };
    const total = dados.reduce((acc, item) => acc + item.volume, 0);
    const media = total / dados.length;
    return { total, media };
  }, [dadosHistoricoFiltrados]);

  const sparklineSemana = useMemo(() => {
    if (!todasSolicitacoes.length) return [0, 0, 0, 0, 0, 0, 0];
    return Array.from({ length: 7 }).map((_, i) => {
      const diaInicio = daysAgo(6 - i);
      const diaFim = daysAgo(5 - i);
      return sumVolumeColetado(todasSolicitacoes, diaInicio, diaFim);
    });
  }, [todasSolicitacoes]);

  const sparklineMensal = useMemo(() => {
    if (!stats) return [];
    return stats.historicoMensal.map((h) => h.volume);
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminTopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white-500">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-white-500">
              Visão geral do sistema de coleta de óleo de cozinha usado
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-sm text-white-500">
              <Calendar className="w-4 h-4" /> Hoje, {hoje}
            </div>
            <Button variant="secondary" size="sm">Exportar relatório</Button>
          </div>
        </div>

        {erro && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{erro}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="ÓLEO COLETADO - SEMANA"
            value={formatLitros(stats.volumeSemana)}
            subtext={`${stats.volumeSemanaPct >= 0 ? `+${stats.volumeSemanaPct}%` : `${stats.volumeSemanaPct}%`} vs semana anterior`}
            labelColor="text-green-primary"
            iconBgColor="bg-green-100"
            icon={<img src="/assets/icons/icon-calendar-week.svg" className="w-5 h-5" alt="Ícone Semana" />}            
            sparklineData={sparklineSemana}
            sparklineColor="#1A6E3C"
          />
          <SummaryCard
            label="ÓLEO COLETADO - MÊS"
            value={formatLitros(stats.volumeMes)}
            subtext={`${stats.volumeMesPct >= 0 ? `+${stats.volumeMesPct}%` : `${stats.volumeMesPct}%`} vs mês anterior`}
            labelColor="text-blue-primary"
            iconBgColor="bg-blue-100"
            icon={<img src="/assets/icons/icon-calendar-month.svg" className="w-5 h-5" alt="Ícone Mês" />}            
            sparklineData={sparklineMensal}
            sparklineColor="#1C60AF"
          />
          <SummaryCard
            label="ÓLEO COLETADO - ANO"
            value={formatLitros(stats.volumeAno)}
            subtext={`${stats.volumeAnoPct >= 0 ? `+${stats.volumeAnoPct}%` : `${stats.volumeAnoPct}%`} vs ano anterior`}
            labelColor="text-orange-primary"
            iconBgColor="bg-orange-100"
            icon={<img src="/assets/icons/icon-coleta-anual.svg" className="w-5 h-5" alt="Ícone Ano" />}            
            sparklineData={sparklineMensal}
            sparklineColor="#DF8729"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <SummaryCard
            label="PARCEIROS ATIVOS"
            value={String(stats.parceirosAtivos)}
            subtext="+12% vs mês anterior"
            labelColor="text-violet-primary"
            iconBgColor="bg-violet-100"
            icon={<Users className="w-5 h-5 text-violet-600" />}
          />
          <SummaryCard
            label="PONTOS DE COLETA"
            value={String(stats.pontosColeta)}
            subtext="+8% vs mês anterior"
            labelColor="text-teal-primary"
            iconBgColor="bg-teal-100"
            icon={<MapPin className="w-5 h-5 text-teal-500" />}
          />
        </div>

        <div className="mt-8">
          <MapSection solicitacoes={todasSolicitacoes} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-white-200 p-5">
            <div className="flex items-center mb-4">
          <h2 className="font-bold text-lg text-black-primary">Solicitações de Coleta</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-red-50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1">
              <img src="/assets/icons/icon-relogio2.svg" alt="" className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <p className="text-sm text-black-primary font-medium">Pendentes</p>
            <p className="text-3xl font-bold text-red-500">{stats.contagemStatus.AGUARDANDO}</p>
            <p className="text-xs text-black-200">Aguardando agendamento</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1">
              <img src="/assets/icons/icon-calendar.svg" alt="" className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <p className="text-sm text-black-primary font-medium">Agendadas</p>
            <p className="text-3xl font-bold text-orange-500">{stats.contagemStatus.AGENDADA}</p>
            <p className="text-xs text-black-200">Próximos 3 dias</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1">
              <img src="/assets/icons/icon-caminhao2.svg" alt="" className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <p className="text-sm text-black-primary font-medium">Em rota</p>
            <p className="text-3xl font-bold text-blue-500">{stats.contagemStatus.EM_ROTA}</p>
            <p className="text-xs text-black-200">Coletas em andamento</p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1">
              <img src="/assets/icons/icon-check.svg" alt="" className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <p className="text-sm text-black-primary font-medium">Concluído</p>
            <p className="text-3xl font-bold text-green-600">{stats.contagemStatus.CONCLUIDA}</p>
            <p className="text-xs text-black-200">Esta semana</p>
          </div>
        </div>

            <button
              onClick={() => navigate("/admin/requests")}
              className="mt-4 w-full border-2 border-green-primary text-green-primary font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              Ver todas as solicitações
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <h2 className="font-bold text-white-700 mb-2">Previsão de Coleta</h2>
            <p className="text-2xl font-bold text-green-primary">{formatLitros(stats.previsao.total)}</p>
            <p className="text-xs text-white-500">Próximos 7 dias</p>
            <p className="text-xs text-white-400 mt-1">
              Baseado nas solicitações {stats.previsao.detalhes.map(d => d.status.toLowerCase()).join(' e ')}
            </p>
            <div className="mt-4 space-y-2">
              {stats.previsao.detalhes.map((item) => (
                <div key={item.status} className="flex justify-between text-sm border-b border-white-100 pb-1">
                  <span className="text-white-600">{item.status}</span>
                  <span className="font-semibold">{formatLitros(item.volume)} ({item.count} solicitações)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <div className="flex flex-wrap items-center justify-between mb-3">
              <h2 className="font-bold text-white-700">Óleo Coletado (Histórico)</h2>
              <div className="flex gap-1 bg-white-100 rounded-lg p-1">
                <button
                  onClick={() => setPeriodoHistorico(1)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 1 ? "bg-green-primary text-white" : "text-white-600 hover:bg-white-200"
                  }`}
                >
                  1M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(3)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 3 ? "bg-green-primary text-white" : "text-white-600 hover:bg-white-200"
                  }`}
                >
                  3M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(6)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 6 ? "bg-green-primary text-white" : "text-white-600 hover:bg-white-200"
                  }`}
                >
                  6M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(12)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 12 ? "bg-green-primary text-white" : "text-white-600 hover:bg-white-200"
                  }`}
                >
                  12M
                </button>
              </div>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosHistoricoFiltrados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} L`} />
                  <Bar dataKey="volume" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between text-sm border-t border-white-100 pt-3">
              <div className="flex items-center gap-4">
                <span className="text-white-600">Total do período:</span>
                <span className="font-bold text-white-900">{formatLitros(metricasHistorico.total)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white-600">Média mensal:</span>
                <span className="font-bold text-white-900">{formatLitros(metricasHistorico.media)}</span>
              </div>
              <span className="text-xs text-white-400">
                {dadosHistoricoFiltrados.length} {dadosHistoricoFiltrados.length === 1 ? "mês" : "meses"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <h2 className="font-bold text-white-700 mb-3">Top Parceiros por Volume Coletado</h2>

            {stats.topParceiros.length === 0 ? (
              <p className="text-sm text-white-500 py-8 text-center">
                Nenhuma coleta concluída ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.topParceiros.map((p, index) => {
                  const maior = stats.topParceiros[0].volume || 1;
                  const largura = Math.max(8, Math.round((p.volume / maior) * 100));
                  return (
                    <div key={p.nome} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white-400 w-4 shrink-0">
                        {index + 1}º
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-black-primary truncate" title={p.nome}>
                            {p.nome}
                          </span>
                          <span className="text-sm font-bold text-green-primary shrink-0 ml-2">
                            {formatLitros(p.volume)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-primary rounded-full transition-all"
                            style={{ width: `${largura}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Dashboard;