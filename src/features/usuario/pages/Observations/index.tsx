import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import useToast from "../../../../hooks/useToast"


interface LocationState {
    pontoId?: number;
    nivel?: number;
    capacidade?: number;
    endereco?: string;
    ponto?: {
        id: number;
        capacidadeBombona?: number;
        endereco?: string;
        [key: string]: unknown;
    };
}

function Observations() {
    const navigate = useNavigate()
    const location = useLocation()
    const { addToast } = useToast()
    const [observacao, setObservacao] = useState("")

    const state = location.state as LocationState | undefined
    const MAX_CHAR = 200

    const handleAvancar = () => {
        if (!state?.pontoId && !state?.ponto?.id) {
            addToast('Informações do ponto de coleta não foram encontradas', 'error')
            return
        }

        const pontoId = state?.pontoId || state?.ponto?.id
        const nivel = state?.nivel
        const capacidade = state?.capacidade || state?.ponto?.capacidadeBombona || 0
        const endereco = state?.endereco || state?.ponto?.endereco || "Endereço não informado"

        navigate("/confirm-request", {
            state: {
                pontoId: pontoId,
                nivel: nivel,
                capacidade, 
                endereco,
                observacao: observacao.trim()
            }
        })
}

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName="Usuário" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">
                    
                    <div className="flex items-center gap-4 pt-2">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="w-10 h-10 bg-green-primary text-white rounded-full flex items-center justify-center shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-green-primary"
                            aria-label="Voltar"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Observações</h1>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-black-primary">Alguma informação importante?</h2>
                        <p className="text-sm text-white-500">Adicione observações para nossa equipe (opcional).</p>
                    </div>

                    <div className="flex justify-center py-4">
                        <div className="w-28 h-auto">
                            <img 
                                src="/assets/icons/icon-observations.svg"
                                alt="Ícone de Observação" 
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <label htmlFor="observacao" className="text-base font-semibold text-black-200">
                            Observações <span className="font-normal text-white-400">(opcional)</span>
                        </label>
                    </div>

                    <div className="relative w-full">
                        <textarea
                            id="observacao"
                            rows={5}
                            maxLength={MAX_CHAR}
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Ex.: O local fica próximo ao Mercado Macário."
                            className="w-full p-4 bg-white border border-white-300 rounded-xl text-black-primary placeholder-white-400 focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-transparent resize-none"
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-white-400">
                            {observacao.length}/{MAX_CHAR}
                        </span>
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
                            onClick={() => navigate(-1)}
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

export default Observations