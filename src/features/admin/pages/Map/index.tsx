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
import { Check, Loader2, Navigation, Route, Search, X } from "lucide-react";
import AdminTopNav from "../../../../components/layout/AdminTopNav";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import useToast from "../../../../hooks/useToast";
import {
  adminPontosService,
  type PontoColetaAdmin,
  type StatusAprovacao,
} from "../../../../services/adminPontosService";

interface SolicitacaoColeta {
  id: number;
  pontoColetaId: number;
}

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

// Bounding box aproximado do território brasileiro (com uma margem de folga).
// Usado apenas para detectar e corrigir latitude/longitude gravados invertidos —
// não é uma validação geográfica rigorosa.
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

  // Caso os valores já estejam corretos, usa como vieram.
  if (dentroDoBrasil(latitudeBruta, longitudeBruta)) {
    return [latitudeBruta, longitudeBruta];
  }

  // Caso estejam invertidos (bug comum: lat salva no campo de lng e vice-versa),
  // corrige automaticamente para evitar pino caindo no oceano.
  if (dentroDoBrasil(longitudeBruta, latitudeBruta)) {
    return [longitudeBruta, latitudeBruta];
  }

  // Nenhuma das duas combinações cai dentro do Brasil: mantém o valor original
  // (pode ser um ponto legítimo fora do país) em vez de descartar o registro.
  return [latitudeBruta, longitudeBruta];
};

const normalizarPonto = (item: any): GeocodedPoint => {
  const parceiroOriginal = item?.parceiro || item?.parceiros || item || {};
  const solicitacoesOriginais = Array.isArray(item?.solicitacoes)
    ? item.solicitacoes
    : [];

  const solicitacoes: SolicitacaoColeta[] = solicitacoesOriginais.map(
    (solicitacao: any) => ({
      id: Number(solicitacao.id),
      pontoColetaId: Number(
        solicitacao.pontoColetaId ?? solicitacao.ponto_coleta_id ?? item.id
      ),
    })
  );

  const ponto = {
    id: Number(item?.id ?? parceiroOriginal.id),
    nomePontoColeta:
      item?.nomePontoColeta ??
      item?.nome_ponto_coleta ??
      item?.nome ??
      parceiroOriginal.razaoSocial ??
      parceiroOriginal.razao_social ??
      "Parceiro sem nome",
    capacidadeBombona: Number(
      item?.capacidadeBombona ??
        item?.capacidade_bombona ??
        parceiroOriginal.capacidadeBombona ??
        parceiroOriginal.capacidade_bombona ??
        0
    ),
    statusAprovacaoPontoColeta: normalizarStatus(
      item?.statusAprovacaoPontoColeta ??
        item?.status_aprovacao_ponto_coleta ??
        item?.statusAprovacao ??
        item?.status_aprovacao
    ),
    logradouro: item?.logradouro ?? parceiroOriginal.logradouro ?? "",
    numero: String(item?.numero ?? parceiroOriginal.numero ?? ""),
    bairro: item?.bairro ?? parceiroOriginal.bairro ?? "",
    cidade: item?.cidade ?? parceiroOriginal.cidade ?? "",
    estado: item?.estado ?? parceiroOriginal.estado ?? "",
    cep: item?.cep ?? parceiroOriginal.cep ?? "",
    latitude: item?.latitude ?? parceiroOriginal.latitude ?? null,
    longitude: item?.longitude ?? parceiroOriginal.longitude ?? null,
    solicitacoes,
    parceiro: {
      id: Number(parceiroOriginal.id ?? item?.parceiroId ?? item?.parceiro_id),
      razaoSocial:
        parceiroOriginal.razaoSocial ??
        parceiroOriginal.razao_social ??
        item?.nomePontoColeta ??
        "Parceiro sem nome",
      tipoParceiro:
        parceiroOriginal.tipoParceiro ?? parceiroOriginal.tipo_parceiro,
      tipoPessoa: parceiroOriginal.tipoPessoa ?? parceiroOriginal.tipo_pessoa,
      latitude: parceiroOriginal.latitude ?? item?.latitude ?? null,
      longitude: parceiroOriginal.longitude ?? item?.longitude ?? null,
      logradouro: parceiroOriginal.logradouro ?? item?.logradouro,
      numero: parceiroOriginal.numero ?? item?.numero,
      bairro: parceiroOriginal.bairro ?? item?.bairro,
      cidade: parceiroOriginal.cidade ?? item?.cidade,
      estado: parceiroOriginal.estado ?? item?.estado,
      cep: parceiroOriginal.cep ?? item?.cep,
    },
  } as PontoColetaAdmin;

  const latlng = obterCoordenadasDoPonto(ponto);
  const hasSolicitacao = Boolean(
    item?.hasSolicitacao ??
      item?.temSolicitacao ??
      item?.possui_solicitacao ??
      solicitacoes.length > 0
  );

  return {
    ...ponto,
    latlng: latlng || undefined,
    geocodingError: !latlng,
    hasSolicitacao,
    solicitacoes,
  };
};

const carregarTodosOsPontos = async (): Promise<PontoColetaAdmin[]> => {
  const limit = 100;
  const primeiraPagina = await adminPontosService.listarPontos({
    page: 1,
    limit,
  });

  const primeirosItens = primeiraPagina.items || [];
  const totalPages = Number(primeiraPagina.totalPages || 1);

  if (totalPages <= 1) return primeirosItens;

  const paginasRestantes = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      adminPontosService.listarPontos({
        page: index + 2,
        limit,
      })
    )
  );

  return [
    ...primeirosItens,
    ...paginasRestantes.flatMap((pagina) => pagina.items || []),
  ];
};

const criarIcone = (
  status: StatusAprovacao,
  hasSolicitacao: boolean,
  selecionado: boolean
) => {
  let backgroundColor = "#9E9E9E";
  if (status === "APROVADO") {
    backgroundColor = hasSolicitacao ? "#1E88E5" : "#4CAF50";
  } else if (status === "PENDENTE") {
    backgroundColor = "#FB8C00";
  } else if (status === "REJEITADO") {
    backgroundColor = "#E53935";
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
  const [filtro, setFiltro] = useState("");
  const [selectedPontos, setSelectedPontos] = useState<GeocodedPoint[]>([]);
  const [rota, setRota] = useState<RotaInfo | null>(null);
  const [carregandoPontos, setCarregandoPontos] = useState(true);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const [modalRotaAberta, setModalRotaAberta] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setCarregandoPontos(true);
      const registros = await carregarTodosOsPontos();
      const pontosNormalizados = registros.map(normalizarPonto);
      setPontos(pontosNormalizados);

      const semCoordenadas = pontosNormalizados.filter(
        (ponto) => !ponto.latlng
      ).length;

      if (semCoordenadas > 0) {
        addToast(
          `${semCoordenadas} parceiro(s) não possuem coordenadas válidas`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Erro ao carregar os parceiros:", error);
      setPontos([]);
      addToast("Não foi possível carregar os parceiros", "error");
    } finally {
      setCarregandoPontos(false);
    }
  }, [addToast]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const pontosFiltrados = useMemo(() => {
    const termo = filtro.toLowerCase().trim();
    if (!termo) return pontos;

    return pontos.filter((ponto) => {
      const endereco = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade} ${ponto.estado || ""}`.toLowerCase();
      return (
        ponto.nomePontoColeta.toLowerCase().includes(termo) ||
        ponto.parceiro?.razaoSocial.toLowerCase().includes(termo) ||
        endereco.includes(termo)
      );
    });
  }, [filtro, pontos]);

  const togglePontoSelecionado = (ponto: GeocodedPoint) => {
    if (!ponto.hasSolicitacao) {
      addToast("Somente pontos com solicitação podem entrar na rota", "warning");
      return;
    }
    if (!ponto.latlng) {
      addToast("Ponto sem coordenadas disponíveis", "warning");
      return;
    }

    setRota(null);
    setModalRotaAberta(false);
    setSelectedPontos((anteriores) => {
      const existe = anteriores.some((selecionado) => selecionado.id === ponto.id);
      return existe
        ? anteriores.filter((selecionado) => selecionado.id !== ponto.id)
        : [...anteriores, ponto];
    });
  };

  const tracarRota = async () => {
    const pontosValidos = selectedPontos.filter(
      (ponto) => ponto.hasSolicitacao && ponto.latlng
    );

    if (pontosValidos.length < 2) {
      addToast("Selecione pelo menos dois pontos para traçar a rota", "warning");
      return;
    }

    setCarregandoRota(true);
    try {
      const coordenadasStr = pontosValidos
        .map((ponto) => {
          const [latitude, longitude] = ponto.latlng as [number, number];
          return `${longitude},${latitude}`;
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
        ([longitude, latitude]: [number, number]) => [latitude, longitude]
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
    <div className="min-h-screen flex flex-col bg-background">
      <AdminTopNav />

      <main className="w-full max-w-[1440px] mx-auto p-6 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-primary mt-2 sm:mt-5 mb-1">
          Mapa de Parceiros e Pontos de Coleta
        </h1>
        <p className="text-sm sm:text-base text-white-500 mb-6">
          Visualize todos os parceiros. Somente pontos com solicitação podem entrar na rota.
        </p>

        <div className="flex items-stretch gap-2 mb-4">
        <div className="relative flex-[2]"> 
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white-400 w-4 h-4" />
            <Input
            type="text"
            placeholder="Buscar por parceiro, ponto ou endereço"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            className="pl-10"
            />
        </div>
        <Button
            type="button"
            variant="secondary"
            onClick={() => void carregarDados()}
            disabled={carregandoPontos}
            className="flex-[1]"   
        >
            Atualizar
        </Button>
        </div>
            

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-[70vh] rounded-2xl overflow-hidden shadow-lg relative">
            {carregandoPontos ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-[1001]">
                <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
                <span className="ml-2 text-sm text-white-600">Carregando parceiros...</span>
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
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {pontosFiltrados.map((ponto) => {
                  if (!ponto.latlng) return null;
                  const selecionado = selectedPontos.some((item) => item.id === ponto.id);

                  return (
                    <Marker
                      key={ponto.id}
                      position={ponto.latlng}
                      icon={criarIcone(
                        ponto.statusAprovacaoPontoColeta,
                        ponto.hasSolicitacao,
                        selecionado
                      )}
                      eventHandlers={{ click: () => togglePontoSelecionado(ponto) }}
                    >
                      <Popup>
                        <div className="text-sm max-w-xs">
                          <strong>{ponto.nomePontoColeta}</strong>
                          {ponto.parceiro?.razaoSocial && (
                            <p className="mt-1">Parceiro: {ponto.parceiro.razaoSocial}</p>
                          )}
                          <p>{`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${ponto.estado ? ` - ${ponto.estado}` : ""}`}</p>
                          <p>Capacidade: {ponto.capacidadeBombona} L</p>
                          <p>Status: {ponto.statusAprovacaoPontoColeta}</p>
                          <p>Latitude: {ponto.latlng[0]}</p>
                          <p>Longitude: {ponto.latlng[1]}</p>
                          {ponto.hasSolicitacao ? (
                            <button
                              type="button"
                              className="mt-2 rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                togglePontoSelecionado(ponto);
                              }}
                            >
                              {selecionado ? "Remover da rota" : "Adicionar à rota"}
                            </button>
                          ) : (
                            <p className="mt-2 text-gray-500">Sem solicitação de coleta</p>
                          )}
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

            <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-3 z-[1000] text-xs">
              <h3 className="font-bold mb-2">Legenda</h3>
              <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-green-500" />Aprovado</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-500" />Aprovado com solicitação</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-orange-500" />Pendente</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" />Rejeitado</div>
            </div>
          </div>

          <div className="lg:w-96 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 max-h-96 overflow-y-auto">
              <h2 className="font-bold text-gray-700 mb-2">
                Parceiros encontrados ({pontosFiltrados.length})
              </h2>
              <ul className="space-y-2">
                {pontosFiltrados.map((ponto) => {
                  const selecionado = selectedPontos.some((item) => item.id === ponto.id);
                  return (
                    <li
                      key={ponto.id}
                      className={`flex justify-between items-center p-2 rounded transition-colors ${
                        selecionado ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                      } ${ponto.hasSolicitacao ? "cursor-pointer" : "cursor-default opacity-75"}`}
                      onClick={() => togglePontoSelecionado(ponto)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ponto.nomePontoColeta}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ponto.statusAprovacaoPontoColeta === "APROVADO"
                              ? "bg-green-100 text-green-700"
                              : ponto.statusAprovacaoPontoColeta === "PENDENTE"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                          }`}>
                            {ponto.statusAprovacaoPontoColeta}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ponto.hasSolicitacao
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {ponto.hasSolicitacao
                              ? `${ponto.solicitacoes.length} solicitação(ões)`
                              : "Sem solicitação"}
                          </span>
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
                  <li className="text-center text-gray-500 text-sm py-4">
                    Nenhum parceiro encontrado
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-gray-700 mb-2">
                Pontos na rota ({selectedPontos.length})
              </h2>
              {selectedPontos.length ? (
                <ul className="space-y-2 mb-4">
                  {selectedPontos.map((ponto, index) => (
                    <li key={ponto.id} className="flex items-center gap-2 text-sm">
                      <span className="bg-green-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{ponto.nomePontoColeta}</span>
                      <button type="button" onClick={() => togglePontoSelecionado(ponto)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mb-4">
                  Clique em um ponto com solicitação para adicioná-lo.
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={tracarRota} disabled={selectedPontos.length < 2 || carregandoRota} variant="primary" fullWidth>
                  {carregandoRota ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Calculando...</>
                  ) : (
                    <><Route className="w-4 h-4 mr-2" />Traçar Rota</>
                  )}
                </Button>
                <Button onClick={limparSelecao} variant="secondary" disabled={!selectedPontos.length && !rota}>
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalRotaAberta && rota && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setModalRotaAberta(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Navigation className="w-6 h-6" />Resumo da Rota
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Distância total</span>
                <p className="text-xl font-bold text-gray-800">{rota.distanciaKm.toFixed(2)} km</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Tempo estimado</span>
                <p className="text-xl font-bold text-gray-800">{Math.round(rota.duracaoMin)} min</p>
              </div>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">
              Ordem de passagem ({rota.pontosOrdenados.length} pontos)
            </h3>
            <ol className="space-y-3 mb-6">
              {rota.pontosOrdenados.map((ponto, index) => (
                <li key={ponto.id} className="flex gap-3 items-start">
                  <span className="bg-green-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{ponto.nomePontoColeta}</p>
                    <p className="text-sm text-gray-500">
                      {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${ponto.estado ? ` - ${ponto.estado}` : ""}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalRotaAberta(false)} variant="secondary">Fechar</Button>
              <Button onClick={limparSelecao} variant="primary">Limpar Rota</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;