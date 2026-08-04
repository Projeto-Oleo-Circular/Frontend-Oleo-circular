// features/usuario/pages/Observacoes/index.tsx
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import useToast from "../../../../hooks/useToast"

// IMPORTE O ÍCONE DO BOLHA COM LÁPIS AQUI
// Exemplo: import observacaoIcon from "../../../../assets/icons/icon-observacao.svg"
// Vou deixar um placeholder para você trocar pelo seu caminho real

function Observations() {
    const navigate = useNavigate()
    const location = useLocation()
    const { addToast } = useToast()

    // Pega o ponto e o nível que vieram da tela anterior para enviar no final
    const state = location.state as { pontoId?: number; nivel?: number }
    const pontoId = state?.pontoId
    const nivel = state?.nivel

    const [observacao, setObservacao] = useState("")
    const [enviando, setEnviando] = useState(false)
    const MAX_CHAR = 200

    const handleAvancar = async () => {
    // ... código de validação
    
    navigate("/confirm-request", {
        state: {
            pontoId: pontoId,
            nivel: nivel,
            capacidade: 100, // Puxe do objeto do ponto: ponto.capacidadeBombona
            endereco: "Rua das Flores, 85, Imbuí - Salvador/BA", // Puxe do objeto do ponto: ponto.endereco
            observacao: observacao
        }
    })
}

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName="Usuário" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                
                {/* Container Centralizador e Responsivo */}
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">
                    
                    {/* Header com Botão Voltar */}
                    <div className="flex items-center gap-4 pt-2">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="w-10 h-10 bg-green-primary text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Observações</h1>
                    </div>

                    {/* Título e Subtítulo */}
                    <div>
                        <h2 className="text-lg font-bold text-black-primary">Alguma informação importante?</h2>
                        <p className="text-sm text-gray-500">Adicione observações para nossa equipe (opcional).</p>
                    </div>

                    {/* Ícone da Bolha com Lápis */}
                    <div className="flex justify-center py-4">
                        <div className="w-28 h-auto">
                            <img 
                                src="/assets/icons/icon-observations.svg"
                                alt="Ícone de Observação" 
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Label do Input */}
                    <div className="flex justify-between items-end">
                        <label htmlFor="observacao" className="text-base font-semibold text-gray-700">
                            Observações <span className="font-normal text-gray-400">(opcional)</span>
                        </label>
                    </div>

                    {/* Área de Texto */}
                    <div className="relative w-full">
                        <textarea
                            id="observacao"
                            rows={5}
                            maxLength={MAX_CHAR}
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Ex.: O local fica próximo ao Mercado Macário."
                            className="w-full p-4 bg-white border border-gray-300 rounded-xl text-black-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-transparent resize-none"
                        />
                        {/* Contador de caracteres */}
                        <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                            {observacao.length}/{MAX_CHAR}
                        </span>
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col gap-3 mt-2">
                        <Button
                            onClick={handleAvancar}
                            variant="primary"
                            fullWidth
                            disabled={enviando}
                        >
                            {enviando ? 'Enviando...' : 'Avançar'}
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