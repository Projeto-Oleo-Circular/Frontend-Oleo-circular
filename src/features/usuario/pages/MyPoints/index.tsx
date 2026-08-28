import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import { pontosColetaService, type PontoColeta } from "../../../../services/pontosColetaService"
import { getCategoriaIdPorLabel } from "../../../../constants/perfisParceiros"
import { getCategoriaCor } from "../../../../constants/categoriaCores"
import { getStatusPontoInfo } from "../../../../constants/statusPonto"

const ITENS_POR_PAGINA = 7

function MyPoints() {
    const navigate = useNavigate()
    const [pontos, setPontos] = useState<PontoColeta[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [pagina, setPagina] = useState(1)
    const [menuAbertoId, setMenuAbertoId] = useState<number | null>(null)

    useEffect(() => {
        const carregar = async () => {
            try {
                const data = await pontosColetaService.listarMeusPontos()
                setPontos(data)
            } catch (error) {
                console.error("Erro ao carregar pontos:", error)
            } finally {
                setLoading(false)
            }
        }
        carregar()
    }, [])

    const pontosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return pontos
        return pontos.filter((p) =>
            p.nomePontoColeta?.toLowerCase().includes(termo) ||
            p.logradouro?.toLowerCase().includes(termo) ||
            p.bairro?.toLowerCase().includes(termo) ||
            p.cidade?.toLowerCase().includes(termo)
        )
    }, [pontos, busca])

    const totalPaginas = Math.ceil(pontosFiltrados.length / ITENS_POR_PAGINA)
    const pontosPagina = pontosFiltrados.slice(
        (pagina - 1) * ITENS_POR_PAGINA,
        pagina * ITENS_POR_PAGINA
    )

    const handleBuscaChange = (valor: string) => {
        setBusca(valor)
        setPagina(1)
    }

    const handleExcluir = (id: number) => {
        // TODO: confirmar com a colega se existe DELETE /pontos-coleta/{id}
        // ou se a exclusão é feita via PUT com um campo de status.
        setMenuAbertoId(null)
        navigate(`/my-points/${id}`, { state: { abrirExclusao: true } })
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
                        <h1 className="text-xl font-bold text-green-primary">Meus Pontos</h1>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-white-200 px-3 py-2.5">
                            <svg className="w-4 h-4 text-white-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou endereço..."
                                value={busca}
                                onChange={(e) => handleBuscaChange(e.target.value)}
                                className="flex-1 outline-none text-sm bg-transparent text-black-200 placeholder:text-black-100"
                            />
                        </div>
                        {/* Filtro por categoria/status — se quiser, dá pra plugar um <Dropdown /> aqui depois */}
                    </div>

                    {!loading && (
                        <p className="text-xs text-white-500">
                            {pontosFiltrados.length} ponto{pontosFiltrados.length !== 1 ? "s" : ""} encontrado{pontosFiltrados.length !== 1 ? "s" : ""}
                        </p>
                    )}

                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && pontosFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <div className="w-20 h-20 rounded-full bg-white-200 flex items-center justify-center">
                                <img
                                    src="/assets/icons/icon-gota.svg"
                                    alt="Ponto não encontrado"
                                    className="w-10 h-10 object-contain"
                                />
                            </div>
                            <p className="text-sm text-white-600 max-w-[220px]">
                                Não foi possível localizar o seu ponto de coleta. Tente novamente.
                            </p>
                        </div>
                    )}

                    {!loading && pontosPagina.map((ponto) => {
                        const categoriaId = getCategoriaIdPorLabel(ponto.categoria || "")
                        const cor = getCategoriaCor(categoriaId ?? -1)
                        const status = getStatusPontoInfo(ponto.statusAprovacaoPontoColeta)

                        return (
                            <div key={ponto.id} className="bg-white rounded-xl border border-white-200 shadow-card overflow-hidden">
                                <div className={`flex items-center justify-between px-4 py-2.5 ${cor.bg}`}>
                                    <span className={`text-xs font-bold tracking-wide uppercase ${cor.text}`}>
                                        {ponto.categoria}
                                    </span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuAbertoId(menuAbertoId === ponto.id ? null : ponto.id)}
                                            className={`p-1 ${cor.text}`}
                                            aria-label="Mais opções"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="5" r="1.5" />
                                                <circle cx="12" cy="12" r="1.5" />
                                                <circle cx="12" cy="19" r="1.5" />
                                            </svg>
                                        </button>
                                        {menuAbertoId === ponto.id && (
                                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-white-100 py-1 z-10">
                                                <button
                                                    onClick={() => navigate(`/my-points/${ponto.id}`, { state: { editar: true } })}
                                                    className="w-full text-left px-3 py-2 text-sm text-black-200 hover:bg-green-50"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleExcluir(ponto.id)}
                                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/my-points/${ponto.id}`)}
                                    className="w-full text-left p-4 flex flex-col gap-1.5"
                                >
                                    <p className="font-bold text-black-primary">{ponto.nomePontoColeta}</p>
                                    <p className="text-xs text-white-500 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {ponto.logradouro}, {ponto.numero} - {ponto.bairro}, {ponto.cidade}
                                    </p>
                                    <p className="text-xs text-white-500">
                                        ~{ponto.expectativaGeracao} L/semana
                                    </p>
                                    <span className={`inline-flex w-fit items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </button>
                            </div>
                        )
                    })}

                    {!loading && totalPaginas > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                                disabled={pagina === 1}
                                className="p-2 text-white-500 disabled:opacity-30"
                            >
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
                            <button
                                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                                disabled={pagina === totalPaginas}
                                className="p-2 text-white-500 disabled:opacity-30"
                            >
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

export default MyPoints