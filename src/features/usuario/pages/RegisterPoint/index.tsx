import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import ProgressBar from "../../../../components/ui/ProgressBar"
import { authService } from "../../../../services/authService"

interface CategoriaOpcao {
  id: number
  nome: string
  src: string
}

const CATEGORIAS_POR_PERFIL: Record<string, CategoriaOpcao[]> = {
  INSTITUCIONAL: [
    { id: 1, nome: "Restaurante / Lanchonete", src: "/assets/icons/icon-soup.svg" },
    { id: 2, nome: "Cozinha Industrial", src: "/assets/icons/icon-cozinha.svg" },
    { id: 3, nome: "Universidade / Escola", src: "/assets/icons/icon-boina.svg" },
    { id: 4, nome: "Hospital / Unidade de Saúde",  src: "/assets/icons/icon-hospital2.svg" },
    { id: 5, nome: "Hotel / Pousada", src: "/assets/icons/icon-hotel2.svg" },
    { id: 6, nome: "Empresa / Refeitório Corporativo", src: "/assets/icons/icon-condominio-refeitorio.svg" },
    { id: 7, nome: "Condomínio Residencial", src: "/assets/icons/icon-condominio2.svg" },
  ],
  COMUNITARIO: [
    { id: 8, nome: "Associação de Bairro", src: "/assets/icons/icon-soup.svg" },
    { id: 9, nome: "Centro Comunitário", src: "/assets/icons/icon-soup.svg" },
    { id: 10, nome: "Igreja / Templo", src: "/assets/icons/icon-soup.svg" },
    { id: 11, nome: "Ponto de Coleta Comunitário", src: "/assets/icons/icon-soup.svg" },
  ],
  SOLIDARIO: [
    { id: 12, nome: "ONG / OSC", src: "/assets/icons/icon-soup.svg" },
    { id: 13, nome: "Projeto Social", src: "/assets/icons/icon-soup.svg" },
    { id: 14, nome: "Instituição de Caridade", src: "/assets/icons/icon-soup.svg" },
  ]
}

export default function RegisterPoint() {
  const navigate = useNavigate()
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<string>("INSTITUCIONAL")
  const [userName, setUserName] = useState<string>("Usuário")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getUserData()
        
        // Perfil do parceiro
        const tipo = userData?.tipoParceiro?.toUpperCase() || "INSTITUCIONAL"
        setUserProfile(tipo)

        // Nome do usuário
        if (userData?.razaoSocial || userData?.nome) {
          const nomeCompleto = userData.razaoSocial || userData.nome || "Usuário"
          const primeiroNome = nomeCompleto.split(" ")[0]
          setUserName(primeiroNome)
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const categoriasDisponiveis = CATEGORIAS_POR_PERFIL[userProfile] || CATEGORIAS_POR_PERFIL.INSTITUCIONAL

  const handleAvançar = () => {
    if (!selectedCategoria) return
    navigate("/register-point", { state: { categoriaId: selectedCategoria } })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderApp userName={userName} />

      <main className="flex-1 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto w-full py-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
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