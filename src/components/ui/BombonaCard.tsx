import type { PontoColeta } from "../../services/pontosColetaService";

interface BombonaCardProps {
    ponto?: PontoColeta;
    loading: boolean;
}

function BombonaCard({
    ponto,
    loading,
}: BombonaCardProps) {

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div className="
                bg-white-primary
                rounded-2xl
                shadow-card
                p-5
                h-32
                animate-pulse
            ">
                <div className="h-5 bg-white-200 rounded w-48 mb-5" />

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white-200 rounded-full" />

                    <div className="flex-1">
                        <div className="h-3 bg-white-200 rounded w-32 mb-2" />
                        <div className="h-6 bg-white-200 rounded w-20" />
                    </div>
                </div>
            </div>
        );
    }

    // ======================================================
    // SEM PONTO
    // ======================================================

    if (!ponto) {
        return null;
    }

    // ======================================================
    // CAPACIDADE DE GERAÇÃO
    // ======================================================

    const expectativaGeracao =
        ponto.expectativaGeracao ?? 0;

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="
            bg-white-primary
            rounded-2xl
            shadow-card
            p-5
        ">

            {/* TÍTULO */}
            <h2 className="
                text-lg
                font-bold
                text-green-primary
                mb-4
            ">
                Capacidade de Geração
            </h2>

            {/* CONTEÚDO */}
            <div className="
                flex
                items-center
                justify-between
                gap-4
            ">

                {/* ÍCONE + INFORMAÇÃO */}
                <div className="
                    flex
                    items-center
                    gap-4
                ">

                    <div className="
                        w-12
                        h-12
                        rounded-full
                        bg-green-50
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                    ">
                        <img
                            src="/assets/icons/icon-bombona.svg"
                            alt="Capacidade de geração"
                            className="w-8 h-8"
                        />
                    </div>

                    <div>
                        <p className="
                            text-sm
                            text-black-primary
                        ">
                            Geração estimada
                        </p>

                        <div className="
                            flex
                            items-baseline
                            gap-1
                        ">
                            <span className="
                                text-2xl
                                font-bold
                                text-green-primary
                            ">
                                {expectativaGeracao.toLocaleString(
                                    "pt-BR",
                                    {
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </span>

                            <span className="
                                text-sm
                                font-semibold
                                text-green-primary
                            ">
                                L
                            </span>
                        </div>
                    </div>

                </div>

                {/* INFORMAÇÃO AUXILIAR */}
                <div className="text-right">

                    <p className="
                        text-xs
                        text-white-500
                    ">
                        Capacidade cadastrada
                    </p>

                    <p className="
                        text-xs
                        text-black-primary
                        mt-1
                    ">
                        para este ponto
                    </p>

                </div>

            </div>

        </div>
    );
}

export default BombonaCard;