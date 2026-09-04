import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import HeaderPublic from "../../../../components/layout/HeaderPublic";
import Button from "../../../../components/ui/Button";
import { publicPontosService, type PontoColetaPublico } from "../../../../services/pontosColetaService";

// Ícone customizado para o mapa
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type TileStyle = 'standard' | 'satellite';

const TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
  }
};

// ============================================
// CATEGORIAS CORRETAS DO BACKEND
// ============================================
type CategoriaPontoColeta = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Mapeamento por número
const CATEGORIA_MAP: Record<CategoriaPontoColeta, { label: string; icon: string; color: string }> = {
  1: { label: "Cozinha Industrial", icon: "🍳", color: "#E67E22" },
  2: { label: "Empresa / Indústria", icon: "🏭", color: "#2C3E50" },
  3: { label: "Escola / Universidade", icon: "🏫", color: "#2980B9" },
  4: { label: "Hotel / Pousada", icon: "🏨", color: "#8E44AD" },
  5: { label: "Restaurante / Bar", icon: "🍽️", color: "#E74C3C" },
  6: { label: "Condomínio", icon: "🏢", color: "#16A085" },
  7: { label: "Feira Livre / Eventos", icon: "🎪", color: "#F39C12" },
  8: { label: "Doador Avulso", icon: "🙋", color: "#1ABC9C" },
};

// Mapeamento reverso: label -> número
const CATEGORIA_LABEL_TO_NUMBER: Record<string, CategoriaPontoColeta> = {
  "Cozinha Industrial": 1,
  "Empresa / Indústria": 2,
  "Escola / Universidade": 3,
  "Hotel / Pousada": 4,
  "Restaurante / Bar": 5,
  "Condomínio": 6,
  "Feira Livre / Eventos": 7,
  "Doador Avulso": 8,
};

// Função para obter categoria a partir do número OU label
const getCategoriaInfo = (categoria: string | number) => {
  // Se for string, tenta converter pelo label
  if (typeof categoria === 'string') {
    const num = CATEGORIA_LABEL_TO_NUMBER[categoria];
    if (num) {
      return CATEGORIA_MAP[num];
    }
    // Se não encontrar, retorna o default (Doador Avulso)
    return CATEGORIA_MAP[8];
  }
  
  // Se for número, usa diretamente
  return CATEGORIA_MAP[categoria as CategoriaPontoColeta] || CATEGORIA_MAP[8];
};

// Função para obter o número da categoria (normaliza)
const getCategoriaNumero = (categoria: string | number): CategoriaPontoColeta => {
  if (typeof categoria === 'string') {
    return CATEGORIA_LABEL_TO_NUMBER[categoria] || 8;
  }
  return categoria as CategoriaPontoColeta;
};

// Estender o tipo PontoColetaPublico com campos calculados
interface EstabelecimentoCompleto extends PontoColetaPublico {
  categoriaInfo: { label: string; icon: string; color: string };
  categoriaNumero: CategoriaPontoColeta;
}

// Componente para controlar o mapa
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function LandingPageEstabelecimentos() {
  const navigate = useNavigate();
  
  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [currentTile, setCurrentTile] = useState<TileStyle>('standard');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.2483, -40.2481]);
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoCompleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaPontoColeta | "TODAS">("TODAS");
  const [erro, setErro] = useState<string | null>(null);

  // Função para carregar estabelecimentos da API pública
  const carregarEstabelecimentos = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await publicPontosService.listarPontosPublicos({
        limit: 100,
      });

      // Processa e enriquece os dados
      const estabelecimentosProcessados: EstabelecimentoCompleto[] = response.items.map((ponto) => {
        const categoriaNumero = getCategoriaNumero(ponto.categoria);
        return {
          ...ponto,
          categoriaInfo: getCategoriaInfo(ponto.categoria),
          categoriaNumero,
        };
      });

      setEstabelecimentos(estabelecimentosProcessados);

      // Se tiver pontos, centraliza o mapa no primeiro com coordenadas
      if (estabelecimentosProcessados.length > 0) {
        const primeiroComCoordenadas = estabelecimentosProcessados.find(
          e => e.localizacao
        );
        if (primeiroComCoordenadas?.localizacao) {
          setMapCenter([
            primeiroComCoordenadas.localizacao.latitude,
            primeiroComCoordenadas.localizacao.longitude,
          ]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos:", error);
      setErro("Não foi possível carregar os estabelecimentos. Tente novamente mais tarde.");
      setEstabelecimentos([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEstabelecimentos();
  }, []);

  // Filtros
  const estabelecimentosFiltrados = useMemo(() => {
    let resultado = estabelecimentos;

    // Filtro por texto (nome, endereço)
    if (searchQuery.trim()) {
      const termo = searchQuery.toLowerCase().trim();
      resultado = resultado.filter((item) => {
        const endereco = `${item.endereco.logradouro || ""} ${item.endereco.numero || ""} ${item.endereco.bairro || ""} ${item.endereco.cidade || ""} ${item.endereco.estado || ""}`.toLowerCase();
        return (
          item.nomePontoColeta.toLowerCase().includes(termo) ||
          endereco.includes(termo)
        );
      });
    }

    // Filtro por categoria (usando o número normalizado)
    if (categoriaFiltro !== "TODAS") {
      resultado = resultado.filter((item) => {
        return item.categoriaNumero === categoriaFiltro;
      });
    }

    return resultado;
  }, [estabelecimentos, searchQuery, categoriaFiltro]);

  // Busca por endereço
  const handleSearchNominatim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "OleoCircularApp/1.0"
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert("Endereço não encontrado. Tente buscar com mais detalhes.");
      }
    } catch (error) {
      console.error("Erro na busca do Nominatim:", error);
      alert("Erro ao conectar com o serviço de busca de endereços.");
    } finally {
      setIsSearching(false);
    }
  };

  // Geolocalização
  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          alert("Não foi possível obter sua localização exata.");
        }
      );
    }
  };

  // Contagem por categoria
  const contagemCategorias = useMemo(() => {
    const contagem: Record<number, number> = {};
    
    estabelecimentos.forEach((item) => {
      const cat = item.categoriaNumero;
      contagem[cat] = (contagem[cat] || 0) + 1;
    });

    return contagem;
  }, [estabelecimentos]);

  // Abrir modal de adicionar ponto
  const handleAddPointClick = () => {
    setIsAddPointModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-background">
      <HeaderPublic />

      <main className="flex-1 relative w-full h-full">
        {/* Barra de Busca */}
        <form 
          onSubmit={handleSearchNominatim}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[92%] sm:w-full max-w-md px-2 sm:px-0"
        >
          <div className="flex items-center bg-white rounded-2xl shadow-lg px-4 py-2.5 sm:py-3 border border-white-100">
            <button type="submit" disabled={isSearching} className="mr-2.5 text-white-500 hover:text-green-primary transition-colors">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
            <input
              type="text"
              placeholder="Buscar por nome, endereço ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-black-200 outline-none placeholder-black-100"
            />
          </div>
        </form>

        {/* Mapa */}
        <MapContainer
          center={mapCenter}
          zoom={14}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <MapController center={mapCenter} />

          <TileLayer
            key={currentTile}
            attribution={TILE_LAYERS[currentTile].attribution}
            url={TILE_LAYERS[currentTile].url}
          />

          {estabelecimentosFiltrados.map((estabelecimento) => {
            if (!estabelecimento.localizacao) return null;
            
            const { latitude, longitude } = estabelecimento.localizacao;
            const { icon, color, label } = estabelecimento.categoriaInfo;
            
            // Ícone customizado por categoria
            const categoriaIcon = L.divIcon({
              html: `
                <div style="
                  background-color: ${color};
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 18px;
                ">
                  ${icon}
                </div>
              `,
              className: "",
              iconSize: [36, 36],
              iconAnchor: [18, 36],
              popupAnchor: [0, -36],
            });

            return (
              <Marker
                key={estabelecimento.id}
                position={[Number(latitude), Number(longitude)]}
                icon={categoriaIcon}
              >
                <Popup className="max-w-xs">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <h3 className="font-bold text-green-primary text-base">
                        {estabelecimento.nomePontoColeta}
                      </h3>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <p className="flex items-start gap-2">
                        <span className="text-white-400 shrink-0">🏢</span>
                        <span className="text-white-600">
                          <span className="font-medium">Categoria:</span> {label}
                        </span>
                      </p>

                      <p className="flex items-start gap-2">
                        <span className="text-white-400 shrink-0">📍</span>
                        <span className="text-white-600 text-xs">
                          {estabelecimento.endereco.logradouro}, {estabelecimento.endereco.numero}<br />
                          {estabelecimento.endereco.bairro}, {estabelecimento.endereco.cidade} {estabelecimento.endereco.estado || ""}
                        </span>
                      </p>

                      
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Botões de Controle do Mapa */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 z-[1000] flex flex-col gap-2.5 sm:gap-3">
          <button
            onClick={handleGeoLocation}
            type="button"
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-teal-50 rounded-full flex items-center justify-center shadow-lg border border-white-100 cursor-pointer active:scale-95 transition-all"
            title="Minha Localização"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Seletor de Camada */}
          <div className="relative">
            {isLayerMenuOpen && (
              <div className="absolute bottom-14 sm:bottom-16 left-0 bg-white rounded-2xl shadow-xl p-2 border border-white-100 flex flex-col gap-1.5 w-40 sm:w-44 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => { setCurrentTile('standard'); setIsLayerMenuOpen(false); }}
                  className={`flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-colors ${
                    currentTile === 'standard' ? 'bg-teal-50 text-teal-primary font-bold' : 'hover:bg-teal-100 text-black-200 font-medium'
                  }`}
                >
                  <img 
                    src="/assets/padrao.png" 
                    alt="Mapa Padrão" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-black-100/10 shrink-0"
                  />
                  <span className="text-xs">Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCurrentTile('satellite'); setIsLayerMenuOpen(false); }}
                  className={`flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-colors ${
                    currentTile === 'satellite' ? 'bg-teal-50 text-teal-primary font-bold' : 'hover:bg-teal-100 text-black-200 font-medium'
                  }`}
                >
                  <img 
                    src="/assets/satelite.png" 
                    alt="Mapa Satélite" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-black-100/10 shrink-0"
                  />
                  <span className="text-xs">Satélite</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsLayerMenuOpen((prev) => !prev)}
              type="button"
              className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-primary hover:bg-teal-hover rounded-full flex items-center justify-center shadow-lg text-white cursor-pointer active:scale-95 transition-all"
              title="Escolher Camada do Mapa"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>
        </div>

        {/* LEGENDA DE CATEGORIAS - Desktop */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[90%] max-h-[40vh] overflow-y-auto border border-white-200 hidden sm:block">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-white-600 mr-1">Categorias:</span>
            <button
              onClick={() => setCategoriaFiltro("TODAS")}
              className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                categoriaFiltro === "TODAS"
                  ? "bg-green-primary text-white font-bold"
                  : "bg-white-100 text-white-600 hover:bg-white-200"
              }`}
            >
              Todas ({estabelecimentos.length})
            </button>
            {Object.entries(CATEGORIA_MAP).map(([key, config]) => {
              const numKey = parseInt(key) as CategoriaPontoColeta;
              const count = contagemCategorias[numKey] || 0;
              if (count === 0) return null;
              
              return (
                <button
                  key={key}
                  onClick={() => setCategoriaFiltro(numKey)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                    categoriaFiltro === numKey
                      ? "text-white font-bold"
                      : "bg-white-100 text-white-600 hover:bg-white-200"
                  }`}
                  style={categoriaFiltro === numKey ? { backgroundColor: config.color } : {}}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Versão mobile da legenda */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 max-w-[92%] overflow-x-auto border border-white-200 sm:hidden flex items-center gap-1">
          <button
            onClick={() => setCategoriaFiltro("TODAS")}
            className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
              categoriaFiltro === "TODAS"
                ? "bg-green-primary text-white font-bold"
                : "bg-white-100 text-white-600"
            }`}
          >
            Todas
          </button>
          {Object.entries(CATEGORIA_MAP).map(([key, config]) => {
            const numKey = parseInt(key) as CategoriaPontoColeta;
            const count = contagemCategorias[numKey] || 0;
            if (count === 0) return null;
            
            return (
              <button
                key={key}
                onClick={() => setCategoriaFiltro(numKey)}
                className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5 ${
                  categoriaFiltro === numKey
                    ? "text-white font-bold"
                    : "bg-white-100 text-white-600"
                }`}
                style={categoriaFiltro === numKey ? { backgroundColor: config.color } : {}}
              >
                <span>{config.icon}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Botões Flutuantes Direita */}
        <div className="absolute bottom-4 sm:bottom-6 right-4 z-[1002] flex flex-col gap-2.5 sm:gap-3 items-end">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-teal-50 rounded-full flex items-center justify-center shadow-lg border border-white-100 text-teal-primary cursor-pointer active:scale-95 transition-all"
            title="Menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={handleAddPointClick}
            type="button"
            className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-primary hover:bg-teal-hover rounded-full flex items-center justify-center shadow-xl text-white cursor-pointer active:scale-95 transition-all"
            title="Adicionar Ponto"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>

        {/* Menu Lateral */}
        {isMenuOpen && (
          <div className="absolute bottom-[140px] sm:bottom-[160px] right-4 z-[1001] w-64 sm:w-72 bg-white rounded-[24px] sm:rounded-[28px] shadow-xl p-4 sm:p-6 border border-white-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span className="text-[10px] sm:text-xs font-bold text-white-600 tracking-wider uppercase px-1 mb-3 sm:mb-4 block">
              MENU
            </span>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button
                  onClick={() => navigate("/sobre")}
                  className="w-full flex items-center gap-3 p-1.5 sm:p-2 rounded-2xl hover:bg-green-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                    <img src="/assets/icons/icon-info2.svg" alt="Sobre" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-black-200">Sobre o aplicativo</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/privacidade")}
                  className="w-full flex items-center gap-3 p-1.5 sm:p-2 rounded-2xl hover:bg-green-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                    <img src="/assets/icons/icon-privacidade.svg" alt="Privacidade" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-black-200">Política de Privacidade</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/termos")}
                  className="w-full flex items-center gap-3 p-1.5 sm:p-2 rounded-2xl hover:bg-green-50 bg-green-50/40 text-left transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                    <img src="/assets/icons/icon-termos.svg" alt="Termos" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-black-200">Termos de uso</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Modal de Adicionar Ponto */}
        {isAddPointModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsAddPointModalOpen(false)} />
            <div className="relative w-full max-w-none bg-white rounded-t-[32px] sm:rounded-t-[36px] rounded-b-none px-6 sm:px-12 md:px-16 pt-5 sm:pt-8 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
              <div 
                onClick={() => setIsAddPointModalOpen(false)}
                className="w-12 h-1.5 bg-white-300 rounded-full mx-auto mb-6 cursor-pointer hover:bg-white-400 transition-colors"
                title="Fechar"
              />
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-4 sm:mb-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                    <img src="/assets/icons/ponto-de-coleta.svg" alt="Ícone Ponto" className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black-primary leading-tight">
                      Faça parte do mapa!
                    </h2>
                    <p className="text-xs sm:text-sm text-black-200 mt-0.5">
                      Junte-se à nossa comunidade.
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-black-200 mb-6 leading-relaxed">
                  Para adicionar novos pontos de coleta e ajudar as pessoas a descartarem o óleo corretamente, é necessário ter uma conta. É rápido e 100% gratuito!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="primary" size="md" onClick={() => navigate("/register")} fullWidth>
                    Criar Conta
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => navigate("/login")} fullWidth>
                    Entrar na minha conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de Carregamento */}
        {carregando && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-green-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white-600">Carregando estabelecimentos...</span>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {erro && !carregando && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
              <span className="text-4xl mb-3 block">😕</span>
              <h3 className="text-lg font-bold text-red-600 mb-2">Ops! Algo deu errado</h3>
              <p className="text-sm text-white-600">{erro}</p>
              <button
                onClick={carregarEstabelecimentos}
                className="mt-4 px-4 py-2 bg-green-primary text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}