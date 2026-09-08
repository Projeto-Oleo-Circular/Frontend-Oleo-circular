import { useEffect, useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import HeaderApp from "../../../../components/layout/HeaderApp";
import Button from "../../../../components/ui/Button";

import {
    pontosColetaService,
    type PontoColeta,
} from "../../../../services/pontosColetaService";

import { authService } from "../../../../services/authService";
import useToast from "../../../../hooks/useToast";
import GarrafaOleo from "../../../../components/ui/GarrafaOleo";
// ======================================================
// NÍVEIS
// ======================================================

interface NivelBombona {
    value: number;
    label: string;
}

const NIVEL_OPCOES: NivelBombona[] = [
    { value: 0, label: "0%" },
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "100%" },
];

// ======================================================
// COMPONENTE
// ======================================================

function ReportBarrel() {
    const navigate = useNavigate();
    const location = useLocation();

    const { addToast } = useToast();

    const [userName, setUserName] =
        useState("Usuário");

    const [ponto, setPonto] =
        useState<PontoColeta | null>(null);

    const [nivelSelecionado, setNivelSelecionado] =
        useState<number | null>(null);

    const [loading, setLoading] =
        useState(true);

    // ======================================================
    // USUÁRIO
    // ======================================================

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const userData =
                    await authService.getUserData();

                if (
                    userData?.razaoSocial ||
                    userData?.nome
                ) {
                    const nomeCompleto =
                        userData.razaoSocial ||
                        userData.nome ||
                        "Usuário";

                    setUserName(
                        nomeCompleto.split(" ")[0]
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao carregar usuário:",
                    error
                );
            }
        };

        carregarUsuario();
    }, []);

    // ======================================================
    // PONTO
    // ======================================================

   useEffect(() => {
    const carregarPonto = async () => {
        try {
            setLoading(true);

            const state = location.state as {
                pontoId?: number;
            };

            const data =
                await pontosColetaService.listarMeusPontos();

            if (data.length === 0) {
                setPonto(null);
                return;
            }

            if (state?.pontoId) {
                const pontoEncontrado = data.find(
                    (p) =>
                        Number(p.id) ===
                        Number(state.pontoId)
                );

                if (pontoEncontrado) {
                    setPonto(pontoEncontrado);
                    return;
                }
            }

            setPonto(data[0]);

        } catch (error) {
            console.error(
                "Erro ao carregar ponto:",
                error
            );

            addToast(
                "Erro ao carregar o ponto de coleta",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    carregarPonto();
}, [location.state, addToast]);

    // ======================================================
    // STATUS VISUAL
    // ======================================================

    const getStatusLabel = (
        value: number
    ): string => {
        if (value === 100) return "Cheia";
        if (value >= 75) return "Quase cheia";
        if (value >= 50) return "Meia cheia";
        if (value >= 25) return "Quase vazia";

        return "Vazia";
    };

    // ======================================================
    // SELECIONAR NÍVEL
    // ======================================================

    const handleNivelSelect = (
        value: number
    ) => {
        setNivelSelecionado(value);
    };

    // ======================================================
    // AVANÇAR
    // ======================================================

    const handleAvancar = () => {
    if (!ponto) return;

    if (nivelSelecionado === null) {
        addToast(
            "Informe o nível de óleo para solicitar a coleta.",
            "warning"
        );
        return;
    }

    if (nivelSelecionado === 0) {
        addToast(
            "Informe um nível maior que 0% para solicitar a coleta.",
            "warning"
        );
        return;
    }

    const enderecoFormatado = [
        ponto.logradouro,
        ponto.numero,
        ponto.bairro,
        ponto.cidade,
        ponto.estado,
    ]
        .filter(Boolean)
        .join(", ");

    // IMPORTANTE:
    // usa a expectativa de geração DO PONTO SELECIONADO
    const capacidadeGeracao =
        Number(ponto.expectativaGeracao) || 0;

    const volumeEstimado =
        capacidadeGeracao *
        (nivelSelecionado / 100);

    console.log("Ponto selecionado:", {
        id: ponto.id,
        nome: ponto.nomePontoColeta,
        expectativaGeracao: ponto.expectativaGeracao,
        nivelSelecionado,
        volumeEstimado,
    });

    navigate("/observations", {
        state: {
            pontoId: ponto.id,
            nivel: nivelSelecionado,

            // capacidade de geração do ponto
            capacidade: capacidadeGeracao,

            // litros estimados para a coleta
            volumeEstimado,

            endereco: enderecoFormatado,
            ponto,
        },
    });
};
    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-background">
                <HeaderApp userName={userName} />

                <main className="flex-1 flex items-center justify-center">
                    <div className="
                        w-12
                        h-12
                        border-4
                        border-green-primary
                        border-t-transparent
                        rounded-full
                        animate-spin
                    " />
                </main>
            </div>
        );
    }

    // ======================================================
    // SEM PONTO
    // ======================================================

    if (!ponto) {
        return (
            <div className="flex flex-col h-full bg-background">
                <HeaderApp userName={userName} />

                <main className="
                    flex-1
                    flex
                    items-center
                    justify-center
                    p-6
                ">
                    <div className="text-center">
                        <h2 className="
                            text-xl
                            font-bold
                            text-green-primary
                        ">
                            Nenhum ponto de coleta
                        </h2>

                        <p className="
                            text-sm
                            text-white-500
                            mt-2
                        ">
                            Cadastre um ponto antes de
                            solicitar uma coleta.
                        </p>

                        <Button
                            onClick={() =>
                                navigate(
                                    "/register-point"
                                )
                            }
                            variant="primary"
                            className="mt-4"
                        >
                            Cadastrar ponto
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // ======================================================
    // CÁLCULOS
    // ======================================================

const capacidadeGeracao =
    Number(ponto.expectativaGeracao) || 0;

const volumeEstimado =
    nivelSelecionado !== null
        ? capacidadeGeracao *
          (nivelSelecionado / 100)
        : 0;

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="
            flex
            flex-col
            h-full
            overflow-hidden
            bg-background
        ">
            <HeaderApp userName={userName} />

            <main className="
                flex-1
                overflow-y-auto
                p-4
                sm:p-6
                md:p-8
            ">
                <div className="
                    w-full
                    max-w-md
                    mx-auto
                    flex
                    flex-col
                    gap-6
                    pb-8
                ">

                    {/* ===================================== */}
                    {/* CABEÇALHO */}
                    {/* ===================================== */}

                    <div className="
                        flex
                        items-center
                        gap-4
                        pt-2
                    ">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(-1)
                            }
                            className="
                                w-10
                                h-10
                                bg-green-primary
                                hover:bg-green-hover
                                text-white
                                rounded-full
                                flex
                                items-center
                                justify-center
                                shadow-md
                                shrink-0
                                cursor-pointer
                            "
                            aria-label="Voltar"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        <div>
                            <h1 className="
                                text-xl
                                font-bold
                                text-green-primary
                            ">
                                Solicitar coleta
                            </h1>

                            <p className="
                                text-xs
                                text-white-500
                            ">
                                {ponto.nomePontoColeta ||
                                    ponto.categoria}
                            </p>
                        </div>
                    </div>

                    {/* ===================================== */}
                    {/* PERGUNTA */}
                    {/* ===================================== */}

                    <div>
                        <h2 className="
                            text-lg
                            font-bold
                            text-black-primary
                        ">
                            Qual o nível de óleo para coleta?
                        </h2>

                        <p className="
                            text-sm
                            text-white-500
                            mt-1
                        ">
                            Informe aproximadamente quanto
                            óleo está disponível neste ponto.
                        </p>
                    </div>

                    {/* ===================================== */}
                    {/* REPRESENTAÇÃO DA BOMBONA */}
                    {/* ===================================== */}
{/* ===================================== */}
{/* GARRAFA + NÍVEL DE ÓLEO */}
{/* ===================================== */}

<div className="
    bg-white-primary
    rounded-2xl
    shadow-card
    p-6
">

    <GarrafaOleo
        nivel={nivelSelecionado ?? 0}
        volume={volumeEstimado}
        capacidade={capacidadeGeracao}
    />

    {/* OPÇÕES DE NÍVEL */}

    <div className="
        grid
        grid-cols-5
        gap-2
        w-full
        mt-6
    ">
        {NIVEL_OPCOES.map(({ value, label }) => (
            <button
                type="button"
                key={value}
                onClick={() =>
                    handleNivelSelect(value)
                }
                className={`
                    flex
                    items-center
                    justify-center

                    rounded-xl
                    border-2

                    py-3
                    px-1

                    transition-all
                    duration-200

                    text-sm
                    cursor-pointer

                    ${
                        nivelSelecionado === value
                            ? `
                                border-green-primary
                                bg-green-50
                                text-green-primary
                                font-bold
                                shadow-card
                              `
                            : `
                                border-white-200
                                bg-white
                                text-black-primary
                                hover:border-green-primary
                                hover:bg-green-50
                              `
                    }
                `}
            >
                {label}
            </button>
        ))}
    </div>

                    </div>

                    {/* ===================================== */}
                    {/* RESULTADO */}
                    {/* ===================================== */}

                    {nivelSelecionado !== null && (
                        <div className="
                            bg-green-50
                            border
                            border-green-100
                            rounded-xl
                            p-4
                        ">

                            <div className="
                                flex
                                items-center
                                justify-between
                            ">
                                <div>
                                    <p className="
                                        text-xs
                                        text-white-500
                                    ">
                                        Nível informado
                                    </p>

                                    <p className="
                                        font-bold
                                        text-green-primary
                                    ">
                                        {getStatusLabel(
                                            nivelSelecionado
                                        )}
                                    </p>
                                </div>

                                <p className="
                                    text-xl
                                    font-bold
                                    text-green-primary
                                ">
                                    {nivelSelecionado}%
                                </p>
                            </div>

                            <div className="
                                border-t
                                border-green-100
                                mt-3
                                pt-3
                                flex
                                items-center
                                justify-between
                            ">
                                <span className="
                                    text-sm
                                    text-black-primary
                                ">
                                    Volume estimado
                                </span>

                                <span className="
                                    font-bold
                                    text-green-primary
                                ">
                                    {volumeEstimado.toLocaleString(
                                        "pt-BR",
                                        {
                                            maximumFractionDigits: 2,
                                        }
                                    )}{" "}
                                    L
                                </span>
                            </div>

                        </div>
                    )}

                    {/* ===================================== */}
                    {/* CAPACIDADE */}
                    {/* ===================================== */}

                    <div className="
                        bg-white-primary
                        rounded-2xl
                        shadow-card
                        p-4
                        flex
                        justify-between
                        items-center
                    ">
                       <span className="text-sm text-black-primary">
    Capacidade de geração do ponto
</span>

<span className="font-bold text-green-primary text-lg">
    {capacidadeGeracao.toLocaleString("pt-BR")} L
</span>
                    </div>

                    {/* ===================================== */}
                    {/* BOTÕES */}
                    {/* ===================================== */}

                    <div className="
                        flex
                        flex-col
                        gap-3
                        pt-2
                    ">
                        <Button
                            onClick={handleAvancar}
                            disabled={
                                nivelSelecionado ===
                                    null ||
                                nivelSelecionado === 0
                            }
                            variant="primary"
                            fullWidth
                        >
                            Avançar
                        </Button>

                        <Button
                            onClick={() =>
                                navigate("/home", {
                                    state: {
                                        updatedPontoId:
                                            ponto.id,
                                    },
                                })
                            }
                            variant="secondary"
                            fullWidth
                        >
                            Voltar
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default ReportBarrel;