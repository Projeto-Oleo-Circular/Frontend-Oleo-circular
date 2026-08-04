// Home.tsx
import { useLocation, useNavigate } from "react-router-dom"
import Button from "../../../../components/ui/Button"
import HeaderApp from "../../../../components/layout/HeaderApp"
import { useEffect, useState } from "react"
import { authService } from "../../../../services/authService"
import { pontosColetaService, type PontoColeta } from "../../../../services/pontosColetaService"
import PontosColetaCard from "../../../../components/ui/PontosColetaCard"
import BombonaCard from "../../../../components/ui/BombonaCard"
import ImpactoCard from "../../../../components/ui/ImpactoCard"

function Home() {
    const navigate = useNavigate()
    const location = useLocation()
    const [userName, setUserName] = useState("Usuário")
    const [loading, setLoading] = useState(false)

    const [pontos, setPontos] = useState<PontoColeta[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loadingPontos, setLoadingPontos] = useState(true)

    useEffect(() => {
        const carregarDadosUsuario = async () => {
            try {
                const userData = await authService.getUserData()

                if (userData?.nomeRazaoSocial || userData?.nomeSocial) {
                    const nomeCompleto = userData.nomeRazaoSocial || userData.nomeSocial || "Usuário"
                    const primeiroNome = nomeCompleto.split(" ")[0]
                    setUserName(primeiroNome)
                }
            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error)
            } finally {
                setLoading(false)
            }
        }
        carregarDadosUsuario()
    }, [])

    useEffect(() => {
        const carregarPontos = async () => {
            try {
                const data = await pontosColetaService.listarMeusPontos()
                console.log("📦 Pontos carregados da API:", data)
                setPontos(data)
            } catch (error) {
                console.error("Erro ao carregar pontos de coleta:", error)
            } finally {
                setLoadingPontos(false)
            }
        }
        carregarPontos()
    }, [])

    const pontoAtual = pontos[currentIndex]

    const handleAnterior = () => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1)
    }

    const handleProximo = () => {
        if (currentIndex < pontos.length - 1) setCurrentIndex((prev) => prev + 1)
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName={userName} />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
                <div className="absolute inset-0 w-full h-50 sm:h-60 pointer-events-none">
                    <img
                        src="/assets/fundo-home.svg"
                        alt="Fundo decorativo"
                        className="w-full h-full object-cover object-bottom"
                    />
                </div>

                <div className="w-full max-w-4xl mx-auto relative z-10 space-y-4 pb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white-primary">
                                Olá, {userName}!
                            </h1>
                            <p className="text-sm sm:text-base text-white-primary mt-1">
                                Seja bem-vindo(a)!
                            </p>
                        </div>

                        <button
                            className="p-2 hover:bg-green-400 rounded-full transition-colors duration-200 relative"
                            aria-label="Notificações"
                            onClick={() => navigate("/home")}
                        >
                            <img
                                src="/assets/icons/icon-notificacao.svg"
                                alt="Notificações"
                                className="w-6 h-6 sm:w-7 sm:h-7"
                            />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                    </div>

                    <PontosColetaCard
                        pontos={pontos}
                        currentIndex={currentIndex}
                        onAnterior={handleAnterior}
                        onProximo={handleProximo}
                        loading={loadingPontos}
                    />

                    <BombonaCard ponto={pontoAtual} loading={loadingPontos} />

                    <ImpactoCard
                        oleoDestinadoLitros={0}
                        co2EvitadoKg={0}
                        periodoLabel="Este mês"
                    />

                    <Button
                        onClick={() => navigate("/report-barrel")}
                        className="w-full"
                    >
                        Solicitar coleta
                    </Button>
                </div>
            </main>
        </div>
    )
}

export default Home