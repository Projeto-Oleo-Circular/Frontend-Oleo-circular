import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import HeaderApp from "../../../../components/layout/HeaderApp"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import useToast from "../../../../hooks/useToast"
import { authService } from "../../../../services/authService"

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function formatarDesde(dataIso: string): string {
    const data = new Date(dataIso)
    return `${MESES[data.getMonth()]}. ${data.getFullYear()}`
}

function Profile() {
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [editando, setEditando] = useState(false)
    const [modalSaidaAberta, setModalSaidaAberta] = useState(false)
    const [saindo, setSaindo] = useState(false)

    const [userData, setUserData] = useState<any>(null)

    const [form, setForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        senhaAtual: "",
        novaSenha: "",
    })

    const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
    const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

    useEffect(() => {
        const carregar = async () => {
            try {
                const data = await authService.getUserData()
                setUserData(data)
                setForm((prev) => ({
                    ...prev,
                    nome: data?.razaoSocial || data?.nome || "",
                    email: data?.email || "",
                    telefone: data?.telefone || "",
                }))
            } catch (error) {
                addToast("Erro ao carregar dados do perfil", "error")
            } finally {
                setLoading(false)
            }
        }
        carregar()
    }, [addToast])

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSalvar = async () => {
        try {
            setSalvando(true)

            await authService.atualizarPerfil({
                nome: form.nome.trim(),
                email: form.email.trim(),
                telefone: form.telefone.replace(/\D/g, ""),
            })

            if (form.senhaAtual && form.novaSenha) {
                await authService.alterarSenha({
                    senhaAtual: form.senhaAtual,
                    novaSenha: form.novaSenha,
                })
            }

            addToast("Perfil atualizado com sucesso!", "success")
            setForm((prev) => ({ ...prev, senhaAtual: "", novaSenha: "" }))
            setEditando(false)

            const dataAtualizada = await authService.getUserData()
            setUserData(dataAtualizada)
        } catch (error: any) {
            addToast(error.response?.data?.message || "Erro ao salvar alterações", "error")
        } finally {
            setSalvando(false)
        }
    }

    const handleCancelarEdicao = () => {
        setForm({
            nome: userData?.razaoSocial || userData?.nome || "",
            email: userData?.email || "",
            telefone: userData?.telefone || "",
            senhaAtual: "",
            novaSenha: "",
        })
        setEditando(false)
    }

    const handleSair = () => {
        setSaindo(true)
        authService.logout()
        setTimeout(() => {
            navigate("/login")
        }, 300)
    }

    const getInitials = (nome: string) => nome?.charAt(0)?.toUpperCase() || "U"

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const nomeExibicao = userData?.razaoSocial || userData?.nome || "Usuário"

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            <HeaderApp userName={nomeExibicao} />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={() => (editando ? handleCancelarEdicao() : navigate("/home"))}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">
                            {editando ? "Editar Perfil" : "Perfil"}
                        </h1>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-28 h-28 rounded-full bg-green-primary text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md">
                            {getInitials(nomeExibicao)}
                        </div>

                        {!editando && (
                            <div className="text-center">
                                <p className="text-lg font-bold text-black-primary">{nomeExibicao}</p>
                                <p className="text-sm text-white-500">{userData?.email}</p>
                            </div>
                        )}
                    </div>

                    {!editando ? (
                        <>
                            <Button onClick={() => setEditando(true)} variant="secondary" fullWidth>
                                Editar perfil
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-black-primary">
                                        {userData?.pontosColeta?.length ?? 0}
                                    </p>
                                    <p className="text-xs font-bold text-white-600 tracking-wide uppercase">Pontos</p>
                                </div>
                                <div className="bg-green-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-black-primary">
                                        {userData?.criadoEm ? formatarDesde(userData.criadoEm) : "-"}
                                    </p>
                                    <p className="text-xs font-bold text-white-600 tracking-wide uppercase">Desde</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <button
                                    onClick={() => navigate("/sobre")}
                                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-green-50"
                                >
                                    <span className="flex items-center gap-3 text-sm font-medium text-black-200">
                                        <img src="/assets/icons/icon-info2.svg" alt="" className="w-5 h-5" />
                                        Sobre o Óleo Circular
                                    </span>
                                    <svg className="w-4 h-4 text-white-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <hr className="border-white-100" />
                                <button
                                    onClick={() => navigate("/privacidade")}
                                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-green-50"
                                >
                                    <span className="flex items-center gap-3 text-sm font-medium text-black-200">
                                        <img src="/assets/icons/icon-privacidade.svg" alt="" className="w-5 h-5" />
                                        Política de Privacidade
                                    </span>
                                    <svg className="w-4 h-4 text-white-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <hr className="border-white-100" />
                                <button
                                    onClick={() => navigate("/termos")}
                                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-green-50"
                                >
                                    <span className="flex items-center gap-3 text-sm font-medium text-black-200">
                                        <img src="/assets/icons/icon-termos.svg" alt="" className="w-5 h-5" />
                                        Termos de Uso
                                    </span>
                                    <svg className="w-4 h-4 text-white-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <Button onClick={() => setModalSaidaAberta(true)} variant="danger" fullWidth>
                                Sair do aplicativo
                            </Button>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs font-bold text-white-500 tracking-widest mb-3">
                                    INFORMAÇÕES PESSOAIS
                                </p>
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <Input
                                        type="text"
                                        icon="icon-name"
                                        placeholder="Nome completo"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        noBorder
                                    />
                                    <hr className="border-white-100" />
                                    <Input
                                        type="email"
                                        icon="email"
                                        placeholder="E-mail"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        noBorder
                                    />
                                    <hr className="border-white-100" />
                                    <Input
                                        type="tel"
                                        icon="phone"
                                        placeholder="Telefone"
                                        name="telefone"
                                        value={form.telefone}
                                        onChange={handleChange}
                                        noBorder
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-white-500 tracking-widest mb-3">
                                    ALTERAR SENHA
                                </p>
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <Input
                                        type="password"
                                        icon="cadeado"
                                        placeholder="Senha atual"
                                        name="senhaAtual"
                                        value={form.senhaAtual}
                                        onChange={handleChange}
                                        noBorder
                                    />
                                    <hr className="border-white-100" />
                                    <Input
                                        type="password"
                                        icon="cadeado"
                                        placeholder="Nova senha"
                                        name="novaSenha"
                                        value={form.novaSenha}
                                        onChange={handleChange}
                                        noBorder
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button onClick={handleSalvar} loading={salvando} variant="primary" fullWidth>
                                    Salvar alterações
                                </Button>
                                <Button onClick={handleCancelarEdicao} variant="secondary" fullWidth disabled={salvando}>
                                    Cancelar
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {modalSaidaAberta && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl animate-fade-in-up">
                        <img
                            src="/assets/fundo-popUp-superior.svg"
                            alt=""
                            className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />
                        <img
                            src="/assets/fundo-popUp-inferior.svg"
                            alt=""
                            className="absolute -bottom-10 -left-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />

                        <div className="relative z-10 flex flex-col gap-4 pt-2">
                            <div>
                                <h3 className="text-xl font-bold text-green-700 mb-2">Confirmar saída</h3>
                                <p className="text-sm text-black-200 leading-relaxed">
                                    Tem certeza que deseja sair?
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSair} loading={saindo} variant="danger" fullWidth>
                                    Sair
                                </Button>
                                <Button
                                    onClick={() => setModalSaidaAberta(false)}
                                    variant="outline"
                                    fullWidth
                                    disabled={saindo}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile