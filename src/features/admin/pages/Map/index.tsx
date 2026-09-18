// src/pages/Admin/Map/index.tsx

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

import {
  Check,
  Layers,
  Loader2,
  Navigation,
  Search,
  X,
} from "lucide-react";

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

// ======================================================
// TIPOS
// ======================================================

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

  hasSolicitacaoAtiva: boolean;

  solicitacoesAtivas: SolicitacaoColeta[];

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

type FiltroModo =
  | "todos"
  | "apenas-pontos"
  | "apenas-solicitacoes";

type CamadaMapa = "mapa" | "satelite";

// ======================================================
// STATUS DE SOLICITAÇÕES
// ======================================================

const STATUS_ATIVOS: readonly SolicitacaoColeta["status"][] = [
  "AGUARDANDO",
  "AGENDADA",
  "EM_ROTA",
];

// ======================================================
// HELPERS
// ======================================================

const numeroValido = (
  valor: unknown,
): number | null => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(
    String(valor).replace(",", "."),
  );

  return Number.isFinite(numero)
    ? numero
    : null;
};

const BRASIL_BOUNDS = {
  latMin: -34,
  latMax: 6,
  lngMin: -75,
  lngMax: -28,
};

const dentroDoBrasil = (
  lat: number,
  lng: number,
): boolean =>
  lat >= BRASIL_BOUNDS.latMin &&
  lat <= BRASIL_BOUNDS.latMax &&
  lng >= BRASIL_BOUNDS.lngMin &&
  lng <= BRASIL_BOUNDS.lngMax;

// ======================================================
// OBTER COORDENADAS
// ======================================================

const obterCoordenadasDoPonto = (
  ponto: PontoColetaAdmin,
): [number, number] | null => {
  const registro =
    ponto as PontoColetaAdmin &
      Record<string, unknown>;

  const parceiro = (
    registro.parceiro || {}
  ) as ParceiroAdmin &
    Record<string, unknown>;

  const latitudeBruta = numeroValido(
    registro.latitude ??
      registro.lat ??
      registro.enderecoLatitude ??
      parceiro.latitude ??
      parceiro.lat ??
      parceiro.enderecoLatitude,
  );

  const longitudeBruta = numeroValido(
    registro.longitude ??
      registro.lng ??
      registro.lon ??
      registro.enderecoLongitude ??
      parceiro.longitude ??
      parceiro.lng ??
      parceiro.lon ??
      parceiro.enderecoLongitude,
  );

  if (
    latitudeBruta === null ||
    longitudeBruta === null ||
    Math.abs(latitudeBruta) > 90 ||
    Math.abs(longitudeBruta) > 180
  ) {
    return null;
  }

  // Coordenadas normais
  if (
    dentroDoBrasil(
      latitudeBruta,
      longitudeBruta,
    )
  ) {
    return [
      latitudeBruta,
      longitudeBruta,
    ];
  }

  // Tenta detectar latitude e longitude invertidas
  if (
    dentroDoBrasil(
      longitudeBruta,
      latitudeBruta,
    )
  ) {
    return [
      longitudeBruta,
      latitudeBruta,
    ];
  }

  return [
    latitudeBruta,
    longitudeBruta,
  ];
};

// ======================================================
// ÍCONE DO MAPA
// ======================================================

const criarIcone = (
  status: StatusAprovacao,
  hasSolicitacaoAtiva: boolean,
  selecionado: boolean,
) => {
  let backgroundColor = "#9E9E9E";

  if (status === "APROVADO") {
    backgroundColor =
      hasSolicitacaoAtiva
        ? "#1E88E5"
        : "#4CAF50";
  } else if (status === "PENDENTE") {
    backgroundColor = "#FB8C00";
  } else if (status === "REJEITADO") {
    backgroundColor = "#E53935";
  }

  const size = selecionado ? 32 : 26;

  const border = selecionado ? 4 : 2;

  return L.divIcon({
    html: `
      <div
        style="
          background-color: ${backgroundColor};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: ${border}px solid white;
          box-shadow:
            0 0 4px rgba(0,0,0,.5),
            0 0 0 ${
              selecionado ? 3 : 0
            }px #166534;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <div
          style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "
        ></div>
      </div>
    `,

    className: "",

    iconSize: [
      size,
      size,
    ],

    iconAnchor: [
      size / 2,
      size,
    ],

    popupAnchor: [
      0,
      -size,
    ],
  });
};

// ======================================================
// CONTROLADOR DO MAPA
// ======================================================

function MapController({
  rota,
  pontos,
}: MapControllerProps) {
  const map = useMap();

  /*
   * IMPORTANTE:
   *
   * Leaflet não detecta automaticamente algumas
   * mudanças de tamanho do container.
   *
   * Isso costuma causar:
   *
   * - mapa cortado
   * - mapa cinza
   * - tiles faltando
   * - mapa ocupando apenas parte do container
   *
   * quando a tela é redimensionada.
   */
  useEffect(() => {
    let timeout: ReturnType<
      typeof setTimeout
    >;

    const atualizarTamanho = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        map.invalidateSize({
          animate: false,
        });
      }, 100);
    };

    atualizarTamanho();

    window.addEventListener(
      "resize",
      atualizarTamanho,
    );

    return () => {
      clearTimeout(timeout);

      window.removeEventListener(
        "resize",
        atualizarTamanho,
      );
    };
  }, [map]);

  /*
   * Ajusta o zoom de acordo com
   * os pontos/rota.
   */
  useEffect(() => {
    if (
      rota?.coordenadas.length
    ) {
      map.fitBounds(
        L.latLngBounds(
          rota.coordenadas,
        ),
        {
          padding: [30, 30],
        },
      );

      return;
    }

    const coordenadas = pontos
      .map(
        (ponto) =>
          ponto.latlng,
      )
      .filter(
        (
          valor,
        ): valor is [
          number,
          number,
        ] => Boolean(valor),
      );

    if (
      coordenadas.length === 1
    ) {
      map.setView(
        coordenadas[0],
        15,
      );

      return;
    }

    if (
      coordenadas.length > 1
    ) {
      map.fitBounds(
        L.latLngBounds(
          coordenadas,
        ),
        {
          padding: [30, 30],
          maxZoom: 15,
        },
      );
    }
  }, [
    map,
    pontos,
    rota,
  ]);

  return null;
}

// ======================================================
// PÁGINA
// ======================================================

function MapPage() {
  const { addToast } =
    useToast();

  const [
    pontos,
    setPontos,
  ] = useState<
    GeocodedPoint[]
  >([]);

  const [
    filtroTexto,
    setFiltroTexto,
  ] = useState("");

  const [
    modoFiltro,
    setModoFiltro,
  ] = useState<FiltroModo>(
    "todos",
  );

  const [
    camada,
    setCamada,
  ] = useState<CamadaMapa>(
    "mapa",
  );

  const [
    selectedPontos,
    setSelectedPontos,
  ] = useState<
    GeocodedPoint[]
  >([]);

  const [
    rota,
    setRota,
  ] =
    useState<RotaInfo | null>(
      null,
    );

  const [
    carregandoPontos,
    setCarregandoPontos,
  ] = useState(true);

  const [
    carregandoRota,
    setCarregandoRota,
  ] = useState(false);

  const [
    modalRotaAberta,
    setModalRotaAberta,
  ] = useState(false);

  // ====================================================
  // NORMALIZAÇÃO
  // ====================================================

  const normalizarPonto =
    useCallback(
      (
        ponto: PontoColetaAdmin,
        solicitacoes: SolicitacaoColeta[],
      ): GeocodedPoint => {
        const latlng =
          obterCoordenadasDoPonto(
            ponto,
          );

        const solicitacoesAtivas =
          solicitacoes.filter(
            (solicitacao) =>
              STATUS_ATIVOS.includes(
                solicitacao.status,
              ),
          );

        return {
          ...ponto,

          latlng:
            latlng ||
            undefined,

          geocodingError:
            !latlng,

          hasSolicitacaoAtiva:
            solicitacoesAtivas.length >
            0,

          solicitacoesAtivas,

          solicitacoes,
        };
      },
      [],
    );

  // ====================================================
  // CARREGAR TODOS OS PONTOS
  // ====================================================

  const carregarTodosOsPontos =
    useCallback(
      async (): Promise<
        PontoColetaAdmin[]
      > => {
        const limit = 100;

        let pagina = 1;

        let totalPages = 1;

        const todos: PontoColetaAdmin[] =
          [];

        do {
          const resposta =
            await adminPontosService.listarPontos(
              {
                page: pagina,
                limit,
              },
            );

          todos.push(
            ...resposta.items,
          );

          totalPages =
            resposta.totalPages;

          pagina++;
        } while (
          pagina <=
          totalPages
        );

        return todos;
      },
      [],
    );

  // ====================================================
  // CARREGAR TODAS AS SOLICITAÇÕES
  // ====================================================

  const carregarTodasSolicitacoes =
    useCallback(
      async (): Promise<
        SolicitacaoColeta[]
      > => {
        const limit = 100;

        let pagina = 1;

        let totalPages = 1;

        const todas: SolicitacaoColeta[] =
          [];

        do {
          const resposta =
            await adminSolicitacoesService.listar(
              {
                page: pagina,
                limit,
              },
            );

          todas.push(
            ...resposta.items,
          );

          totalPages =
            resposta.totalPages;

          pagina++;
        } while (
          pagina <=
          totalPages
        );

        return todas;
      },
      [],
    );

  // ====================================================
  // CARREGAR DADOS
  // ====================================================

  const carregarDados =
    useCallback(
      async () => {
        try {
          setCarregandoPontos(
            true,
          );

          const [
            todosPontos,
            todasSolicitacoes,
          ] =
            await Promise.all([
              carregarTodosOsPontos(),
              carregarTodasSolicitacoes(),
            ]);

          const solicitacoesPorPonto =
            todasSolicitacoes.reduce<
              Record<
                number,
                SolicitacaoColeta[]
              >
            >(
              (
                acumulador,
                solicitacao,
              ) => {
                const key =
                  solicitacao.pontoColetaId;

                if (
                  !acumulador[
                    key
                  ]
                ) {
                  acumulador[
                    key
                  ] = [];
                }

                acumulador[
                  key
                ].push(
                  solicitacao,
                );

                return acumulador;
              },
              {},
            );

          const pontosNormalizados =
            todosPontos.map(
              (ponto) =>
                normalizarPonto(
                  ponto,
                  solicitacoesPorPonto[
                    ponto.id
                  ] || [],
                ),
            );

          setPontos(
            pontosNormalizados,
          );

          const semCoordenadas =
            pontosNormalizados.filter(
              (ponto) =>
                !ponto.latlng,
            ).length;

          if (
            semCoordenadas >
            0
          ) {
            addToast(
              `${semCoordenadas} ponto(s) não possuem coordenadas válidas`,
              "warning",
            );
          }
        } catch (error) {
          console.error(
            "Erro ao carregar dados:",
            error,
          );

          setPontos([]);

          addToast(
            "Erro ao carregar dados",
            "error",
          );
        } finally {
          setCarregandoPontos(
            false,
          );
        }
      },
      [
        addToast,
        carregarTodosOsPontos,
        carregarTodasSolicitacoes,
        normalizarPonto,
      ],
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  // ====================================================
  // FILTROS
  // ====================================================

  const pontosFiltrados =
    useMemo(() => {
      let resultado =
        pontos;

      if (
        filtroTexto.trim()
      ) {
        const termo =
          filtroTexto
            .toLowerCase()
            .trim();

        resultado =
          resultado.filter(
            (ponto) => {
              const endereco = `
                ${ponto.logradouro},
                ${ponto.numero} -
                ${ponto.bairro},
                ${ponto.cidade}
                ${
                  ponto.estado ||
                  ""
                }
              `.toLowerCase();

              return (
                ponto.nomePontoColeta
                  .toLowerCase()
                  .includes(
                    termo,
                  ) ||
                ponto.parceiro?.razaoSocial
                  ?.toLowerCase()
                  .includes(
                    termo,
                  ) ||
                endereco.includes(
                  termo,
                )
              );
            },
          );
      }

      if (
        modoFiltro ===
        "apenas-solicitacoes"
      ) {
        return resultado.filter(
          (ponto) =>
            ponto.hasSolicitacaoAtiva,
        );
      }

      return resultado;
    }, [
      filtroTexto,
      pontos,
      modoFiltro,
    ]);

  const togglePontoSelecionado =
    (
      ponto: GeocodedPoint,
    ) => {
      if (!ponto.latlng) {
        addToast(
          "Ponto sem coordenadas disponíveis",
          "warning",
        );

        return;
      }

      setRota(null);

      setModalRotaAberta(
        false,
      );

      setSelectedPontos(
        (anteriores) => {
          const existe =
            anteriores.some(
              (item) =>
                item.id ===
                ponto.id,
            );

          if (existe) {
            return anteriores.filter(
              (item) =>
                item.id !==
                ponto.id,
            );
          }

          return [
            ...anteriores,
            ponto,
          ];
        },
      );
    };

  const tracarRota =
    async () => {
      const pontosValidos =
        selectedPontos.filter(
          (ponto) =>
            ponto.latlng,
        );

      if (
        pontosValidos.length <
        2
      ) {
        addToast(
          "Selecione pelo menos dois pontos para traçar a rota",
          "warning",
        );

        return;
      }

      setCarregandoRota(
        true,
      );

      try {
        const coordenadasStr =
          pontosValidos
            .map(
              (ponto) => {
                const [
                  lat,
                  lng,
                ] =
                  ponto.latlng as [
                    number,
                    number,
                  ];

                return `${lng},${lat}`;
              },
            )
            .join(";");

        const url =
          `https://router.project-osrm.org/route/v1/driving/${coordenadasStr}` +
          "?overview=full&geometries=geojson&steps=true";

        const response =
          await fetch(url);

        if (
          !response.ok
        ) {
          throw new Error(
            "Falha no serviço de rotas",
          );
        }

        const data =
          await response.json();

        if (
          data.code !==
            "Ok" ||
          !data.routes?.[0]
        ) {
          throw new Error(
            "Não foi possível calcular a rota",
          );
        }

        const route =
          data.routes[0];

        const rotaCoordenadas: [
          number,
          number,
        ][] =
          route.geometry.coordinates.map(
            (
              [
                lng,
                lat,
              ]: [
                number,
                number,
              ],
            ) => [
              lat,
              lng,
            ],
          );

        setRota({
          distanciaKm:
            route.distance /
            1000,

          duracaoMin:
            route.duration /
            60,

          coordenadas:
            rotaCoordenadas,

          pontosOrdenados:
            pontosValidos,
        });

        setModalRotaAberta(
          true,
        );
      } catch (error) {
        console.error(
          "Erro ao traçar rota:",
          error,
        );

        setRota(null);

        addToast(
          "Erro ao traçar rota",
          "error",
        );
      } finally {
        setCarregandoRota(
          false,
        );
      }
    };

  // ====================================================
  // LIMPAR ROTA
  // ====================================================

  const limparSelecao =
    () => {
      setSelectedPontos(
        [],
      );

      setRota(null);

      setModalRotaAberta(
        false,
      );
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-x-hidden">
      <AdminTopNav />

      {/* ================================================= */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ================================================= */}

      <main
        className="
          w-full
          max-w-[1440px]
          mx-auto
          flex-1
          min-w-0

          px-3
          py-4

          sm:px-4
          sm:py-5

          md:px-6
          lg:px-6
        "
      >
        {/* TÍTULO */}

        <div className="mb-4 sm:mb-6">
          <h1
            className="
              text-xl
              sm:text-2xl
              lg:text-3xl
              font-bold
              text-green-primary
              mt-1
              sm:mt-3
              lg:mt-5
              mb-1
            "
          >
            Mapa de Pontos de
            Coleta
          </h1>

          <p
            className="
              text-xs
              sm:text-sm
              md:text-base
              text-white-500
            "
          >
            Visualize todos os
            pontos de coleta e
            suas solicitações.
          </p>
        </div>

        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-3
            mb-4
            sm:mb-6

            xl:flex-row
            xl:items-center
          "
        >
          {/* BOTÕES DE FILTRO */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              flex-wrap
              gap-2
              w-full
              xl:w-auto
              min-w-0
            "
          >
            <div
              className="
                flex
                flex-wrap
                gap-1
                bg-white-primary
                rounded-lg
                border
                border-white-200
                p-1
                w-full
                sm:w-auto
              "
            >
              <button
                type="button"
                onClick={() =>
                  setModoFiltro(
                    "todos",
                  )
                }
                className={`
                  flex-1
                  sm:flex-none
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  cursor-pointer
                  whitespace-nowrap

                  ${
                    modoFiltro ===
                    "todos"
                      ? "bg-green-primary text-white"
                      : "text-white-600 hover:bg-white-100"
                  }
                `}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() =>
                  setModoFiltro(
                    "apenas-pontos",
                  )
                }
                className={`
                  flex-1
                  sm:flex-none
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  cursor-pointer
                  whitespace-nowrap

                  ${
                    modoFiltro ===
                    "apenas-pontos"
                      ? "bg-green-primary text-white"
                      : "text-white-600 hover:bg-white-100"
                  }
                `}
              >
                Pontos
              </button>

              <button
                type="button"
                onClick={() =>
                  setModoFiltro(
                    "apenas-solicitacoes",
                  )
                }
                className={`
                  flex-1
                  sm:flex-none
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  cursor-pointer
                  whitespace-nowrap

                  ${
                    modoFiltro ===
                    "apenas-solicitacoes"
                      ? "bg-green-primary text-white"
                      : "text-white-600 hover:bg-white-100"
                  }
                `}
              >
                Solicitações
              </button>
            </div>

            {/* CAMADA */}

            <div
              className="
                flex
                gap-1
                bg-white
                rounded-lg
                border
                border-white-200
                p-1
                w-full
                sm:w-auto
              "
            >
              <button
                type="button"
                onClick={() =>
                  setCamada(
                    "mapa",
                  )
                }
                className={`
                  flex-1
                  sm:flex-none
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  flex
                  items-center
                  justify-center
                  gap-1
                  cursor-pointer
                  whitespace-nowrap

                  ${
                    camada ===
                    "mapa"
                      ? "bg-green-primary text-white"
                      : "text-white-600 hover:bg-white-100"
                  }
                `}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />

                Mapa
              </button>

              <button
                type="button"
                onClick={() =>
                  setCamada(
                    "satelite",
                  )
                }
                className={`
                  flex-1
                  sm:flex-none
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  flex
                  items-center
                  justify-center
                  gap-1
                  cursor-pointer
                  whitespace-nowrap

                  ${
                    camada ===
                    "satelite"
                      ? "bg-green-primary text-white"
                      : "text-white-600 hover:bg-white-100"
                  }
                `}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />

                Satélite
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* PESQUISA */}
          {/* ================================================= */}

          <div
            className="
              flex-1
              flex
              flex-col
              md:flex-row
              items-stretch
              gap-2
              min-w-0
            "
          >
            <div className="relative flex-1 min-w-0">
              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-white-400
                  w-4
                  h-4
                  pointer-events-none
                "
              />

              <Input
                type="text"
                placeholder="Buscar por nome, parceiro ou endereço"
                value={
                  filtroTexto
                }
                onChange={(
                  event,
                ) =>
                  setFiltroTexto(
                    event.target
                      .value,
                  )
                }
                className="pl-10 w-full min-w-0"
              />
            </div>

            <Button
              type="button"
              variant="terciary"
              onClick={() =>
                void carregarDados()
              }
              disabled={
                carregandoPontos
              }
              className="
                w-full
                md:w-auto
                shrink-0
              "
            >
              {carregandoPontos ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Atualizar"
              )}
            </Button>
          </div>
        </div>

        {/* ================================================= */}
        {/* MAPA + PAINEL */}
        {/* ================================================= */}

        <div
          className="
            grid
            grid-cols-1

            xl:grid-cols-[minmax(0,1fr)_340px]

            2xl:grid-cols-[minmax(0,1fr)_380px]

            gap-4
            lg:gap-6

            w-full
            min-w-0
          "
        >
          {/* ================================================= */}
          {/* MAPA */}
          {/* ================================================= */}

          <div
            className="
              relative
              w-full
              min-w-0

              /* ============================================ */
              /* CORREÇÃO DO Z-INDEX                            */
              /* Cria um stacking context próprio e prende    */
              /* todos os z-index internos do Leaflet dentro  */
              /* deste container, evitando que o mapa fique   */
              /* por cima do menu lateral do AdminTopNav.     */
              /* ============================================ */
              isolate
              z-0

              h-[400px]
              xs:h-[430px]
              sm:h-[500px]
              md:h-[560px]
              lg:h-[620px]

              xl:h-[calc(100vh-250px)]
              xl:min-h-[560px]
              xl:max-h-[850px]

              rounded-xl
              sm:rounded-2xl

              overflow-hidden
              shadow-sm

              border
              border-white-200
            "
          >
            {carregandoPontos ? (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  flex-col
                  sm:flex-row
                  items-center
                  justify-center
                  gap-2
                  bg-white
                  z-[10]
                  p-4
                "
              >
                <Loader2 className="w-8 h-8 text-green-primary animate-spin" />

                <span className="text-sm text-white-600 text-center">
                  Carregando
                  dados...
                </span>
              </div>
            ) : (
              <MapContainer
                center={[
                  -15.2483,
                  -40.2481,
                ]}
                zoom={5}
                style={{
                  height:
                    "100%",
                  width:
                    "100%",
                }}
                zoomControl
                attributionControl
              >
                <TileLayer
                  url={
                    camada ===
                    "mapa"
                      ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  }
                  attribution={
                    camada ===
                    "mapa"
                      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      : '&copy; <a href="https://www.esri.com/">Esri</a>'
                  }
                >
                  {/* vazio */}
                </TileLayer>

                {/* PONTOS */}

                {pontosFiltrados.map(
                  (ponto) => {
                    if (
                      !ponto.latlng
                    ) {
                      return null;
                    }

                    const selecionado =
                      selectedPontos.some(
                        (
                          item,
                        ) =>
                          item.id ===
                          ponto.id,
                      );

                    return (
                      <Marker
                        key={
                          ponto.id
                        }
                        position={
                          ponto.latlng
                        }
                        icon={criarIcone(
                          ponto.statusAprovacaoPontoColeta,
                          ponto.hasSolicitacaoAtiva,
                          selecionado,
                        )}
                        eventHandlers={{
                          click:
                            () =>
                              togglePontoSelecionado(
                                ponto,
                              ),
                        }}
                      >
                        <Popup
                          maxWidth={
                            320
                          }
                          minWidth={
                            200
                          }
                        >
                          <div className="text-sm w-full max-w-[280px] break-words">
                            <strong className="block pr-2">
                              {
                                ponto.nomePontoColeta
                              }
                            </strong>

                            {ponto
                              .parceiro
                              ?.razaoSocial && (
                              <p className="mt-1 break-words">
                                Parceiro:{" "}
                                {
                                  ponto
                                    .parceiro
                                    .razaoSocial
                                }
                              </p>
                            )}

                            <p className="break-words">
                              {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${
                                ponto.estado
                                  ? ` - ${ponto.estado}`
                                  : ""
                              }`}
                            </p>

                            <p>
                              Capacidade:{" "}
                              {
                                ponto.capacidadeBombona
                              }{" "}
                              L
                            </p>

                            <p className="mt-1">
                              Status:{" "}
                              {
                                ponto.statusAprovacaoPontoColeta
                              }

                              {ponto.hasSolicitacaoAtiva && (
                                <span className="ml-1 text-xs text-blue-600 font-medium">
                                  (com
                                  solicitação
                                  ativa)
                                </span>
                              )}
                            </p>

                            {/* SOLICITAÇÕES ATIVAS */}

                            {ponto
                              .solicitacoesAtivas
                              .length >
                              0 && (
                              <div className="mt-2 pt-2 border-t border-white-200">
                                <p className="text-xs font-bold text-white-600">
                                  Solicitações
                                  ativas (
                                  {
                                    ponto
                                      .solicitacoesAtivas
                                      .length
                                  }
                                  )
                                </p>

                                <ul className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                                  {ponto.solicitacoesAtivas
                                    .slice(
                                      0,
                                      3,
                                    )
                                    .map(
                                      (
                                        solicitacao,
                                      ) => (
                                        <li
                                          key={
                                            solicitacao.id
                                          }
                                          className="
                                            text-xs
                                            bg-white-50
                                            p-1
                                            rounded
                                            flex
                                            flex-wrap
                                            justify-between
                                            items-center
                                            gap-1
                                          "
                                        >
                                          <span>
                                            #
                                            {
                                              solicitacao.id
                                            }
                                          </span>

                                          <StatusBadge
                                            status={
                                              solicitacao.status
                                            }
                                          />
                                        </li>
                                      ),
                                    )}
                                </ul>
                              </div>
                            )}

                            {/* HISTÓRICO */}

                            {ponto
                              .solicitacoes
                              .length >
                              ponto
                                .solicitacoesAtivas
                                .length && (
                              <div className="mt-2 pt-2 border-t border-white-200">
                                <p className="text-xs text-white-400">
                                  {ponto
                                    .solicitacoes
                                    .length -
                                    ponto
                                      .solicitacoesAtivas
                                      .length}{" "}
                                  solicitação(ões)
                                  concluída(s)
                                </p>
                              </div>
                            )}

                            <button
                              type="button"
                              className="
                                mt-2
                                rounded
                                bg-green-600
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-white
                                hover:bg-green-700
                                w-full
                                cursor-pointer
                              "
                              onClick={(
                                event,
                              ) => {
                                event.stopPropagation();

                                togglePontoSelecionado(
                                  ponto,
                                );
                              }}
                            >
                              {selecionado
                                ? "Remover da rota"
                                : "Adicionar à rota"}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  },
                )}

                {/* ROTA */}

                {rota
                  ?.coordenadas
                  .length ? (
                  <Polyline
                    positions={
                      rota.coordenadas
                    }
                    pathOptions={{
                      color:
                        "#4CAF50",
                      weight: 6,
                      opacity:
                        0.8,
                    }}
                  />
                ) : null}

                <MapController
                  rota={rota}
                  pontos={
                    pontosFiltrados
                  }
                />
              </MapContainer>
            )}

            {/* ================================================= */}
            {/* LEGENDA */}
            {/* ================================================= */}

            <div
              className="
                absolute

                top-2
                right-2

                sm:top-3
                sm:right-3

                bg-white/95
                backdrop-blur-xs

                rounded-lg
                shadow-md

                p-2
                sm:p-2.5

                z-[10]

                text-[10px]
                sm:text-xs

                max-w-[150px]
                sm:max-w-[220px]
              "
            >
              <h3 className="font-bold mb-1.5">
                Legenda
              </h3>

              {modoFiltro ===
              "apenas-solicitacoes" ? (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 shrink-0" />

                    <span>
                      Com
                      solicitação
                      ativa
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />

                    <span>
                      Aprovado
                      (sem
                      solicitação)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />

                    <span>
                      Aprovado
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 shrink-0" />

                    <span>
                      Com
                      solicitação
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 shrink-0" />

                    <span>
                      Pendente
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shrink-0" />

                    <span>
                      Rejeitado
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* PAINEL LATERAL / INFERIOR */}
          {/* ================================================= */}

          <div
            className="
              w-full
              min-w-0

              flex
              flex-col

              md:grid
              md:grid-cols-2

              xl:flex
              xl:flex-col

              gap-4
            "
          >
            {/* ================================================= */}
            {/* PONTOS ENCONTRADOS */}
            {/* ================================================= */}

            <div
              className="
                bg-white
                rounded-xl
                shadow-sm

                p-3
                sm:p-4

                border
                border-white-200

                overflow-y-auto

                max-h-[350px]

                md:max-h-[400px]

                xl:max-h-[calc(100vh-480px)]
                xl:min-h-[300px]

                min-w-0
              "
            >
              <h2 className="font-bold text-white-600 mb-2 text-sm sm:text-base">
                Pontos
                encontrados (
                {
                  pontosFiltrados.length
                }
                )
              </h2>

              <ul className="space-y-2">
                {pontosFiltrados.map(
                  (ponto) => {
                    const selecionado =
                      selectedPontos.some(
                        (
                          item,
                        ) =>
                          item.id ===
                          ponto.id,
                      );

                    return (
                      <li
                        key={
                          ponto.id
                        }
                        className={`
                          flex
                          justify-between
                          items-start
                          gap-2

                          p-2.5

                          rounded-lg

                          transition-colors

                          min-w-0

                          ${
                            selecionado
                              ? "bg-green-50 border border-green-200"
                              : "hover:bg-white-50 border border-transparent"
                          }

                          cursor-pointer
                        `}
                        onClick={() =>
                          togglePontoSelecionado(
                            ponto,
                          )
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {
                              ponto.nomePontoColeta
                            }
                          </p>

                          <p className="text-xs text-white-500 truncate">
                            {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`}
                          </p>

                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-1.5
                              mt-1.5
                            "
                          >
                            {modoFiltro ===
                            "apenas-solicitacoes" ? (
                              ponto
                                .solicitacoesAtivas
                                .length >
                              0 ? (
                                <StatusBadge
                                  status={
                                    ponto
                                      .solicitacoesAtivas[0]
                                      .status
                                  }
                                />
                              ) : (
                                <span className="text-xs bg-white-100 text-white-600 px-2 py-0.5 rounded-full">
                                  Sem
                                  solicitação
                                  ativa
                                </span>
                              )
                            ) : (
                              <>
                                <span
                                  className={`
                                    text-xs
                                    px-2
                                    py-0.5
                                    rounded-full
                                    font-medium

                                    ${
                                      ponto.statusAprovacaoPontoColeta ===
                                      "APROVADO"
                                        ? "bg-green-100 text-green-700"
                                        : ponto.statusAprovacaoPontoColeta ===
                                            "PENDENTE"
                                          ? "bg-orange-100 text-orange-600"
                                          : "bg-red-100 text-red-700"
                                    }
                                  `}
                                >
                                  {
                                    ponto.statusAprovacaoPontoColeta
                                  }
                                </span>

                                {ponto.hasSolicitacaoAtiva && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    {
                                      ponto
                                        .solicitacoesAtivas
                                        .length
                                    }{" "}
                                    ativa(s)
                                  </span>
                                )}
                              </>
                            )}

                            {!ponto.latlng && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                Sem
                                coordenadas
                              </span>
                            )}
                          </div>
                        </div>

                        {selecionado && (
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-1" />
                        )}
                      </li>
                    );
                  },
                )}

                {!pontosFiltrados.length && (
                  <li className="text-center text-white-500 text-sm py-6">
                    Nenhum ponto
                    encontrado
                  </li>
                )}
              </ul>
            </div>

            {/* ================================================= */}
            {/* PONTOS NA ROTA */}
            {/* ================================================= */}

            <div
              className="
                bg-white
                rounded-xl
                shadow-sm

                p-3
                sm:p-4

                border
                border-white-200

                min-w-0
              "
            >
              <h2 className="font-bold text-white-600 mb-2 text-sm sm:text-base">
                Pontos na rota (
                {
                  selectedPontos.length
                }
                )
              </h2>

              {selectedPontos.length ? (
                <ul
                  className="
                    space-y-2
                    mb-4
                    max-h-40
                    xl:max-h-[220px]
                    overflow-y-auto
                    pr-1
                  "
                >
                  {selectedPontos.map(
                    (
                      ponto,
                      index,
                    ) => (
                      <li
                        key={
                          ponto.id
                        }
                        className="
                          flex
                          items-center
                          gap-2

                          text-sm

                          bg-white-50

                          p-1.5

                          rounded-md

                          min-w-0
                        "
                      >
                        <span
                          className="
                            bg-green-primary
                            text-white

                            w-5
                            h-5

                            rounded-full

                            flex
                            items-center
                            justify-center

                            text-xs
                            font-bold

                            shrink-0
                          "
                        >
                          {index +
                            1}
                        </span>

                        <span className="flex-1 truncate min-w-0">
                          {
                            ponto.nomePontoColeta
                          }
                        </span>

                        <button
                          type="button"
                          aria-label={`Remover ${ponto.nomePontoColeta} da rota`}
                          onClick={() =>
                            togglePontoSelecionado(
                              ponto,
                            )
                          }
                          className="
                            text-red-400
                            hover:text-red-600

                            cursor-pointer

                            p-1

                            shrink-0
                          "
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="text-sm text-white-400 mb-4">
                  Clique em um
                  ponto para
                  adicioná-lo à
                  rota.
                </p>
              )}

              {/* BOTÕES */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  md:flex-col
                  lg:flex-row
                  xl:flex-col
                  2xl:flex-row
                  gap-2
                "
              >
                <Button
                  onClick={
                    tracarRota
                  }
                  disabled={
                    selectedPontos.length <
                      2 ||
                    carregandoRota
                  }
                  variant="primary"
                  fullWidth
                >
                  {carregandoRota ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />

                      Calculando...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2 shrink-0" />

                      Traçar Rota
                    </>
                  )}
                </Button>

                <Button
                  onClick={
                    limparSelecao
                  }
                  variant="secondary"
                  disabled={
                    !selectedPontos.length &&
                    !rota
                  }
                  className="
                    w-full
                    sm:w-auto
                    md:w-full
                    lg:w-auto
                    xl:w-full
                    2xl:w-auto
                    shrink-0
                  "
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================= */}
      {/* MODAL RESUMO DA ROTA */}
      {/* ================================================= */}

      {modalRotaAberta &&
        rota && (
          <div
            className="
              fixed
              inset-0

              bg-black/50
              backdrop-blur-xs

              flex
              items-center
              justify-center

              z-[2000]

              p-2
              sm:p-4
            "
            onClick={() =>
              setModalRotaAberta(
                false,
              )
            }
          >
            <div
              className="
                bg-white

                rounded-xl
                sm:rounded-2xl

                shadow-2xl

                w-full
                max-w-lg

                p-4
                sm:p-6

                relative

                max-h-[95dvh]
                sm:max-h-[90dvh]

                overflow-y-auto
              "
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              {/* FECHAR */}

              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() =>
                  setModalRotaAberta(
                    false,
                  )
                }
                className="
                  absolute
                  top-3
                  right-3

                  sm:top-4
                  sm:right-4

                  text-white-400
                  hover:text-white-600

                  cursor-pointer

                  p-1

                  z-10
                "
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* TÍTULO */}

              <h2
                className="
                  text-lg
                  sm:text-xl
                  md:text-2xl

                  font-bold

                  text-green-700

                  mb-4

                  flex
                  items-center
                  gap-2

                  pr-10
                "
              >
                <Navigation className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />

                Resumo da Rota
              </h2>

              {/* ================================================= */}
              {/* RESUMO */}
              {/* ================================================= */}

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2

                  gap-3
                  sm:gap-4

                  mb-6
                "
              >
                <div className="bg-white-50 rounded-lg p-3 min-w-0">
                  <span className="text-xs sm:text-sm text-white-500">
                    Distância
                    total
                  </span>

                  <p className="text-lg sm:text-xl font-bold text-white-800 break-words">
                    {rota.distanciaKm.toFixed(
                      2,
                    )}{" "}
                    km
                  </p>
                </div>

                <div className="bg-white-50 rounded-lg p-3 min-w-0">
                  <span className="text-xs sm:text-sm text-white-500">
                    Tempo
                    estimado
                  </span>

                  <p className="text-lg sm:text-xl font-bold text-white-800 break-words">
                    {Math.round(
                      rota.duracaoMin,
                    )}{" "}
                    min
                  </p>
                </div>
              </div>

              {/* ================================================= */}
              {/* ORDEM */}
              {/* ================================================= */}

              <h3 className="font-semibold text-white-600 mb-2 text-sm sm:text-base">
                Ordem de
                passagem (
                {
                  rota
                    .pontosOrdenados
                    .length
                }{" "}
                pontos)
              </h3>

              <ol
                className="
                  space-y-3

                  mb-6

                  max-h-[40vh]
                  sm:max-h-60

                  overflow-y-auto

                  pr-1
                "
              >
                {rota.pontosOrdenados.map(
                  (
                    ponto,
                    index,
                  ) => (
                    <li
                      key={
                        ponto.id
                      }
                      className="
                        flex
                        gap-3
                        items-start

                        min-w-0
                      "
                    >
                      <span
                        className="
                          bg-green-primary
                          text-white

                          w-6
                          h-6

                          rounded-full

                          flex
                          items-center
                          justify-center

                          text-xs
                          font-bold

                          shrink-0

                          mt-0.5
                        "
                      >
                        {index +
                          1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-white-800 break-words">
                          {
                            ponto.nomePontoColeta
                          }
                        </p>

                        <p className="text-xs sm:text-sm text-white-500 break-words">
                          {`${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}${
                            ponto.estado
                              ? ` - ${ponto.estado}`
                              : ""
                          }`}
                        </p>
                      </div>
                    </li>
                  ),
                )}
              </ol>

              {/* ================================================= */}
              {/* BOTÕES DO MODAL */}
              {/* ================================================= */}

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row

                  justify-end

                  gap-2
                "
              >
                <Button
                  onClick={() =>
                    setModalRotaAberta(
                      false,
                    )
                  }
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Fechar
                </Button>

                <Button
                  onClick={() => {
                    limparSelecao();

                    setModalRotaAberta(
                      false,
                    );
                  }}
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
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