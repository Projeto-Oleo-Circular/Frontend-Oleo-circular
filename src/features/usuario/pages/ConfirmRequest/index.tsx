import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import useToast from "../../../../hooks/useToast"

function ConfirmRequest() {
    const navigate = useNavigate()
    const location = useLocation()
    const { addToast } = useToast()

    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [data, setData] = useState({
        nivel: 0,
        capacidade: 0,
        endereco: "",
        observacao: ""
    })

    useEffect(() => {
        // Pega os dados enviados pela tela de Observações
        const state = location.state as { 
            pontoId?: number
            nivel?: number
            capacidade?: number
            endereco?: string
            observacao?: string 
        }

        if (state) {
            setData({
                nivel: state.nivel || 0,
                capacidade: state.capacidade || 0,
                endereco: state.endereco || "Endereço não informado",
                observacao: state.observacao || "Nenhuma observação"
            })
        } else {
            // Se por algum motivo vier sem dados, volta para o início
            addToast("Dados da solicitação não encontrados", "error")
            navigate("/home")
        }
    }, [location.state, addToast, navigate])

    const getStatusLabel = (value: number): string => {
        if (value === 100) return "Cheia"
        if (value >= 75) return "Quase cheia"
        if (value >= 50) return "Meia cheia"
        if (value >= 25) return "Quase vazia"
        return "Vazia"
    }

    const handleConfirmarSolicitacao = async () => {
        setLoading(true)
        try {
            // Simula o envio da solicitação para o Back-end
            // await solicitacaoColetaService.criarSolicitacao({ ...data })
            
            // Espera um tempinho para simular o carregamento
            await new Promise(resolve => setTimeout(resolve, 800))

            // Abre o modal de sucesso
            setShowSuccessModal(true)
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error)
            addToast("Erro ao confirmar solicitação", "error")
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (value: number): string => {
        if (value >= 75) return "text-orange-500"
        if (value >= 50) return "text-yellow-500"
        return "text-green-500"
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            <HeaderApp userName="Usuário" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-0">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 pt-2">
                         <button 
                            onClick={() => navigate(-1)} 
                            className="w-10 h-10 bg-green-primary text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Confirmar Solicitações</h1>
                    </div>

                    {/* Título */}
                    <h2 className="text-lg font-bold text-black-primary">Revise os dados da sua solicitação</h2>

                    {/* Card de Dados */}
                    <div className="bg-white rounded-xl shadow-sm border border-white-200 divide-y divide-white-200 overflow-hidden">
                        
                        {/* Nível da bombona */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/assets/icons/icon-bombona.svg" alt="Bombona" className="w-7 h-7 object-contain" />
                                <span className="font-bold text-black-primary">Nível da bombona</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-medium text-orange-primary">{data.nivel}%</span>
                                <span className={`text-xs font-semibold text-orange-primary ${getStatusColor(data.nivel)}`}>
                                    ({getStatusLabel(data.nivel)})
                                </span>
                            </div>
                        </div>

                        {/* Capacidade */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/assets/icons/icon-capacitor.svg" alt="Capacidade" className="w-7 h-7 object-contain" />
                                <span className="font-bold text-black-primary">Capacidade</span>
                            </div>
                            <span className="font-bold text-black-primary">{data.capacidade} Litros</span>
                        </div>

                        {/* Endereço */}
                        <div className="p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <img src="/assets/icons/icon-local.svg" alt="Localização" className="w-7 h-7 object-contain" />
                                <span className="font-bold text-black-primary">Endereço</span>
                            </div>
                            <p className="text-sm text-gray-600 pl-10">{data.endereco}</p>
                        </div>

                        {/* Observações */}
                        <div className="p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <img src="/assets/icons/icon-observations.svg" alt="Observações" className="w-7 h-7 object-contain" />
                                <span className="font-bold text-black-primary">Observações</span>
                            </div>
                            <p className="text-sm text-white-600 pl-10">{data.observacao}</p>
                        </div>
                    </div>

                    {/* Alerta Informativo */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 text-black-primary">
                            <img src="/assets/icons/icon-info.svg"alt="Alerta" className="w-5 h-5 object-contain" />
                        </div>
                        <p className="text-sm text-black-primary leading-relaxed">
                            Sua solicitação será enviada para análise e nossa equipe entrará em contato em breve.
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col gap-3 mt-2">
                        <Button
                            onClick={handleConfirmarSolicitacao}
                            variant="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Confirmar solicitação'}
                        </Button>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            fullWidth
                        >
                            Voltar
                        </Button>
                    </div>

                </div>
            </main>

            {/* MODAL DE SUCESSO (Renderizado por cima de tudo) */}
            {showSuccessModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl animate-fade-in-up">
                        
                        <img 
                            src="/assets/fundo-popUp-superior.svg" 
                            alt="" 
                            className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />
                        {/* Imagem do canto inferior esquerdo */}
                        <img 
                            src="/assets/fundo-popUp-inferior.svg" 
                            alt="" 
                            className="absolute -bottom-10 -left-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />

                        {/* Conteúdo do Modal */}
                        <div className="relative z-10 flex flex-col items-center text-center pt-4">
                            
                            {/* Ícone do Relógio */}
                            <div className="w-16 h-16 flex items-center justify-center mb-4">
                                <img src="/assets/icons/icon-relogio.svg" alt="Relógio" className="w-10 h-10 object-contain text-green-600" />
                            </div>

                            <h3 className="text-xl font-bold text-green-700 mb-2">Solicitação enviada!</h3>
                            
                            <p className="text-sm text-green-primary leading-relaxed mb-6 px-2">
                                Aguarde a aprovação da <strong>Equipe Óleo Circular</strong> para o recolhimento da bombona. Você receberá um e-mail em breve com a confirmação.
                            </p>

                            <Button
                                onClick={() => navigate("/home")}
                                variant="primary"
                                fullWidth
                            >
                                Ir para a página principal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ConfirmRequest