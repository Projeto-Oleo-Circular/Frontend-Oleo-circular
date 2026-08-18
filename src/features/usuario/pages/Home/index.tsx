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
        carregarDadosUsuario()
    }, [])

    useEffect(() => {
        const carregarPontos = async () => {
            try {
                const data = await pontosColetaService.listarMeusPontos()
                setPontos(data)
            } catch (error) {
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
        <div className="relative flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName={userName} />

            <main className="flex-1 overflow-y-auto">
                <div className="bg-green-primary text-white-primary pt-6 pb-20 px-6 sm:px-8 rounded-b-[2rem] sm:rounded-b-[3rem] w-full">
                    <div className="flex justify-between items-center max-w-5xl mx-auto">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white-primary">
                                Olá, {userName}!
                            </h1>
                            <p className="text-sm sm:text-base text-white-primary opacity-90 mt-1">
                                Seja bem-vindo(a)!
                            </p>
                        </div>
                    {/*
                        <button
                            className="relative p-2.5 hover:bg-green-hover rounded-full transition-colors duration-200 cursor-pointer"
                            aria-label="Notificações"
                        >
                            <img
                                src="/assets/icons/icon-notificacao.svg"
                                alt="Notificações"
                                className="w-6 h-6 sm:w-7 sm:h-7"
                            />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-primary rounded-full border-2 border-green-primary" />
                        </button>
                    */}
                    </div>
                </div>

                <div className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto relative z-10 -mt-12 sm:-mt-16 flex flex-col gap-4 pb-24">
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
                        onClick={() => navigate("/report-barrel", { state: {ponto: pontoAtual }})}
                        className="w-full mt-2"
                    >
                        Solicitar coleta
                    </Button>
                </div>
            </main>

           <button
                onClick={() => navigate("/register-point")}
                className="fixed bottom-20 right-6 sm:bottom-24 sm:right-10 w-14 h-14 bg-[#31B0A5] hover:bg-[#289188] text-white rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 z-50 cursor-pointer"
                aria-label="Adicionar novo ponto de coleta"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    )
}

export default Home