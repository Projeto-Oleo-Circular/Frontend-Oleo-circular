import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import HeaderApp from "../../../../../components/layout/HeaderApp"
import Input from "../../../../../components/ui/Input"
import useToast from "../../../../../hooks/useToast"
import { getEnderecoPonto, getNomePonto, solicitacaoColetaService, type SolicitacaoColeta } from "../../../../../services/solicitacaoColetaService"
import { getStatusSolicitacaoInfo } from "../../../../../constants/statusSolicitacao"
import { pontosColetaService } from "../../../../../services/pontosColetaService"
import { PERFIS_PARCEIRO } from "../../../../../constants/perfisParceiros"
import { authService } from "../../../../../services/authService"

function formatarData(dataIso: string | null | undefined): string {
    if (!dataIso) return "-"
    const data = new Date(dataIso)
    return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

function getCategoriaLabel(categoria: number | string | undefined | null): string {
    if (categoria == null) return "-"
    if (typeof categoria === "string") return categoria
    const tag = PERFIS_PARCEIRO.flatMap((p) => p.tags).find((t) => t.categoriaId === categoria)
    return tag?.label || `Categoria ${categoria}`
}

function RequestDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [solicitacao, setSolicitacao] = useState<any>(null)
    // const [contato, setContato] = useState<{ telefone?: string; email?: string }>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const carregar = async () => {
            try {
                const [todas, userData] = await Promise.all([
                    solicitacaoColetaService.listarSolicitacoes(),
                    authService.getUserData().catch(() => null),
                ])

//                 if (userData) {
//                     setContato({ 
//                         telefone: userData.telefone || "-", 
//                         email: userData.email || "-" 
//                     })
// }

                const encontrada = todas.find((s: any) => String(s.id) === id)
                if (!encontrada) {
                    addToast("Solicitação não encontrada", "error")
                    navigate("/my-requests")
                    return
                }

                try {
                    const pontoColeta = await pontosColetaService.buscarPontoPorId(encontrada.pontoColetaId)
                    setSolicitacao({ ...encontrada, pontoColeta })
                } catch {
                    setSolicitacao(encontrada)
                }
            } catch (error) {
                addToast("Erro ao carregar dados da solicitação", "error")
            } finally {
                setLoading(false)
            }
        }
        carregar()
    }, [id])

    if (loading || !solicitacao) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const status = getStatusSolicitacaoInfo(solicitacao.status)

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={() => navigate("/my-requests")}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Detalhes da Solicitação</h1>
                    </div>

                    <div className={`rounded-2xl p-5 flex flex-col items-center text-center gap-2 ${status.bg}`}>
                        <h2 className="text-lg font-bold text-black-primary">
                            {getNomePonto(solicitacao.pontoColeta)}
                        </h2>
                        <p className={`text-xs flex items-center gap-1 ${status.text}`}>
                            {getEnderecoPonto(solicitacao.pontoColeta)}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-white-primary ${status.text}`}>
                            {status.label}
                        </span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        
                        {/* # lembrar de colocar os nomes da labels n da pra identidficar as informações quando chegam nos litros de oleo */}
                        <Input
                            type="text" 
                            placeholder="Tipo de estabelecimento" 
                            value={getCategoriaLabel(solicitacao.pontoColeta?.categoria)} 
                            disabled 
                            onChange={() => {}} 
                            noBorder />
                        <hr className="border-white-100" />

                        <Input
                            type="text" 
                            placeholder="Número da solicitação" 
                            value={`#SOL-${solicitacao.id}`} 
                            disabled onChange={() => {}} 
                            noBorder />
                        <hr className="border-white-100" />

                        <Input
                            type="text"
                            placeholder="Data de solicitação"
                            value={formatarData(solicitacao.dataSolicitacao)}
                            disabled onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" />

                        {solicitacao.dataAgendamento && (
                            <>
                                <Input
                                    type="text"
                                    placeholder="Data de agendamento"
                                    value={formatarData(solicitacao.dataAgendamento)}
                                    disabled onChange={() => {}}
                                    noBorder />
                                <hr className="border-white-100" />
                            </>
                        )}
                        {solicitacao.dataConclusao && (
                            <>
                                <Input
                                    type="text"
                                    placeholder="Data de conclusão"
                                    value={formatarData(solicitacao.dataConclusao)}
                                    disabled
                                    onChange={() => {}}
                                    noBorder />
                                <hr className="border-white-100" />
                            </>
                        )}
                        <Input
                            type="text"
                            placeholder="Endereço"
                            value={getEnderecoPonto(solicitacao.pontoColeta)}
                            disabled
                            onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" />

                        <Input
                            type="text"
                            placeholder="CEP"
                            value={solicitacao.pontoColeta?.cep || "-"}
                            disabled
                            onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" />
{/* nem sei da onde vc ta puzando email e contato e nem sei se precisa pra essa tela */}
                        {/* <Input
                            type="text"
                            placeholder="Telefone"
                            value={contato.telefone || "-"}
                            disabled
                            onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" />

                        <Input
                            type="text"
                            placeholder="E-mail"
                            value={contato.email || "-"}
                            disabled
                            onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" /> */}

                        <Input
                            type="text"
                            placeholder="Volume informado"
                            value={solicitacao.pontoColeta?.capacidadeBombona ? `${solicitacao.pontoColeta.capacidadeBombona} L` : "-"}
                            disabled onChange={() => {}}
                            noBorder />
                        <hr className="border-white-100" />
                                
                        <Input
                            type="text"
                            placeholder="Volume informado na solicitação"
                            value={`${solicitacao.volumeInformado} L`}
                            disabled onChange={() => {}}
                            noBorder />
                        {solicitacao.volumeColetado != null && (
                            <>
                                <hr className="border-white-100" />
                                <Input 
                                    as="text"
                                    placeholder="Volume coletado"
                                    value={`${solicitacao.volumeColetado} L`}
                                    disabled 
                                    onChange={() => {}}   noBorder />
                            </>
                        )}
                        {solicitacao.observacoes && (
                            <>
                                <hr className="border-white-100" />
                                <Input as="textarea" placeholder="Observações" value={solicitacao.observacoes} disabled onChange={() => {}} />
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default RequestDetail