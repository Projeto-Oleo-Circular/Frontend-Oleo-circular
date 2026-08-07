import { useEffect, useState, useCallback } from "react";
import {
    adminSolicitacoesService,
    type SolicitacaoColeta,
    type StatusSolicitacao,
} from "../../../../services/AdminSolicitacaoService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import AdminTopNav from "../../../../components/layout/AdminTopNav"

interface Contagens {
    aguardando: number;
    agendada: number;
    emRota: number;
    concluida: number;
    total: number;
}

type ModalTipo = "agendar" | "concluir" | null;

function formatarData(iso: string | null): string {
    if (!iso) return "—";
    const data = new Date(iso);
    return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatarEndereco(ponto: SolicitacaoColeta["pontoColeta"]): string {
    const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
    return ponto.estado ? `${base}/${ponto.estado}` : base;
}

function Requests() {
    const [itens, setItens] = useState<SolicitacaoColeta[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | "">("");
    const [loading, setLoading] = useState(true);

    const [contagens, setContagens] = useState<Contagens | null>(null);

    const [modal, setModal] = useState<{ tipo: ModalTipo; solicitacao: SolicitacaoColeta | null }>({
        tipo: null,
        solicitacao: null,
    });
    const [dataAgendamento, setDataAgendamento] = useState("");
    const [volumeColetado, setVolumeColetado] = useState("");
    const [salvando, setSalvando] = useState(false);

    const carregarLista = useCallback(async () => {
        setLoading(true);
        try {
            const resposta = await adminSolicitacoesService.listar({
                page,
                limit: 10,
                status: statusFiltro || undefined,
            });
            setItens(resposta.items);
            setTotalPages(resposta.totalPages);
        } catch (error) {
            console.error("Erro ao carregar solicitações:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFiltro]);

    const carregarContagens = useCallback(async () => {
        try {
            const [aguardando, agendada, emRota, concluida, total] = await Promise.all([
                adminSolicitacoesService.listar({ status: "AGUARDANDO", limit: 1 }),
                adminSolicitacoesService.listar({ status: "AGENDADA", limit: 1 }),
                adminSolicitacoesService.listar({ status: "EM_ROTA", limit: 1 }),
                adminSolicitacoesService.listar({ status: "CONCLUIDA", limit: 1 }),
                adminSolicitacoesService.listar({ limit: 1 }),
            ]);
            setContagens({
                aguardando: aguardando.total,
                agendada: agendada.total,
                emRota: emRota.total,
                concluida: concluida.total,
                total: total.total,
            });
        } catch (error) {
            console.error("Erro ao carregar contagens:", error);
        }
    }, []);

    useEffect(() => {
        carregarLista();
    }, [carregarLista]);

    useEffect(() => {
        carregarContagens();
    }, [carregarContagens]);

    const abrirModal = (tipo: ModalTipo, solicitacao: SolicitacaoColeta) => {
        setModal({ tipo, solicitacao });
        setDataAgendamento("");
        setVolumeColetado("");
    };

    const fecharModal = () => setModal({ tipo: null, solicitacao: null });

    const confirmarTransicaoSimples = async (solicitacao: SolicitacaoColeta, novoStatus: StatusSolicitacao) => {
        setSalvando(true);
        try {
            await adminSolicitacoesService.atualizarStatus(solicitacao.id, { status: novoStatus });
            await Promise.all([carregarLista(), carregarContagens()]);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        } finally {
            setSalvando(false);
        }
    };

    const confirmarModal = async () => {
        if (!modal.solicitacao || !modal.tipo) return;
        setSalvando(true);
        try {
            if (modal.tipo === "agendar") {
                await adminSolicitacoesService.atualizarStatus(modal.solicitacao.id, {
                    status: "AGENDADA",
                    dataAgendamento: new Date(dataAgendamento).toISOString(),
                });
            } else if (modal.tipo === "concluir") {
                await adminSolicitacoesService.atualizarStatus(modal.solicitacao.id, {
                    status: "CONCLUIDA",
                    volumeColetado: Number(volumeColetado),
                });
            }
            await Promise.all([carregarLista(), carregarContagens()]);
            fecharModal();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        } finally {
            setSalvando(false);
        }
    };

    const renderAcao = (solicitacao: SolicitacaoColeta) => {
        switch (solicitacao.status) {
            case "AGUARDANDO":
                return (
                    <button
                        onClick={() => abrirModal("agendar", solicitacao)}
                        className="px-3 py-1.5 rounded-lg border border-green-primary text-green-primary text-xs font-semibold hover:bg-green-primary/10"
                    >
                        Agendar
                    </button>
                );
            case "AGENDADA":
                return (
                    <button
                        onClick={() => confirmarTransicaoSimples(solicitacao, "EM_ROTA")}
                        disabled={salvando}
                        className="px-3 py-1.5 rounded-lg border border-purple-500 text-purple-600 text-xs font-semibold hover:bg-purple-50 disabled:opacity-50"
                    >
                        Em Rota
                    </button>
                );
            case "EM_ROTA":
                return (
                    <button
                        onClick={() => abrirModal("concluir", solicitacao)}
                        className="px-3 py-1.5 rounded-lg border border-green-primary text-green-primary text-xs font-semibold hover:bg-green-primary/10"
                    >
                        Concluir
                    </button>
                );
            case "CONCLUIDA":
                return (
                    <span className="px-3 py-1.5 rounded-lg border border-white-200 text-white-500 text-xs font-semibold">
                        Detalhes
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen fle flex-col bg-white">
            <AdminTopNav />

            <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                <h1 className="text-2xl font-bold text-black-primary mb-1">Solicitações de coleta</h1>
                <p className="text-sm text-white-500 mb-6">
                    Acompanhe e gerencie todas as solicitações de coleta de óleo de cozinha usado.
                </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <CardResumo label="Aguardando" valor={contagens?.aguardando} />
                <CardResumo label="Agendadas" valor={contagens?.agendada} />
                <CardResumo label="Em Rota" valor={contagens?.emRota} />
                <CardResumo label="Concluídas" valor={contagens?.concluida} />
                <CardResumo label="Total de Solicitações" valor={contagens?.total} destaque />
            </div>

            <div className="flex items-center gap-3 mb-4">
                <select
                    value={statusFiltro}
                    onChange={(e) => {
                        setPage(1);
                        setStatusFiltro(e.target.value as StatusSolicitacao | "");
                    }}
                    className="border border-white-200 rounded-lg px-3 py-2 text-sm text-black-primary"
                >
                    <option value="">Todos os status</option>
                    <option value="AGUARDANDO">Aguardando</option>
                    <option value="AGENDADA">Agendada</option>
                    <option value="EM_ROTA">Em Rota</option>
                    <option value="CONCLUIDA">Concluída</option>
                </select>
            </div>

            <div className="bg-white-primary rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-white-500 border-b border-white-100">
                            <th className="p-4 font-medium">ID</th>
                            <th className="p-4 font-medium">Solicitante</th>
                            <th className="p-4 font-medium">Data da Solicitação</th>
                            <th className="p-4 font-medium">Endereço</th>
                            <th className="p-4 font-medium">Ponto de Coleta</th>
                            <th className="p-4 font-medium">Tamanho da Bombona</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-white-500">
                                    Carregando...
                                </td>
                            </tr>
                        ) : itens.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-white-500">
                                    Nenhuma solicitação encontrada.
                                </td>
                            </tr>
                        ) : (
                            itens.map((s) => (
                                <tr key={s.id} className="border-b border-white-100 last:border-0">
                                    <td className="p-4 font-semibold text-black-primary">#{s.id}</td>
                                    <td className="p-4 text-black-primary">{s.parceiro.nomeRazaoSocial}</td>
                                    <td className="p-4 text-white-500">{formatarData(s.dataSolicitacao)}</td>
                                    <td className="p-4 text-white-500">{formatarEndereco(s.pontoColeta)}</td>
                                    <td className="p-4 text-black-primary">{s.pontoColeta.nomePontoColeta}</td>
                                    <td className="p-4 text-black-primary">{s.pontoColeta.capacidadeBombona} L</td>
                                    <td className="p-4">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="p-4">{renderAcao(s)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-white-500">
                    Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-white-200 text-sm disabled:opacity-40"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-white-200 text-sm disabled:opacity-40"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {modal.tipo && modal.solicitacao && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="font-bold text-lg text-black-primary mb-4">
                            {modal.tipo === "agendar" ? "Agendar coleta" : "Concluir coleta"} — #{modal.solicitacao.id}
                        </h2>

                        {modal.tipo === "agendar" && (
                            <label className="block mb-4">
                                <span className="text-sm text-white-500">Data do agendamento</span>
                                <input
                                    type="datetime-local"
                                    value={dataAgendamento}
                                    onChange={(e) => setDataAgendamento(e.target.value)}
                                    className="w-full border border-white-200 rounded-lg px-3 py-2 mt-1"
                                />
                            </label>
                        )}

                        {modal.tipo === "concluir" && (
                            <label className="block mb-4">
                                <span className="text-sm text-white-500">Volume coletado (litros)</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={volumeColetado}
                                    onChange={(e) => setVolumeColetado(e.target.value)}
                                    className="w-full border border-white-200 rounded-lg px-3 py-2 mt-1"
                                />
                            </label>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={fecharModal}
                                disabled={salvando}
                                className="flex-1 py-2 rounded-lg border border-white-200 text-black-primary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarModal}
                                disabled={
                                    salvando ||
                                    (modal.tipo === "agendar" && !dataAgendamento) ||
                                    (modal.tipo === "concluir" && !volumeColetado)
                                }
                                className="flex-1 py-2 rounded-lg bg-green-primary text-white font-semibold disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}

function CardResumo({ label, valor, destaque }: { label: string; valor?: number; destaque?: boolean }) {
    return (
        <div className={`rounded-xl p-4 ${destaque ? "bg-green-primary/10" : "bg-white-primary shadow-sm"}`}>
            <p className="text-sm text-white-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-black-primary">
                {valor === undefined ? "—" : valor}
            </p>
        </div>
    );
}

export default Requests;
