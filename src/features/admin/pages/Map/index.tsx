import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet";
import { Check, Layers, Loader2, Navigation, Route, Search, X } from "lucide-react";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import StatusBadge from "../../../../components/ui/StatusBadge";
import useToast from "../../../../hooks/useToast";
import {
  adminPontosService,
  type PontoColetaAdmin,
  type StatusAprovacao,
} from "../../../../services/adminPontosService";
import {
  adminSolicitacoesService,
  type SolicitacaoColeta,
} from "../../../../services/AdminSolicitacaoService";
import Footer from "../../../../components/layout/Footer";


interface ParceiroAdmin {
  id: number;
  razaoSocial: string;
  tipoParceiro?: string;
  tipoPessoa?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface GeocodedPoint extends PontoColetaAdmin {
  latlng?: [number, number];
  geocodingError?: boolean;
  hasSolicitacao: boolean;
  solicitacoes: SolicitacaoColeta[];
}

interface RotaInfo {
  distanciaKm: number;
  duracaoMin: number;
  coordenadas: [number, number][];
  pontosOrdenados: GeocodedPoint[];
}

interface MapControllerProps {
  rota: RotaInfo | null;
  pontos: GeocodedPoint[];
}

type FiltroModo = "todos" | "apenas-pontos" | "apenas-solicitacoes";
type CamadaMapa = "mapa" | "satelite";

const numeroValido = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};

const BRASIL_BOUNDS = {
  latMin: -34,
  latMax: 6,
  lngMin: -75,
  lngMax: -28,
};

const dentroDoBrasil = (lat: number, lng: number): boolean =>
  lat >= BRASIL_BOUNDS.latMin &&
  lat <= BRASIL_BOUNDS.latMax &&
  lng >= BRASIL_BOUNDS.lngMin &&
  lng <= BRASIL_BOUNDS.lngMax;

const obterCoordenadasDoPonto = (
  ponto: PontoColetaAdmin
): [number, number] | null => {
  const registro = ponto as PontoColetaAdmin & Record<string, unknown>;
  const parceiro = (registro.parceiro || {}) as ParceiroAdmin &
    Record<string, unknown>;

  const latitudeBruta = numeroValido(
    registro.latitude ??
      registro.lat ??
      registro.enderecoLatitude ??
      parceiro.latitude ??
      parceiro.lat ??
      parceiro.enderecoLatitude
  );

  const longitudeBruta = numeroValido(
    registro.longitude ??
      registro.lng ??
      registro.lon ??
      registro.enderecoLongitude ??
      parceiro.longitude ??
      parceiro.lng ??
      parceiro.lon ??
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
  selecionado: boolean,
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

  const size = selecionado ? 32 : 26;
  const border = selecionado ? 4 : 2;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${border}px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,.5), 0 0 0 ${selecionado ? 3 : 0}px #166534;
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

function MapController({ rota, pontos }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (rota?.coordenadas.length) {
      map.fitBounds(L.latLngBounds(rota.coordenadas), { padding: [50, 50] });
      return;
    }

    const coordenadas = pontos
      .map((ponto) => ponto.latlng)
      .filter((valor): valor is [number, number] => Boolean(valor));

    if (coordenadas.length === 1) {
      map.setView(coordenadas[0], 15);
    } else if (coordenadas.length > 1) {
      map.fitBounds(L.latLngBounds(coordenadas), {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [map, pontos, rota]);

  return null;
}

function MapPage() {
  const { addToast } = useToast();
  const [pontos, setPontos] = useState<GeocodedPoint[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [modoFiltro, setModoFiltro] = useState<FiltroModo>("todos");
  const [camada, setCamada] = useState<CamadaMapa>("mapa");
  const [selectedPontos, setSelectedPontos] = useState<GeocodedPoint[]>([]);
  const [rota, setRota] = useState<RotaInfo | null>(null);
  const [carregandoPontos, setCarregandoPontos] = useState(true);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const [modalRotaAberta, setModalRotaAberta] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setCarregandoPontos(true);

      const [todosPontos, todasSolicitacoes] = await Promise.all([
        carregarTodosOsPontos(),
        carregarTodasSolicitacoes(),
      ]);

      const solicitacoesPorPonto = todasSolicitacoes.reduce<
        Record<number, SolicitacaoColeta[]>
      >((acc, sol) => {
        const key = sol.pontoColetaId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(sol);
        return acc;
      }, {});

      const pontosNormalizados = todosPontos.map((ponto) => {
        const solicitacoesDoPonto = solicitacoesPorPonto[ponto.id] || [];
        return normalizarPonto(ponto, solicitacoesDoPonto);
      });

      setPontos(pontosNormalizados);

      const semCoordenadas = pontosNormalizados.filter(
        (p) => !p.latlng
      ).length;
      if (semCoordenadas > 0) {
        addToast(
          `${semCoordenadas} ponto(s) não possuem coordenadas válidas`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setPontos([]);
      addToast("Erro ao carregar dados", "error");
    } finally {
      setCarregandoPontos(false);
    }
  }, [addToast]);

  const carregarTodosOsPontos = async (): Promise<PontoColetaAdmin[]> => {
    const limit = 100;
    let pagina = 1;
    let totalPages = 1;
    const todos: PontoColetaAdmin[] = [];

    do {
      const resposta = await adminPontosService.listarPontos({
        page: pagina,
        limit,
      });
      todos.push(...resposta.items);
      totalPages = resposta.totalPages;
      pagina++;
    } while (pagina <= totalPages);

    return todos;
  };

  const carregarTodasSolicitacoes = async (): Promise<SolicitacaoColeta[]> => {
    const limit = 100;
    let pagina = 1;
    let totalPages = 1;
    const todas: SolicitacaoColeta[] = [];

    do {
      const resposta = await adminSolicitacoesService.listar({
        page: pagina,
        limit,
      });
      todas.push(...resposta.items);
      totalPages = resposta.totalPages;
      pagina++;
    } while (pagina <= totalPages);

    return todas;
  };

  const normalizarPonto = (
    ponto: PontoColetaAdmin,
    solicitacoes: SolicitacaoColeta[]
  ): GeocodedPoint => {
    const latlng = obterCoordenadasDoPonto(ponto);
    const hasSolicitacao = solicitacoes.length > 0;

    return {
      ...ponto,
      latlng: latlng || undefined,
      geocodingError: !latlng,
      hasSolicitacao,
      solicitacoes,
    };
  };

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const pontosFiltrados = useMemo(() => {
    let resultado = pontos;

    if (filtroTexto.trim()) {
      const termo = filtroTexto.toLowerCase().trim();
      resultado = resultado.filter((ponto) => {
        const endereco = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade} ${ponto.estado || ""}`.toLowerCase();
        return (
          ponto.nomePontoColeta.toLowerCase().includes(termo) ||
          ponto.parceiro?.razaoSocial.toLowerCase().includes(termo) ||
          endereco.includes(termo)
        );
      });
    }

    if (modoFiltro === "apenas-pontos") {
      return resultado;
    }

    if (modoFiltro === "apenas-solicitacoes") {
      return resultado.filter((p) => p.hasSolicitacao);
    }

    return resultado;
  }, [filtroTexto, pontos, modoFiltro]);

  const togglePontoSelecionado = (ponto: GeocodedPoint) => {
    if (!ponto.latlng) {
      addToast("Ponto sem coordenadas disponíveis", "warning");
      return;
    }

    setRota(null);
    setModalRotaAberta(false);
    setSelectedPontos((anteriores) => {
      const existe = anteriores.some((p) => p.id === ponto.id);
      return existe
        ? anteriores.filter((p) => p.id !== ponto.id)
        : [...anteriores, ponto];
    });
  };

  const tracarRota = async () => {
    const pontosValidos = selectedPontos.filter((p) => p.latlng);

    if (pontosValidos.length < 2) {
      addToast("Selecione pelo menos dois pontos para traçar a rota", "warning");
      return;
    }

    setCarregandoRota(true);
    try {
      const coordenadasStr = pontosValidos
        .map((p) => {
          const [lat, lng] = p.latlng as [number, number];
          return `${lng},${lat}`;
        })
        .join(";");

      const url = `https://router.project-osrm.org/route/v1/driving/${coordenadasStr}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha no serviço de rotas");

      const data = await response.json();
      if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error("Não foi possível calcular a rota");
      }

      const route = data.routes[0];
      const rotaCoordenadas: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      setRota({
        distanciaKm: route.distance / 1000,
        duracaoMin: route.duration / 60,
        coordenadas: rotaCoordenadas,
        pontosOrdenados: pontosValidos,
      });
      setModalRotaAberta(true);
    } catch (error) {
      console.error("Erro ao traçar rota:", error);
      setRota(null);
      addToast("Erro ao traçar rota", "error");
    } finally {
      setCarregandoRota(false);
    }
  };

  const limparSelecao = () => {
    setSelectedPontos([]);
    setRota(null);
    setModalRotaAberta(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
          Mapa de Pontos de Coleta
        </h1>
        <p className="text-sm sm:text-base text-white-500 mb-6">
          Visualize todos os pontos de coleta e suas solicitações.
        </p>

        {/* Barra de Filtros Responsiva */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-white-primary rounded-lg border border-white-200 p-1">
              <button
                type="button"
                onClick={() => setModoFiltro("todos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  modoFiltro === "todos"
                    ? "bg-green-primary text-white"
                    : "text-white-600 hover:bg-white-100"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setModoFiltro("apenas-pontos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  modoFiltro === "apenas-pontos"
                    ? "bg-green-primary text-white"
                    : "text-white-600 hover:bg-white-100"
                }`}
              >
                Pontos
              </button>
              <button
                type="button"
                onClick={() => setModoFiltro("apenas-solicitacoes")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  modoFiltro === "apenas-solicitacoes"
                    ? "bg-green-primary text-white"
                    : "text-white-600 hover:bg-white-100"
                }`}
              >
                Solicitações
              </button>
            </div>

            <div className="flex gap-1 bg-white rounded-lg border border-white-200 p-1">
              <button
                type="button"
                onClick={() => setCamada("mapa")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  camada === "mapa"
                    ? "bg-green-primary text-white"
                    : "text-white-600 hover:bg-white-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Mapa
              </button>
              <button
                type="button"
                onClick={() => setCamada("satelite")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  camada === "satelite"
                    ? "bg-green-primary text-white"
                    : "text-white-600 hover:bg-white-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Satélite
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, parceiro ou endereço"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              type="button"
              variant="terciary"
              onClick={() => void carregarDados()}
              disabled={carregandoPontos}
              className="sm:w-auto shrink-0"
            >
              {carregandoPontos ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Atualizar"
              )}
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal: Mapa e Listas Laterais */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-[50vh] sm:h-[65vh] lg:h-[78vh] rounded-2xl overflow-hidden shadow-sm relative border border-white-200">
            {carregandoPontos ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-[1001]">
                <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
                <span className="ml-2 text-sm text-white-600">Carregando dados...</span>
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
                      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      : '&copy; <a href="https://www.esri.com/">Esri</a>'
                  }
                />

                {pontosFiltrados.map((ponto) => {
                  if (!ponto.latlng) return null;
                  const selecionado = selectedPontos.some(
                    (p) => p.id === ponto.id
                  );

                  return (
                    <Marker
                      key={ponto.id}
                      position={ponto.latlng}
                      icon={criarIcone(
                        ponto.statusAprovacaoPontoColeta,
                        ponto.hasSolicitacao,
                        selecionado,
                        modoFiltro
                      )}
                      eventHandlers={{ click: () => togglePontoSelecionado(ponto) }}
                    >
                      <Popup>
                        <div className="text-sm max-w-xs">
                          <strong>{ponto.nomePontoColeta}</strong>
                          {ponto.parceiro?.razaoSocial && (
                            <p className="mt-1">Parceiro: {ponto.parceiro.razaoSocial}</p>
                          )}
                          <p>
                            {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${ponto.estado ? ` - ${ponto.estado}` : ""}`}
                          </p>
                          <p>Capacidade: {ponto.capacidadeBombona} L</p>

                          {modoFiltro === "apenas-solicitacoes" ? (
                            ponto.solicitacoes.length > 0 ? (
                              <div className="mt-1">
                                <span className="text-xs text-white-500">Status da solicitação:</span>
                                <StatusBadge status={ponto.solicitacoes[0].status} />
                                {ponto.solicitacoes.length > 1 && (
                                  <span className="text-xs text-white-400 ml-1">
                                    +{ponto.solicitacoes.length - 1} outras
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-white-400 mt-1">Sem solicitação</p>
                            )
                          ) : (
                            <p className="mt-1">
                              Status: {ponto.statusAprovacaoPontoColeta}
                              {ponto.hasSolicitacao && (
                                <span className="ml-1 text-xs text-blue-600 font-medium">
                                  (com solicitação)
                                </span>
                              )}
                            </p>
                          )}

                          {modoFiltro === "todos" && ponto.solicitacoes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white-200">
                              <p className="text-xs font-bold text-white-600">
                                Solicitações ({ponto.solicitacoes.length})
                              </p>
                              <ul className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                                {ponto.solicitacoes.slice(0, 3).map((sol) => (
                                  <li key={sol.id} className="text-xs bg-white-50 p-1 rounded flex justify-between items-center">
                                    <span>#{sol.id}</span>
                                    <StatusBadge status={sol.status} />
                                  </li>
                                ))}
                                {ponto.solicitacoes.length > 3 && (
                                  <li className="text-xs text-white-400 text-center">
                                    +{ponto.solicitacoes.length - 3} outras
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <button
                            type="button"
                            className="mt-2 rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 w-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePontoSelecionado(ponto);
                            }}
                          >
                            {selecionado ? "Remover da rota" : "Adicionar à rota"}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {rota?.coordenadas.length ? (
                  <Polyline
                    positions={rota.coordenadas}
                    pathOptions={{ color: "#4CAF50", weight: 6, opacity: 0.8 }}
                  />
                ) : null}

                <MapController rota={rota} pontos={pontosFiltrados} />
              </MapContainer>
            )}

            {/* Legenda */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs rounded-lg shadow-md p-2.5 z-[1000] text-xs">
              <h3 className="font-bold mb-1.5">Legenda</h3>
              {modoFiltro === "apenas-solicitacoes" ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" /> Com solicitação
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white-400 shrink-0" /> Sem solicitação
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" /> Aprovado
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" /> Com solicitação
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" /> Pendente
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" /> Rejeitado
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LISTA LATERAL / INFERIOR */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 max-h-80 lg:max-h-96 overflow-y-auto border border-white-200">
              <h2 className="font-bold text-white-600 mb-2">
                Pontos encontrados ({pontosFiltrados.length})
              </h2>
              <ul className="space-y-2">
                {pontosFiltrados.map((ponto) => {
                  const selecionado = selectedPontos.some(
                    (p) => p.id === ponto.id
                  );
                  return (
                    <li
                      key={ponto.id}
                      className={`flex justify-between items-center p-2.5 rounded-lg transition-colors ${
                        selecionado ? "bg-green-50 border border-green-200" : "hover:bg-white-50 border border-transparent"
                      } cursor-pointer`}
                      onClick={() => togglePontoSelecionado(ponto)}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-sm truncate">{ponto.nomePontoColeta}</p>
                        <p className="text-xs text-white-500 truncate">
                          {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {modoFiltro === "apenas-solicitacoes" ? (
                            ponto.solicitacoes.length > 0 ? (
                              <StatusBadge status={ponto.solicitacoes[0].status} />
                            ) : (
                              <span className="text-xs bg-white-100 text-white-600 px-2 py-0.5 rounded-full">
                                Sem solicitação
                              </span>
                            )
                          ) : (
                            <>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  ponto.statusAprovacaoPontoColeta === "APROVADO"
                                    ? "bg-green-100 text-green-700"
                                    : ponto.statusAprovacaoPontoColeta === "PENDENTE"
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {ponto.statusAprovacaoPontoColeta}
                              </span>
                              {ponto.hasSolicitacao && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  {ponto.solicitacoes.filter((s) => s.status !== "CONCLUIDA").length} ativa(s)
                                </span>
                              )}
                            </>
                          )}
                          {!ponto.latlng && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Sem coordenadas
                            </span>
                          )}
                        </div>
                      </div>
                      {selecionado && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                    </li>
                  );
                })}
                {!pontosFiltrados.length && (
                  <li className="text-center text-white-500 text-sm py-4">
                    Nenhum ponto encontrado
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-white-200">
              <h2 className="font-bold text-white-600 mb-2">
                Pontos na rota ({selectedPontos.length})
              </h2>
              {selectedPontos.length ? (
                <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {selectedPontos.map((ponto, index) => (
                    <li key={ponto.id} className="flex items-center gap-2 text-sm bg-white-50 p-1.5 rounded-md">
                      <span className="bg-green-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{ponto.nomePontoColeta}</span>
                      <button
                        type="button"
                        onClick={() => togglePontoSelecionado(ponto)}
                        className="text-red-400 hover:text-red-600 cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white-400 mb-4">
                  Clique em um ponto para adicioná-lo à rota.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={tracarRota}
                  disabled={selectedPontos.length < 2 || carregandoRota}
                  variant="primary"
                  fullWidth
                >
                  {carregandoRota ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Route className="w-4 h-4 mr-2" />
                      Traçar Rota
                    </>
                  )}
                </Button>
                <Button
                  onClick={limparSelecao}
                  variant="secondary"
                  disabled={!selectedPontos.length && !rota}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ROTA REUTILIZÁVEL */}
      {modalRotaAberta && rota && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalRotaAberta(false)}
              className="absolute top-4 right-4 text-white-400 hover:text-white-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Navigation className="w-6 h-6" />
              Resumo da Rota
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white-50 rounded-lg p-3">
                <span className="text-xs sm:text-sm text-white-500">Distância total</span>
                <p className="text-lg sm:text-xl font-bold text-white-800">
                  {rota.distanciaKm.toFixed(2)} km
                </p>
              </div>
              <div className="bg-white-50 rounded-lg p-3">
                <span className="text-xs sm:text-sm text-white-500">Tempo estimado</span>
                <p className="text-lg sm:text-xl font-bold text-white-800">
                  {Math.round(rota.duracaoMin)} min
                </p>
              </div>
            </div>
            <h3 className="font-semibold text-white-600 mb-2 text-sm sm:text-base">
              Ordem de passagem ({rota.pontosOrdenados.length} pontos)
            </h3>
            <ol className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {rota.pontosOrdenados.map((ponto, index) => (
                <li key={ponto.id} className="flex gap-3 items-start">
                  <span className="bg-green-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-white-800">{ponto.nomePontoColeta}</p>
                    <p className="text-xs sm:text-sm text-white-500">
                      {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${ponto.estado ? ` - ${ponto.estado}` : ""}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalRotaAberta(false)} variant="secondary" size="sm">
                Fechar
              </Button>
              <Button
                onClick={() => {
                  limparSelecao();
                  setModalRotaAberta(false);
                }}
                variant="primary"
                size="sm"
              >
                Limpar Rota
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default MapPage;