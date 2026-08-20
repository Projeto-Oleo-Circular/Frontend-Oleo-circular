import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import ProgressBar from "../../../../components/ui/ProgressBar"
import { authService } from "../../../../services/authService"

interface CategoriaOpcao {
  id: number
  nome: string
  src: string
}

// 1. Mapeamento exato das categorias divididas por Perfil
const CATEGORIAS_POR_PERFIL: Record<string, CategoriaOpcao[]> = {
  INSTITUCIONAL: [
    { id: 1, nome: "Cozinha Industrial", src: "/assets/icons/icon-cozinha.svg" },
    { id: 2, nome: "Empresa / Indústria", src: "/assets/icons/icon-empresa.svg" },
    { id: 3, nome: "Escola / Universidade", src: "/assets/icons/icon-boina.svg" },
    { id: 4, nome: "Hotel / Pousada", src: "/assets/icons/icon-hotel2.svg" },
    { id: 5, nome: "Restaurante / Bar", src: "/assets/icons/icon-soup.svg" },
  ],
  COMUNITARIO: [
    { id: 6, nome: "Condomínio / Casa residencial", src: "/assets/icons/icon-condominio.svg" },
    { id: 7, nome: "Feira Livre / Eventos", src: "/assets/icons/icon-soup.svg" },
  ],
  SOLIDARIO: [
    { id: 8, nome: "Doador Avulso", src: "/assets/icons/icon-soup.svg" },
  ]
}

// 2. Normalizador flexível para converter respostas do backend/estado para a chave do objeto
const normalizeProfileKey = (rawProfile?: string): string => {
  if (!rawProfile) return "INSTITUCIONAL"

  const formatted = rawProfile.toString().trim().toUpperCase()

  // Se o backend/cadastro utilizar "GERADOR", mapeie aqui para a categoria correspondente (ex: SOLIDARIO ou COMUNITARIO)
  if (formatted.includes("SOLIDAR") || formatted === "SOLIDARIO" || formatted === "SOLIDÁRIO") {
    return "SOLIDARIO"
  }
  if (formatted.includes("COMUNITAR") || formatted === "COMUNITARIO" || formatted === "COMUNITÁRIO") {
    return "COMUNITARIO"
  }
  if (formatted.includes("INSTITUCION") || formatted === "INSTITUCIONAL") {
    return "INSTITUCIONAL"
  }

  // Fallback padrão
  return "INSTITUCIONAL"
}

export default function RegisterPoint() {
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<string>("INSTITUCIONAL")
  const [userName, setUserName] = useState<string>("Usuário")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // A) Resgata perfil passado via React Router State (útil durante a etapa de cadastro)
        const stateProfile = location.state?.userProfile || location.state?.perfil || location.state?.tipoParceiro

        // B) Resgata dados armazenados ou via API
        const userData = await authService.getUserData()
        console.log("[RegisterPoint] Dados retornados pelo authService:", userData)

        // C) Identifica o campo bruto do tipo do parceiro
        const rawTipo = userData?.tipoParceiro || userData?.tipo || userData?.tipoPessoa || stateProfile
        
        // D) Normaliza a chave para corresponder ao CATEGORIAS_POR_PERFIL
        const profileKey = normalizeProfileKey(rawTipo)
        
        console.log(`[RegisterPoint] Valor Bruto: "${rawTipo}" -> Perfil Mapeado: "${profileKey}"`)
        setUserProfile(profileKey)

        // E) Define o nome do usuário para o Header
        if (userData?.razaoSocial || userData?.nome) {
          const nomeCompleto = userData.razaoSocial || userData.nome || "Usuário"
          setUserName(nomeCompleto.split(" ")[0])
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [location.state])

  // Obtém a lista filtrada de acordo com o perfil identificado
  const categoriasDisponiveis = CATEGORIAS_POR_PERFIL[userProfile] || CATEGORIAS_POR_PERFIL.INSTITUCIONAL

  const handleAvançar = () => {
    if (!selectedCategoria) return
    navigate("/register-point-step2", { 
      state: { 
        categoriaId: selectedCategoria, 
        userProfile 
      } 
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderApp userName={userName} />

      <main className="flex-1 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto w-full py-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="w-10 h-10 rounded-full bg-green-400 text-white flex items-center justify-center shadow-md cursor-pointer hover:opacity-90 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-green-primary">Novo Ponto</h1>
          </div>

          <p className="text-white-500 text-sm mb-4">
            Para começar, identifique a categoria do seu estabelecimento
          </p>

          <div className="mb-6">
            <ProgressBar step={1} totalSteps={3} />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-green-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {categoriasDisponiveis.map((cat) => {
                const isSelected = selectedCategoria === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoria(cat.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between min-h-[110px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white-primary border-2 border-green-primary shadow-card2"
                        : "border-white-100 bg-white-primary hover:border-green-400 shadow-card2"
                    }`}
                  >
                    <img 
                      src={cat.src} 
                      alt={cat.nome} 
                      className="w-8 h-8 object-contain" 
                    />
                    <span className="text-xs font-semibold text-black-100 leading-tight mt-2">
                      {cat.nome}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <Button
            onClick={handleAvançar}
            disabled={!selectedCategoria}
            className="w-full"
          >
            Avançar
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </main>
    </div>
  )
}