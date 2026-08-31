import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  BarChart3,
  Users,
  MapPin,
  ArrowUp,
  ArrowDown,
  Leaf,
  Droplet,
  Award,
  Layers,
  Search,
  ExternalLink,
  Clock,
  CalendarCheck,
  Truck,
  CheckCircle2,
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

// ---------- HELPERS DE DATA ----------
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

// ---------- BUSCAS ----------
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

// ---------- SPARKLINE ----------
function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 40" className="w-full h-10 mt-3" preserveAspectRatio="none">
      <path
        d="M0,28 C15,20 30,32 45,24 C60,16 75,30 90,22 C105,14 120,26 135,18 C150,10 165,24 180,16 C190,12 195,14 200,10"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="0" cy="28" r="3" fill={color} />
    </svg>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  pct: number;
  compareLabel: string;
  color: string;
  hexColor: string;
}

function StatCard({ icon, title, value, pct, compareLabel, color, hexColor }: StatCardProps) {
  const isUp = pct >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
        {icon}
        <span className="uppercase tracking-wide">{title}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {isUp ? (
          <ArrowUp className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-red-600" />
        )}
        <span className={isUp ? "text-green-600" : "text-red-600"}>
          {Math.abs(pct)}%
        </span>
        <span className="text-gray-400">{compareLabel}</span>
      </div>
      <Sparkline color={hexColor} />
    </div>
  );
}

// ---------- COMPONENTE DO MAPA (versão simplificada, sem rota) ----------
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

const normalizarStatus = (valor: unknown): StatusAprovacao => {
  const status = String(valor || "PENDENTE").toUpperCase();
  if (status === "APROVADO" || status === "REJEITADO") return status;
  return "PENDENTE";
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
        <h2 className="font-bold text-gray-700">Mapa de Pontos de Coleta</h2>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Filtros */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setModoFiltro("todos")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modoFiltro === "todos" ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setModoFiltro("apenas-pontos")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modoFiltro === "apenas-pontos" ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pontos
            </button>
            <button
              onClick={() => setModoFiltro("apenas-solicitacoes")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modoFiltro === "apenas-solicitacoes" ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Solicitações
            </button>
          </div>
          {/* Camadas */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCamada("mapa")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                camada === "mapa" ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Mapa
            </button>
            <button
              onClick={() => setCamada("satelite")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                camada === "satelite" ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Satélite
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Barra de pesquisa (80%) + Botões (10% cada) */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-[8] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nome, parceiro ou endereço"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => navigate("/admin/map")}
            variant="secondary"
            className="flex-[1] flex items-center justify-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Ver mapa</span>
          </Button>
          <Button
            onClick={carregarPontos}
            disabled={carregandoPontos}
            variant="secondary"
            className="flex-[1] flex items-center justify-center"
          >
            {carregandoPontos ? (
              <div className="w-4 h-4 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              "Atualizar"
            )}
          </Button>
        </div>

        <div className="h-[400px] rounded-xl overflow-hidden bg-gray-100">
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
                              <span className="text-xs text-gray-500">Status:</span>
                              <StatusBadge status={ponto.solicitacoes[0].status} />
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Sem solicitação</p>
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

        {/* Legenda */}
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

// ---------- DASHBOARD PRINCIPAL ----------
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
  destinacao: { nome: string; valor: number; percentual: number }[];
}

function Dashboard() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [todasSolicitacoes, setTodasSolicitacoes] = useState<SolicitacaoColeta[]>([]);
  
  // Estado do filtro de período para o histórico
  const [periodoHistorico, setPeriodoHistorico] = useState<number>(12); // meses

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

        // Histórico mensal (últimos 12 meses)
        const meses = [
          "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        ];
        const hoje = new Date();
        const historicoMensal = meses.map((mes, i) => {
          const mesOffset = 11 - i;
          const inicioMes = startOfMonth(-mesOffset);
          const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() - mesOffset + 1, 1);
          const volume = sumVolumeColetado(concluidas, inicioMes, fimMes);
          return { mes, volume };
        });

        const destinacao = [
          { nome: "Biodiesel", valor: 92750, percentual: 72 },
          { nome: "Sabão / Cosméticos", valor: 22150, percentual: 17 },
          { nome: "Ração Animal", valor: 8650, percentual: 7 },
          { nome: "Outros", valor: 5100, percentual: 4 },
        ];

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
          destinacao,
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

  // Dados do histórico filtrados pelo período selecionado
  const dadosHistoricoFiltrados = useMemo(() => {
    if (!stats) return [];
    const { historicoMensal } = stats;
    return historicoMensal.slice(-periodoHistorico);
  }, [stats, periodoHistorico]);

  // Métricas do período filtrado
  const metricasHistorico = useMemo(() => {
    const dados = dadosHistoricoFiltrados;
    if (dados.length === 0) return { total: 0, media: 0 };
    const total = dados.reduce((acc, item) => acc + item.volume, 0);
    const media = total / dados.length;
    return { total, media };
  }, [dadosHistoricoFiltrados]);

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
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-white-500">
              Visão geral do sistema de coleta de óleo de cozinha usado.
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

        {/* CARDS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            title="Óleo coletado - Semana"
            value={formatLitros(stats.volumeSemana)}
            pct={stats.volumeSemanaPct}
            compareLabel="vs semana anterior"
            color="text-emerald-600"
            hexColor="#059669"
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            title="Óleo coletado - Mês"
            value={formatLitros(stats.volumeMes)}
            pct={stats.volumeMesPct}
            compareLabel="vs mês anterior"
            color="text-blue-600"
            hexColor="#2563eb"
          />
          <StatCard
            icon={<BarChart3 className="w-4 h-4" />}
            title="Óleo coletado - Ano"
            value={formatLitros(stats.volumeAno)}
            pct={stats.volumeAnoPct}
            compareLabel="vs ano anterior"
            color="text-orange-500"
            hexColor="#f97316"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            title="Parceiros Ativos"
            value={String(stats.parceirosAtivos)}
            pct={12}
            compareLabel="vs mês anterior"
            color="text-purple-600"
            hexColor="#9333ea"
          />
          <StatCard
            icon={<MapPin className="w-4 h-4" />}
            title="Pontos de Coleta"
            value={String(stats.pontosColeta)}
            pct={8}
            compareLabel="vs mês anterior"
            color="text-teal-500"
            hexColor="#14b8a6"
          />
        </div>

        {/* SEÇÃO 2: MAPA */}
        <div className="mt-8">
          <MapSection solicitacoes={todasSolicitacoes} />
        </div>

        {/* SEÇÃO 3: Solicitações, Previsão, Histórico, Destinação */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitações de Coleta */}
          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <h2 className="font-bold text-gray-700 mb-3">Solicitações de Coleta</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                <p className="text-xs text-orange-600 font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contagemStatus.AGUARDANDO}</p>
                <p className="text-xs text-gray-500">Aguardando agendamento</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-xs text-blue-600 font-medium">Agendadas</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contagemStatus.AGENDADA}</p>
                <p className="text-xs text-gray-500">Próximos 3 dias</p>
              </div>
              <div className="bg-violet-50 rounded-lg p-3 border-l-4 border-violet-500">
                <p className="text-xs text-violet-600 font-medium">Em Rota</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contagemStatus.EM_ROTA}</p>
                <p className="text-xs text-gray-500">Coletas em andamento</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                <p className="text-xs text-green-600 font-medium">Concluídas</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contagemStatus.CONCLUIDA}</p>
                <p className="text-xs text-gray-500">Esta semana</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/requests")}
              className="mt-3 text-sm text-green-primary font-medium hover:underline flex items-center gap-1"
            >
              Ver todas as solicitações →
            </button>
          </div>

          {/* Previsão de Coleta */}
          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <h2 className="font-bold text-gray-700 mb-2">Previsão de Coleta</h2>
            <p className="text-2xl font-bold text-green-primary">{formatLitros(stats.previsao.total)}</p>
            <p className="text-xs text-gray-500">Próximos 7 dias</p>
            <p className="text-xs text-gray-400 mt-1">
              Baseado nas solicitações {stats.previsao.detalhes.map(d => d.status.toLowerCase()).join(' e ')}
            </p>
            <div className="mt-4 space-y-2">
              {stats.previsao.detalhes.map((item) => (
                <div key={item.status} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                  <span className="text-gray-600">{item.status}</span>
                  <span className="font-semibold">{formatLitros(item.volume)} ({item.count} solicitações)</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/admin/previsao")}
              className="mt-3 text-sm text-green-primary font-medium hover:underline flex items-center gap-1"
            >
              Ver previsão detalhada →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Óleo Coletado (Histórico) - COM FILTRO E MÉTRICAS */}
          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <div className="flex flex-wrap items-center justify-between mb-3">
              <h2 className="font-bold text-gray-700">Óleo Coletado (Histórico)</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPeriodoHistorico(1)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 1 ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  1M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(3)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 3 ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  3M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(6)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 6 ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  6M
                </button>
                <button
                  onClick={() => setPeriodoHistorico(12)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    periodoHistorico === 12 ? "bg-green-primary text-white" : "text-gray-600 hover:bg-gray-200"
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

            {/* Legenda com métricas */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-sm border-t border-gray-100 pt-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Total do período:</span>
                <span className="font-bold text-gray-900">{formatLitros(metricasHistorico.total)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Média mensal:</span>
                <span className="font-bold text-gray-900">{formatLitros(metricasHistorico.media)}</span>
              </div>
              <span className="text-xs text-gray-400">
                {dadosHistoricoFiltrados.length} {dadosHistoricoFiltrados.length === 1 ? "mês" : "meses"}
              </span>
            </div>
          </div>

          {/* Destinação do Óleo */}
          <div className="bg-white rounded-xl shadow-sm border border-white-200 p-4">
            <h2 className="font-bold text-gray-700 mb-2">Destinação do Óleo</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.destinacao}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nome, percentual }) => `${nome}: ${percentual}%`}
                  >
                    {stats.destinacao.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} L`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => navigate("/admin/destinacao")}
              className="mt-2 text-sm text-green-primary font-medium hover:underline flex items-center gap-1"
            >
              Ver detalhes de destinação →
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Dashboard;