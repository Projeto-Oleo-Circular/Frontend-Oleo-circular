import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import { pontosColetaService, type PontoColeta } from "../../../../services/pontosColetaService"
import useToast from "../../../../hooks/useToast"

function ReportBarrel() {
    const navigate = useNavigate()
    const location = useLocation()
    const { addToast } = useToast()

    const [ponto, setPonto] = useState<PontoColeta | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const state = location.state as { ponto?: PontoColeta }
        
        if (state?.ponto) {
            setPonto(state.ponto)
            setLoading(false)
        } else {
            const carregarPonto = async () => {
                try {
                    const data = await pontosColetaService.listarMeusPontos()
                    if (data.length > 0) {
                        setPonto(data[0])
                    }
                } catch (error) {
                    console.error("Erro ao carregar ponto:", error)
                    addToast("Erro ao carregar dados da bombona", "error")
                } finally {
                    setLoading(false)
                }
            }
            carregarPonto()
        }
    }, [location.state, addToast])

    const getStatusLabel = (value: number): string => {
        if (value === 100) return "Cheia"
        if (value >= 75) return "Quase cheia"
        if (value >= 50) return "Meia cheia"
        if (value >= 25) return "Quase vazia"
        return "Vazia"
    }

    const handleAvancar = () => {
        if (!ponto) return

        const enderecoFormatado = `${ponto.logradouro || ''}, ${ponto.numero || ''}`.trim()        // CORREÇÃO: Navegando para o caminho em português (que será usado nas rotas)
        navigate("/observations", {
            state: {
                pontoId: ponto.id,
                nivel: nivelAtual,
                capacidade: ponto.capacidadeBombona || 100,
                endereco: enderecoFormatado,
                ponto: ponto
            }
        })
    }

    if (loading || !ponto) {
        return (
            <div className="flex flex-col h-full bg-background">
                <HeaderApp userName="Usuário" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin"></div>
                </main>
            </div>
        )
    }

    const nivelAtual = ponto.nivelAtualPct || 0

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName="Usuário" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">
                    
                    <div className="flex items-center gap-4 pt-2">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Informar Bombona</h1>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-black-primary">Qual o nível da sua bombona?</h2>
                        <p className="text-sm text-white-500">Informar o nível ajuda a otimizar a coleta.</p>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-2">
                        
                        <div className="w-32 h-auto flex items-center justify-center">
                            <img 
                                src="/assets/icons/icon-bombona.svg" 
                                alt="Ícone da Bombona" 
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        <div className="flex flex-col items-center gap-2 h-44 justify-between relative w-10 sm:w-12">
                            <div className="flex items-center gap-2 w-full justify-end">
                                <span className="text-xs font-medium text-white-500">100%</span>
                            </div>
                     
                            <div className="w-2 h-28 bg-white-200 rounded-full relative mx-auto">
                                <div 
                                    className="absolute bottom-0 w-full bg-green-600 rounded-full transition-all duration-700"
                                    style={{ height: `${nivelAtual}%` }}
                                ></div>
                            </div>

                            <div className="absolute" style={{ bottom: `${nivelAtual}%`, right: '-16px', transform: 'translateY(50%)' }}>
                                <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                    {nivelAtual}%
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full justify-end pb-1">
                                <span className="text-xs font-medium text-white-500">0%</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-white-600">Nível aproximado</p>
                        <p className="text-lg font-bold text-orange-500">
                            {getStatusLabel(nivelAtual)} ({nivelAtual}%)
                        </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 w-full shadow-sm border border-green-100">
                        <p className="text-sm text-green-800 font-medium">Capacidade da bombona</p>
                        <p className="text-xl font-bold text-green-900">
                            {ponto.capacidadeBombona || 100} Litros
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <Button
                            onClick={handleAvancar}
                            variant="primary"
                            fullWidth
                        >
                            Avançar
                        </Button>
                        <Button
                            onClick={() => navigate("/home")}
                            variant="secondary"
                            fullWidth
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default ReportBarrel