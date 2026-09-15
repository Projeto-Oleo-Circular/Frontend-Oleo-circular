import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

import HeaderApp from "../../../../../components/layout/HeaderApp"
import Input from "../../../../../components/ui/Input"
import useToast from "../../../../../hooks/useToast"

import {
    getEnderecoPonto,
    getNomePonto,
    solicitacaoColetaService,
} from "../../../../../services/solicitacaoColetaService"

import { getStatusSolicitacaoInfo } from "../../../../../constants/statusSolicitacao"
import { pontosColetaService } from "../../../../../services/pontosColetaService"
import { PERFIS_PARCEIRO } from "../../../../../constants/perfisParceiros"
import { authService } from "../../../../../services/authService"


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarData(
    dataIso: string | null | undefined
): string {

    if (!dataIso) {
        return "-"
    }

    const data = new Date(dataIso)

    return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    )}`
}


// ============================================================
// LABEL DA CATEGORIA
// ============================================================

function getCategoriaLabel(
    categoria: number | string | undefined | null
): string {

    if (categoria == null) {
        return "-"
    }

    if (typeof categoria === "string") {
        return categoria
    }

    const tag = PERFIS_PARCEIRO
        .flatMap((perfil) => perfil.tags)
        .find(
            (tag) =>
                tag.categoriaId === categoria
        )

    return tag?.label || `Categoria ${categoria}`
}


// ============================================================
// COMPONENTE
// ============================================================

function RequestDetail() {

    const { id } =
        useParams<{ id: string }>()

    const navigate =
        useNavigate()

    const { addToast } =
        useToast()


    // ========================================================
    // ESTADOS
    // ========================================================

    const [
        solicitacao,
        setSolicitacao,
    ] = useState<any>(null)

    const [
        loading,
        setLoading,
    ] = useState(true)


    // ========================================================
    // CARREGAR SOLICITAÇÃO
    // ========================================================

    useEffect(() => {

        const carregar = async () => {

            try {

                const [
                    todas,
                    userData,
                ] = await Promise.all([

                    solicitacaoColetaService
                        .listarSolicitacoes(),

                    authService
                        .getUserData()
                        .catch(() => null),
                ])


                const encontrada =
                    todas.find(
                        (s: any) =>
                            String(s.id) === id
                    )


                if (!encontrada) {

                    addToast(
                        "Solicitação não encontrada",
                        "error"
                    )

                    navigate(
                        "/my-requests"
                    )

                    return
                }


                // ============================================
                // BUSCAR PONTO DE COLETA
                // ============================================

                try {

                    const pontoColeta =
                        await pontosColetaService
                            .buscarPontoPorId(
                                encontrada.pontoColetaId
                            )


                    setSolicitacao({
                        ...encontrada,
                        pontoColeta,
                    })

                } catch (error) {

                    console.error(
                        "Erro ao buscar ponto de coleta:",
                        error
                    )

                    setSolicitacao(
                        encontrada
                    )
                }


            } catch (error) {

                console.error(
                    "Erro ao carregar solicitação:",
                    error
                )

                addToast(
                    "Erro ao carregar dados da solicitação",
                    "error"
                )

            } finally {

                setLoading(false)
            }
        }


        carregar()

    }, [
        id,
        addToast,
        navigate,
    ])


    // ========================================================
    // LOADING
    // ========================================================

    if (
        loading ||
        !solicitacao
    ) {

        return (

            <div className="flex flex-col h-full items-center justify-center bg-background">

                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />

            </div>
        )
    }


    // ========================================================
    // STATUS
    // ========================================================

    const status =
        getStatusSolicitacaoInfo(
            solicitacao.status
        )


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="flex flex-col h-full overflow-hidden bg-background">

            <HeaderApp />


            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">

                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">


                    {/* ================================================= */}
                    {/* CABEÇALHO */}
                    {/* ================================================= */}

                    <div className="flex items-center gap-4 pt-2">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/my-requests"
                                )
                            }
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
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

                                <polyline
                                    points="15 18 9 12 15 6"
                                />

                            </svg>

                        </button>


                        <h1 className="text-xl font-bold text-green-primary">

                            Detalhes da Solicitação

                        </h1>

                    </div>


                    {/* ================================================= */}
                    {/* RESUMO DO PONTO */}
                    {/* ================================================= */}

                    <div
                        className={`
                            rounded-2xl
                            p-5
                            flex
                            flex-col
                            items-center
                            text-center
                            gap-2
                            ${status.bg}
                        `}
                    >

                        <h2
                            className={`
                                text-lg
                                font-bold
                                ${status.text}
                            `}
                        >

                            {getNomePonto(
                                solicitacao.pontoColeta
                            )}

                        </h2>


                        <p
                            className={`
                                text-xs
                                flex
                                items-center
                                gap-1
                                ${status.text}
                            `}
                        >

                            {getEnderecoPonto(
                                solicitacao.pontoColeta
                            )}

                        </p>


                        <span
                            className={`
                                inline-flex
                                items-center
                                gap-1
                                text-xs
                                font-bold
                                px-3
                                py-1
                                rounded-full
                                ${status.badgeBg}
                                ${status.text}
                            `}
                        >

                            {status.label}

                        </span>

                    </div>


                    {/* ================================================= */}
                    {/* DADOS DA SOLICITAÇÃO */}
                    {/* ================================================= */}

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">


                        {/* ================================================= */}
                        {/* TIPO DE ESTABELECIMENTO */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Tipo de estabelecimento

                            </label>

                            <Input
                                type="text"
                                value={
                                    getCategoriaLabel(
                                        solicitacao
                                            .pontoColeta
                                            ?.categoria
                                    )
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* NÚMERO DA SOLICITAÇÃO */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Número da solicitação

                            </label>

                            <Input
                                type="text"
                                value={
                                    `#SOL-${solicitacao.id}`
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* DATA DA SOLICITAÇÃO */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Data da solicitação

                            </label>

                            <Input
                                type="text"
                                value={
                                    formatarData(
                                        solicitacao
                                            .dataSolicitacao
                                    )
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        {/* ================================================= */}
                        {/* DATA DE AGENDAMENTO */}
                        {/* ================================================= */}

                        {solicitacao.dataAgendamento && (

                            <>

                                <hr className="border-white-100" />

                                <div className="py-2">

                                    <label className="block text-xs font-semibold text-gray-500 mb-1">

                                        Data de agendamento

                                    </label>

                                    <Input
                                        type="text"
                                        value={
                                            formatarData(
                                                solicitacao
                                                    .dataAgendamento
                                            )
                                        }
                                        disabled
                                        onChange={() => {}}
                                        noBorder
                                    />

                                </div>

                            </>
                        )}


                        {/* ================================================= */}
                        {/* DATA DE CONCLUSÃO */}
                        {/* ================================================= */}

                        {solicitacao.dataConclusao && (

                            <>

                                <hr className="border-white-100" />

                                <div className="py-2">

                                    <label className="block text-xs font-semibold text-gray-500 mb-1">

                                        Data de conclusão

                                    </label>

                                    <Input
                                        type="text"
                                        value={
                                            formatarData(
                                                solicitacao
                                                    .dataConclusao
                                            )
                                        }
                                        disabled
                                        onChange={() => {}}
                                        noBorder
                                    />

                                </div>

                            </>
                        )}


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* ENDEREÇO */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Endereço do ponto de coleta

                            </label>

                            <Input
                                type="text"
                                value={
                                    getEnderecoPonto(
                                        solicitacao
                                            .pontoColeta
                                    )
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* CEP */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                CEP

                            </label>

                            <Input
                                type="text"
                                value={
                                    solicitacao
                                        .pontoColeta
                                        ?.cep ||
                                    "-"
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* CAPACIDADE DA BOMBONA */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Capacidade da bombona

                            </label>

                            <Input
                                type="text"
                                value={
                                    solicitacao
                                        .pontoColeta
                                        ?.capacidadeBombona !=
                                    null
                                        ? `${Number(solicitacao.pontoColeta.capacidadeBombona)} L`
                                        : "-"
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        <hr className="border-white-100" />


                        {/* ================================================= */}
                        {/* VOLUME INFORMADO NA SOLICITAÇÃO */}
                        {/* ================================================= */}

                        <div className="py-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">

                                Volume informado na solicitação

                            </label>

                            <Input
                                type="text"
                                value={
                                    solicitacao
                                        .volumeInformado !=
                                    null
                                        ? `${solicitacao.volumeInformado} L`
                                        : "-"
                                }
                                disabled
                                onChange={() => {}}
                                noBorder
                            />

                        </div>


                        {/* ================================================= */}
                        {/* VOLUME COLETADO */}
                        {/* ================================================= */}

                        {solicitacao.volumeColetado != null && (

                            <>

                                <hr className="border-white-100" />

                                <div className="py-2">

                                    <label className="block text-xs font-semibold text-gray-500 mb-1">

                                        Volume coletado

                                    </label>

                                    <Input
                                        type="text"
                                        value={
                                            `${solicitacao.volumeColetado} L`
                                        }
                                        disabled
                                        onChange={() => {}}
                                        noBorder
                                    />

                                </div>

                            </>
                        )}


                        {/* ================================================= */}
                        {/* OBSERVAÇÕES */}
                        {/* ================================================= */}

                        {solicitacao.observacoes && (

                            <>

                                <hr className="border-white-100" />

                                <div className="py-2">

                                    <label className="block text-xs font-semibold text-gray-500 mb-1">

                                        Observações

                                    </label>

                                    <Input
                                        as="textarea"
                                        value={
                                            solicitacao
                                                .observacoes
                                        }
                                        disabled
                                        onChange={() => {}}
                                        noBorder
                                    />

                                </div>

                            </>
                        )}

                    </div>

                </div>

            </main>

        </div>
    )
}


export default RequestDetail