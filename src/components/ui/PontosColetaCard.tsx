import type { PontoColeta } from "../../services/pontosColetaService";

/**
 * Monta o endereço a partir dos campos flat que a API devolve.
 * `estado` pode vir null, então só entra na string se existir.
 */
function formatarEndereco(ponto: PontoColeta): string {
    const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
    return ponto.estado ? `${base}/${ponto.estado}` : base;
}

interface PontosColetaCardProps {
    pontos: PontoColeta[];
    currentIndex: number;
    onAnterior: () => void;
    onProximo: () => void;
    loading: boolean;
}

function PontosColetaCard({ pontos, currentIndex, onAnterior, onProximo, loading }: PontosColetaCardProps) {
    const total = pontos.length;
    const pontoAtual = pontos[currentIndex];

    if (loading) {
        return <div className="bg-white-primary rounded-2xl shadow-card p-5 h-40 animate-pulse" />;
    }

    if (total === 0 || !pontoAtual) {
        return (
            <div className="bg-white-primary rounded-2xl shadow-card p-5">
                <h2 className="text-lg font-bold text-green-primary mb-1">Pontos de Coleta</h2>
                <p className="text-sm text-white-500">
                    Você ainda não cadastrou nenhum ponto de coleta.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white-primary rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-green-primary">Pontos de Coleta</h2>
                <div className="flex gap-1.5">
                    {pontos.map((_, index) => (
                        <span
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentIndex ? "bg-green-primary" : "bg-white-200"
                            }`}
                        />
                    ))}
                </div>
            </div>

            <p className="font-bold text-white-800">{pontoAtual.categoria}</p>
            <p className="flex items-center gap-1.5 text-sm text-black-primary mt-1">
                <img
                    src="/assets/icons/icon-local.svg"
                    alt="Localização"
                    className="w-4 h-4 text-green-primary flex-shrink-0"
                />
                {formatarEndereco(pontoAtual)}
            </p>

            <div className="flex items-center justify-between mt-4">
                <button
                    type="button"
                    onClick={onAnterior}
                    disabled={currentIndex === 0}
                    aria-label="Ponto de coleta anterior"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        currentIndex === 0
                            ? "bg-white-300 text-white-primary cursor-not-allowed"
                            : "bg-green-primary text-white-primary hover:bg-green-hover"
                    }`}
                >
                    <img src="/assets/icons/arrow-left.svg" alt="Anterior" className="w-5 h-5" />
                </button>

                <span className="text-sm text-white-400">
                    {currentIndex + 1}/{total}
                </span>

                <button
                    type="button"
                    onClick={onProximo}
                    disabled={currentIndex === total - 1}
                    aria-label="Próximo ponto de coleta"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        currentIndex === total - 1
                            ? "bg-white-300 text-white-400 cursor-not-allowed"
                            : "bg-green-primary text-white hover:bg-green-hover"
                    }`}
                >
                    <img src="/assets/icons/arrow-right.svg" alt="Próximo" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default PontosColetaCard;