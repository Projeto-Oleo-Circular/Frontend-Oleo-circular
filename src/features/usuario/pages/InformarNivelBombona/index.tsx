import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import { authService } from "../../../../services/authService"
import { pontosColetaService, type PontoColeta } from "../../../../services/pontosColetaService"
import useToast from "../../../../hooks/useToast"

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

]

function InformarNivelBombona() {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [userName, setUserName] = useState("Usuário")
    const [nivelSelecionado, setNivelSelecionado] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingPontos, setLoadingPontos] = useState(true)
    const [pontoSelecionado, setPontoSelecionado] = useState<PontoColeta | null>(null)

    useEffect(() => {
        const carregarDadosUsuario = async () => {
            try {
                const userData = await authService.getUserData()
                if (userData?.nomeRazaoSocial || userData?.nomeSocial) {
                    const nomeCompleto = userData.nomeRazaoSocial || userData.nomeSocial || "Usuário"
                    const primeiroNome = nomeCompleto.split(" ")[0]
                    setUserName(primeiroNome)
                }
            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error)
            }
        }
        carregarDadosUsuario()
    }, [])

    useEffect(() => {
        const carregarPontos = async () => {
            try {
                const data = await pontosColetaService.listarMeusPontos()
                if (data.length > 0) {
                    setPontoSelecionado(data[0])
                    if (data[0].nivelAtualPct) {
                        setNivelSelecionado(data[0].nivelAtualPct)
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar pontos de coleta:", error)
                addToast("Erro ao carregar dados da bombona", "error")
            } finally {
                setLoadingPontos(false)
            }
        }
        carregarPontos()
    }, [])

    const handleNivelSelect = (value: number) => {
        setNivelSelecionado(value)
    }

    const calcularStatusBombona = (nivel: number): string => {
    if (nivel === 0) return "VAZIA";
    if (nivel === 100) return "CHEIA";
    return "PARCIAL";
};

const handleSalvar = async () => {
    if (nivelSelecionado === null || !pontoSelecionado) return;

    setLoading(true);
    try {
        const statusBombona = calcularStatusBombona(nivelSelecionado);

        await pontosColetaService.atualizarPontoColeta(pontoSelecionado.id, {
            nivelAtualPct: nivelSelecionado,
            statusBombona,
        });

        addToast("Nível da bombona atualizado com sucesso!", "success");
        navigate("/home");
    } catch (error) {
        console.error("Erro ao salvar nível:", error);
        addToast("Erro ao atualizar o nível da bombona", "error");
    } finally {
        setLoading(false);
    }
};

    const getStatusLabel = (value: number): string => {
        if (value === 100) return "Cheia"
        if (value >= 75) return "Quase cheia"
        if (value >= 50) return "Meia cheia"
        if (value >= 25) return "Quase vazia"
        return "Vazia"
    }

    if (loadingPontos) {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-background">
                <HeaderApp userName={userName} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-white-500 mt-4">Carregando...</p>
                    </div>
                </main>
            </div>
        )
    }

    if (!pontoSelecionado) {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-background">
                <HeaderApp userName={userName} />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-green-primary">Nenhum ponto de coleta</h2>
                        <p className="text-white-500 mt-2">
                            Você precisa cadastrar um ponto de coleta para informar o nível da bombona.
                        </p>
                        <Button
                            onClick={() => navigate("/register-point")}
                            variant="primary"
                            className="mt-4"
                        >
                            Cadastrar Ponto
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp userName={userName} />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto space-y-6 pb-8">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-green-primary">
                            Informar nível da bombona
                        </h1>
                        <p className="text-sm text-white-600 mt-1">
                            Qual o nível da sua bombona?
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-28 h-40 bg-gray-200 rounded-t-3xl rounded-b-xl overflow-hidden border-2 border-gray-300 shadow-lg">
                            <div 
                                className="absolute bottom-0 w-full bg-green-primary transition-all duration-700"
                                style={{ height: `${nivelSelecionado ?? 0}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white drop-shadow-md">
                                    {nivelSelecionado ?? 0}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3 w-full">
                            {NIVEL_OPCOES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => handleNivelSelect(value)}
                                    className={`
                                        flex items-center justify-center rounded-xl border-2 py-3 px-2 transition-all duration-200 text-sm sm:text-base
                                        ${nivelSelecionado === value 
                                            ? 'border-green-primary bg-green-50 text-green-primary font-bold shadow-card' 
                                            : 'border-white-200 bg-white hover:border-green-primary hover:bg-green-50'
                                        }
                                    `}
                                >
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        {nivelSelecionado !== null && (
                            <div className="bg-green-50 rounded-xl px-4 py-2 text-center w-full animate-slide-in">
                                <p className="text-sm text-black-primary">Status</p>
                                <p className="font-bold text-green-primary text-lg">
                                    {getStatusLabel(nivelSelecionado)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white-primary rounded-2xl shadow-card p-4 flex justify-between items-center">
                        <span className="text-sm text-black-primary">Capacidade da bombona</span>
                        <span className="font-bold text-green-primary text-lg">
                            {pontoSelecionado.capacidadeBombona} Litros
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleSalvar}
                            disabled={nivelSelecionado === null || loading}
                            variant="primary"
                            fullWidth
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>

                        <Button
                            onClick={() => navigate("/home")}
                            variant="secondary"
                            fullWidth
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default InformarNivelBombona