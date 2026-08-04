// components/ui/BombonaCard.tsx
import { useNavigate } from "react-router-dom"
import type { PontoColeta } from "../../services/pontosColetaService"

const STATUS_LABELS: Record<string, string> = {
    VAZIA: "Vazia",
    PARCIAL: "Parcial",
    CHEIA: "Cheia",
    EM_COLETA: "Em coleta",
}

interface BombonaCardProps {
    ponto?: PontoColeta;
    loading: boolean;
}

function BombonaCard({ ponto, loading }: BombonaCardProps) {
    const navigate = useNavigate()

    if (loading) {
        return <div className="bg-white-primary rounded-2xl shadow-card p-5 h-32 animate-pulse" />
    }

    if (!ponto) {
        return null
    }

    const statusLabel = STATUS_LABELS[ponto.statusBombona ?? ""] ?? ponto.statusBombona ?? "—"
    const nivelAtual = ponto.nivelAtualPct ?? 0
    const temNivelInformado = nivelAtual > 0 || ponto.statusBombona !== "VAZIA"

    // Simular data da última atualização (depois virá da API)
    const dataUltimaAtualizacao = "28/07/2026"

    const handleInformarNivel = () => {
        navigate("/informar-nivel")
    }

    return (
        <div className="bg-white-primary rounded-2xl shadow-card p-5">
            <h2 className="text-lg font-bold text-green-primary mb-4">Bombona Cadastrada</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Lado esquerdo - Capacidade */}
                <div className="flex items-center gap-3">
                    <img
                        src="/assets/icons/icon-bombona.svg"
                        alt="Bombona"
                        className="w-10 h-10"
                    />
                    <div>
                        <p className="text-sm text-black-primary">Capacidade</p>
                        <p className="font-bold text-white-800 text-lg">{ponto.capacidadeBombona} L</p>
                    </div>
                </div>

                {/* Lado direito - Status */}
                <div className="text-right">
                    {temNivelInformado ? (
                        <>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] text-white-400">Informado em {dataUltimaAtualizacao}</span>
                            </div>
                            <p className="text-sm text-black-primary mt-1">Status atual</p>
                            <div className="flex items-center justify-end gap-2">
                                <span className="font-bold text-green-primary text-xl">{nivelAtual}%</span>
                                <span className="text-xs text-black-primary">({statusLabel})</span>
                            </div>
                            <button
                                onClick={handleInformarNivel}
                                className="mt-1 text-xs text-green-primary font-bold hover:underline"
                            >
                                Atualizar
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-black-primary">Status atual</p>
                            <p className="text-sm text-black-primary font-medium mt-1">Nível ainda não informado</p>
                            <button
                                onClick={handleInformarNivel}
                                className="mt-2 px-4 py-1.5 bg-green-primary text-white rounded-lg text-sm font-bold hover:bg-green-hover transition-colors duration-200"
                            >
                                Informar agora
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BombonaCard