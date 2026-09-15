import type { PontoColeta } from "../../services/pontosColetaService";

interface BombonaCardProps {
    ponto?: PontoColeta;
    loading: boolean;
}

// ======================================================
// TOOLTIP
// ======================================================

interface TooltipProps {
    texto: string;
}

function Tooltip({ texto }: TooltipProps) {
    return (
        <div className="relative group flex items-center">
            <button
                type="button"
                aria-label="Mais informações"
                className="
                    w-4
                    h-4
                    rounded-full
                    border
                    border-green-primary
                    text-green-primary
                    text-[10px]
                    font-bold
                    flex
                    items-center
                    justify-center
                    cursor-help
                    hover:bg-green-primary
                    hover:text-white
                    transition-colors
                "
            >
                ?
            </button>

            <div
                className="
                    absolute
                    left-1/2
                    bottom-full
                    -translate-x-1/2
                    mb-2

                    w-64
                    max-w-[80vw]

                    bg-black-primary
                    text-white
                    text-xs
                    font-normal
                    leading-relaxed

                    px-3
                    py-2
                    rounded-lg
                    shadow-lg

                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    group-focus-within:opacity-100
                    group-focus-within:visible

                    transition-all
                    duration-200

                    z-50

                    pointer-events-none
                "
            >
                {texto}

                {/* SETA DO TOOLTIP */}
                <div
                    className="
                        absolute
                        left-1/2
                        top-full
                        -translate-x-1/2

                        border-4
                        border-transparent
                        border-t-black-primary
                    "
                />
            </div>
        </div>
    );
}


// ======================================================
// COMPONENTE
// ======================================================

function BombonaCard({
    ponto,
    loading,
}: BombonaCardProps) {

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                className="
                    bg-white-primary
                    rounded-2xl
                    shadow-card
                    p-5
                    animate-pulse
                "
            >
                <div className="h-5 bg-white-200 rounded w-48 mb-5" />

                <div
                    className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        gap-4
                    "
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white-200 rounded-full" />

                        <div className="flex-1">
                            <div className="h-3 bg-white-200 rounded w-32 mb-2" />
                            <div className="h-6 bg-white-200 rounded w-20" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white-200 rounded-full" />

                        <div className="flex-1">
                            <div className="h-3 bg-white-200 rounded w-32 mb-2" />
                            <div className="h-6 bg-white-200 rounded w-20" />
                        </div>
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
    // VALORES
    // ======================================================

    const expectativaGeracao =
        Number(ponto.expectativaGeracao) || 0;

    const capacidadeBombona =
        Number(ponto.capacidadeBombona) || 0;


    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div
            className="
                bg-white-primary
                rounded-2xl
                shadow-card
                p-5
            "
        >

            {/* ================================================= */}
            {/* TÍTULO */}
            {/* ================================================= */}

            <h2
                className="
                    text-lg
                    font-bold
                    text-green-primary
                    mb-4
                "
            >
                Informações de Geração
            </h2>


            {/* ================================================= */}
            {/* CARDS */}
            {/* ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-3
                "
            >

                {/* ================================================= */}
                {/* EXPECTATIVA DE GERAÇÃO */}
                {/* ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        gap-3

                        p-3

                        bg-green-50/50

                        border
                        border-green-100

                        rounded-xl
                    "
                >

                    {/* ÍCONE */}

                    <div
                        className="
                            w-11
                            h-11
                            rounded-full

                            bg-green-50

                            flex
                            items-center
                            justify-center

                            flex-shrink-0
                        "
                    >
                        <img
                            src="/assets/icons/icon-bombona.svg"
                            alt=""
                            className="w-7 h-7"
                        />
                    </div>


                    {/* INFORMAÇÃO */}

                    <div className="min-w-0">

                        <div
                            className="
                                flex
                                items-center
                                gap-1.5
                                mb-1
                            "
                        >
                            <p
                                className="
                                    text-xs
                                    font-medium
                                    text-black-primary
                                "
                            >
                                Expectativa de geração
                            </p>

                            <Tooltip
                                texto="
                                    Quantidade aproximada de óleo
                                    que este ponto estima gerar
                                    durante um mês.
                                "
                            />
                        </div>


                        <div
                            className="
                                flex
                                items-baseline
                                gap-1
                            "
                        >
                            <span
                                className="
                                    text-xl
                                    font-bold
                                    text-green-primary
                                "
                            >
                                {expectativaGeracao.toLocaleString(
                                    "pt-BR",
                                    {
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </span>

                            <span
                                className="
                                    text-xs
                                    font-semibold
                                    text-green-primary
                                "
                            >
                                L/mês
                            </span>
                        </div>

                    </div>

                </div>


                {/* ================================================= */}
                {/* CAPACIDADE DA BOMBONA */}
                {/* ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        gap-3

                        p-3

                        bg-green-50/50

                        border
                        border-green-100

                        rounded-xl
                    "
                >

                    {/* ÍCONE */}

                    <div
                        className="
                            w-11
                            h-11
                            rounded-full

                            bg-green-50

                            flex
                            items-center
                            justify-center

                            flex-shrink-0
                        "
                    >
                        <img
                            src="/assets/icons/icon-bombona.svg"
                            alt=""
                            className="w-7 h-7"
                        />
                    </div>


                    {/* INFORMAÇÃO */}

                    <div className="min-w-0">

                        <div
                            className="
                                flex
                                items-center
                                gap-1.5
                                mb-1
                            "
                        >
                            <p
                                className="
                                    text-xs
                                    font-medium
                                    text-black-primary
                                "
                            >
                                Capacidade da bombona
                            </p>

                            <Tooltip
                                texto="
                                    Capacidade máxima do recipiente
                                    utilizado para armazenar o óleo.
                                    Este valor é usado para calcular
                                    o volume estimado na solicitação
                                    de coleta.
                                "
                            />
                        </div>


                        <div
                            className="
                                flex
                                items-baseline
                                gap-1
                            "
                        >
                            <span
                                className="
                                    text-xl
                                    font-bold
                                    text-green-primary
                                "
                            >
                                {capacidadeBombona.toLocaleString(
                                    "pt-BR",
                                    {
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </span>

                            <span
                                className="
                                    text-xs
                                    font-semibold
                                    text-green-primary
                                "
                            >
                                L
                            </span>
                        </div>

                    </div>

                </div>

            </div>


            {/* ================================================= */}
            {/* EXPLICAÇÃO AUXILIAR */}
            {/* ================================================= */}

            <div
                className="
                    mt-4
                    pt-3
                    border-t
                    border-white-100
                "
            >
                <p
                    className="
                        text-xs
                        text-white-500
                        leading-relaxed
                    "
                >
                    Valores cadastrados para este ponto de coleta.
                </p>
            </div>

        </div>
    );
}

export default BombonaCard;