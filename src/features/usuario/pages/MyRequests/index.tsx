import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import { enriquecerComPontoColeta, getEnderecoPonto, getNomePonto, solicitacaoColetaService, type SolicitacaoColeta } from "../../../../services/solicitacaoColetaService"
import { getStatusSolicitacaoInfo } from "../../../../constants/statusSolicitacao"

const ITENS_POR_PAGINA = 7

function formatarData(dataIso: string | null): string {
    if (!dataIso) return "-"
    const data = new Date(dataIso)
    return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

function MyRequests() {
    const navigate = useNavigate()
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoColeta[]>([])
    const [loading, setLoading] = useState(true)
    const [aba, setAba] = useState<"solicitacoes" | "historico">("solicitacoes")
    const [busca, setBusca] = useState("")
    const [pagina, setPagina] = useState(1)

    useEffect(() => {
        const carregar = async () => {
            try {
                const data = await solicitacaoColetaService.listarSolicitacoes()
                const enriquecidas = await enriquecerComPontoColeta(data)
                setSolicitacoes(enriquecidas)
            } catch (error) {
                console.error("Erro ao carregar solicitações:", error)
            } finally {
                setLoading(false)
            }
        }
        carregar()
    }, [])

    const solicitacoesDaAba = useMemo(() => {
        return solicitacoes.filter((s) =>
            aba === "historico" ? s.status === "CONCLUIDA" : s.status !== "CONCLUIDA"
        )
    }, [solicitacoes, aba])

    const solicitacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return solicitacoesDaAba
        return solicitacoesDaAba.filter((s: any) =>
            getNomePonto(s.pontoColeta).toLowerCase().includes(termo) ||
            getEnderecoPonto(s.pontoColeta).toLowerCase().includes(termo)
        )
    }, [solicitacoesDaAba, busca])

    const totalPaginas = Math.ceil(solicitacoesFiltradas.length / ITENS_POR_PAGINA)
    const solicitacoesPagina = solicitacoesFiltradas.slice(
        (pagina - 1) * ITENS_POR_PAGINA,
        pagina * ITENS_POR_PAGINA
    )

    const handleTrocarAba = (novaAba: "solicitacoes" | "historico") => {
        setAba(novaAba)
        setPagina(1)
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={() => navigate("/home")}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Minhas Coletas</h1>
                    </div>

                    <div className="flex bg-white-priamry rounded-xl p-1 gap-1 border border-green-200">
                        <button
                            onClick={() => handleTrocarAba("solicitacoes")}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                aba === "solicitacoes" ? "bg-green-primary text-white" : "text-white-600"
                            }`}
                        >
                            Solicitações ativas
                        </button>
                        <button
                            onClick={() => handleTrocarAba("historico")}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                aba === "historico" ? "bg-green-primary text-white" : "text-white-600"
                            }`}
                        >
                            Histórico
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white rounded-xl border border-white-200 px-3 py-2.5">
                        <svg className="w-4 h-4 text-white-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou endereço..."
                            value={busca}
                            onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
                            className="flex-1 outline-none text-sm bg-transparent text-black-100 placeholder:text-black-100"
                        />
                    </div>

                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && solicitacoesFiltradas.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <div className="w-20 h-20 rounded-full bg-white-200 flex items-center justify-center">
                                <img
                                    src="/assets/icons/icon-gota.svg"
                                    alt="Ponto não encontrado"
                                    className="w-10 h-10 object-contain"
                                />
                            </div>
                            <p className="text-sm text-white-600 max-w-[220px]">
                                Não foi possível localizar a sua solicitação. Tente novamente.
                            </p>
                        </div>
                    )}

                    {!loading && solicitacoesPagina.map((solicitacao: any) => {
                        const status = getStatusSolicitacaoInfo(solicitacao.status)
                        return (
                            <div key={solicitacao.id} className="bg-white rounded-xl border border-white-200 shadow-card p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-black-primary">
                                        #SOL-{solicitacao.id}
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-white-500">Data de solicitação</p>
                                    <p className="text-sm text-black-200">{formatarData(solicitacao.dataSolicitacao)}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-white-500">Endereço</p>
                                    <p className="text-sm text-black-200">{getEnderecoPonto(solicitacao.pontoColeta)}</p>
                                </div>

                                <button
                                    onClick={() => navigate(`/my-requests/${solicitacao.id}`)}
                                    className="w-full mt-1 border-2 border-green-primary text-green-primary font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-green-50"
                                >
                                    Ver detalhes
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </div>
                        )
                    })}

                    {!loading && totalPaginas > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="p-2 text-white-500 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setPagina(num)}
                                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                        num === pagina ? "bg-green-primary text-white" : "bg-white-200 text-black-200"
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-2 text-white-500 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default MyRequests