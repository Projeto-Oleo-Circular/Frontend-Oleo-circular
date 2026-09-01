import { useState, useEffect, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import AdminTopNav from "../../../../components/layout/AdminTopNav"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import useToast from "../../../../hooks/useToast"
import { adminAuthService, AdminUser } from "../../../../services/adminAuthService"

function Profile() {
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [editando, setEditando] = useState(false)
    const [modalSaidaAberta, setModalSaidaAberta] = useState(false)
    const [saindo, setSaindo] = useState(false)

    const [userData, setUserData] = useState<AdminUser | null>(null)

    const [form, setForm] = useState({
        nome: "",
        email: "",
        senhaAtual: "",
        novaSenha: "",
    })

    useEffect(() => {
        const carregar = async () => {
            try {
                const data = await adminAuthService.getMe()
                setUserData(data)
                setForm((prev) => ({
                    ...prev,
                    nome: data?.nome || "",
                    email: data?.email || "",
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

            const adminAtual = adminAuthService.getCurrentAdmin()
            if (!adminAtual) throw new Error("Usuário não autenticado.")

            const payload: { nome: string; email: string; senhaAtual?: string; novaSenha?: string } = {
                nome: form.nome.trim(),
                email: form.email.trim(),
            }

            if (form.novaSenha) {
                if (form.novaSenha.length < 6) {
                    addToast("A nova senha deve ter pelo menos 6 caracteres.", "error")
                    setSalvando(false)
                    return
                }
                if (!form.senhaAtual) {
                    addToast("Digite sua senha atual para autorizar a mudança.", "error")
                    setSalvando(false)
                    return
                }
                payload.senhaAtual = form.senhaAtual;
                payload.novaSenha = form.novaSenha;
            }

            await adminAuthService.updateAdmin(adminAtual.id, payload)

            addToast("Perfil atualizado com sucesso!", "success")
            setForm((prev) => ({ ...prev, senhaAtual: "", novaSenha: "" }))
            setEditando(false)

            const dataAtualizada = await adminAuthService.getMe()
            setUserData(dataAtualizada)
            setForm((prev) => ({
                ...prev,
                nome: dataAtualizada?.nome || "",
                email: dataAtualizada?.email || "",
            }))
        } catch (error: any) {
            console.error("Erro ao salvar:", error)
            addToast(error.response?.data?.message || "Erro ao salvar alterações", "error")
        } finally {
            setSalvando(false)
        }
    }

    const handleCancelarEdicao = () => {
        setForm({
            nome: userData?.nome || "",
            email: userData?.email || "",
            senhaAtual: "",
            novaSenha: "",
        })
        setEditando(false)
    }

    const handleSair = () => {
        setSaindo(true)
        adminAuthService.logout()
        setTimeout(() => {
            navigate("/login")
        }, 300)
    }

    const getInitials = (nome: string) => nome?.charAt(0)?.toUpperCase() || "A"

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background p-4">
                <p className="text-red-600 text-center">Não foi possível carregar os dados do perfil.</p>
                <Button onClick={() => navigate("/home")} variant="secondary" className="mt-4">
                    Voltar
                </Button>
            </div>
        )
    }

    const nomeExibicao = userData.nome || "Administrador"
    const nivelAcesso = userData.nivelAcesso || "Administrador"

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            <AdminTopNav />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={() => (editando ? handleCancelarEdicao() : navigate("/admin/dashboard"))}
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
                                <p className="text-sm text-green-600 font-semibold">{nivelAcesso}</p>
                                <p className="text-sm text-white-500">{userData.email}</p>
                            </div>
                        )}
                    </div>

                    {!editando ? (
                        <>
                            <Button onClick={() => setEditando(true)} variant="secondary" fullWidth>
                                Editar perfil
                            </Button>

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
                                    <div className="flex items-center px-4 py-3 bg-white">
                                        <img src="/assets/icons/icon-access.svg" alt="" className="w-5 h-5 mr-3 opacity-50" />
                                        <span className="text-sm text-white-600 font-medium">Nível de acesso: </span>
                                        <span className="ml-2 text-sm font-semibold text-green-700">{nivelAcesso}</span>
                                    </div>
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