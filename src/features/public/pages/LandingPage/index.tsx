import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import HeaderPublic from "../../../../components/layout/HeaderPublic"
import Button from "../../../../components/ui/Button"

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

type TileStyle = 'standard' | 'satellite'

const TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
  }
}

interface PontoColeta {
  id: string | number
  nome: string
  endereco: string
  lat: number
  lng: number
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 })
  }, [center, map])
  return null
}

export default function LandingPage() {
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false)

  const [currentTile, setCurrentTile] = useState<TileStyle>('standard')
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false)

  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.2483, -40.2481])
  
  const [pontos, setPontos] = useState<PontoColeta[]>([
    {
      id: "initial-1",
      nome: "Ponto Américo Nogueira",
      endereco: "Américo Nogueira - Itapetinga, BA",
      lat: -15.2483,
      lng: -40.2481,
    },
  ])

  useEffect(() => {
    const pontosSalvos = localStorage.getItem("pontosColeta")
    if (pontosSalvos) {
      try {
        const parsed: PontoColeta[] = JSON.parse(pontosSalvos)
        setPontos((prev) => [...prev, ...parsed])
      } catch (err) {
        console.error("Erro ao carregar pontos do localStorage", err)
      }
    }
  }, [])

  const handleSearchNominatim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
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
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setMapCenter([parseFloat(lat), parseFloat(lon)])
      } else {
        alert("Endereço não encontrado. Tente buscar com mais detalhes.")
      }
    } catch (error) {
      console.error("Erro na busca do Nominatim:", error)
      alert("Erro ao conectar com o serviço de busca de endereços.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          alert("Não foi possível obter sua localização exata.")
        }
      )
    }
  }

  const handleAddPointClick = () => {
    setIsAddPointModalOpen(true)
    setIsMenuOpen(false)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-background">
      <HeaderPublic />

      <main className="flex-1 relative w-full h-full">
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
              placeholder="Buscar por nome ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-black-200 outline-none placeholder-black-100"
            />
          </div>
        </form>

        <MapContainer
          center={mapCenter}
          zoom={15}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <MapController center={mapCenter} />

          <TileLayer
            key={currentTile}
            attribution={TILE_LAYERS[currentTile].attribution}
            url={TILE_LAYERS[currentTile].url}
          />

          {pontos.map((ponto) => (
            <Marker
              key={ponto.id}
              position={[ponto.lat, ponto.lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-green-primary text-sm">{ponto.nome}</h3>
                  <p className="text-xs text-white-600 mt-1">{ponto.endereco}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

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

        {isAddPointModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsAddPointModalOpen(false)} />

            <div className="relative w-full bg-white rounded-t-[32px] sm:rounded-[32px] px-6 sm:px-8 pt-4 sm:pt-8 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-w-4xl mx-auto">
              
              <div 
                onClick={() => setIsAddPointModalOpen(false)}
                className="w-12 h-1.5 bg-white-300 rounded-full mx-auto mb-5 sm:hidden cursor-pointer hover:bg-white-400 transition-colors"
                title="Fechar"
              />

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

              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/register")}
                >
                  Criar Conta
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/login")}
                >
                  Entrar na minha conta
                </Button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}