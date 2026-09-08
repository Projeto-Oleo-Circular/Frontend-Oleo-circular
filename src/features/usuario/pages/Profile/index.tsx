import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import HeaderApp from "../../../../components/layout/HeaderApp";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";

import useToast from "../../../../hooks/useToast";

import { authService } from "../../../../services/authService";

import {
    impactoAmbientalService,
    type ImpactoAmbientalParceiro,
} from "../../../../services/impactoAmbientalService";

import {
    Droplets,
    Fuel,
    Leaf,
    Recycle,
    Zap,
    Truck,
} from "lucide-react";

// ======================================================
// CONSTANTES
// ======================================================

const MESES = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
];

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function formatarDesde(dataIso: string): string {
    const data = new Date(dataIso);

    return `${MESES[data.getMonth()]}. ${data.getFullYear()}`;
}

function formatarNumero(
    valor?: number | null,
    casas = 2
): string {
    return Number(valor ?? 0).toLocaleString("pt-BR", {
        maximumFractionDigits: casas,
    });
}

// ======================================================
// COMPONENTE
// ======================================================

function Profile() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // ==================================================
    // PERFIL
    // ==================================================

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [editando, setEditando] = useState(false);

    const [userData, setUserData] = useState<any>(null);

    // ==================================================
    // MODAIS
    // ==================================================

    const [modalSaidaAberta, setModalSaidaAberta] =
        useState(false);

    const [modalImpactoAberta, setModalImpactoAberta] =
        useState(false);

    const [saindo, setSaindo] = useState(false);

    // ==================================================
    // IMPACTO AMBIENTAL
    // ==================================================

    const [impacto, setImpacto] =
        useState<ImpactoAmbientalParceiro | null>(null);

    const [loadingImpacto, setLoadingImpacto] =
        useState(true);

    const [erroImpacto, setErroImpacto] =
        useState(false);

    // ==================================================
    // FORMULÁRIO
    // ==================================================

    const [form, setForm] = useState({
        razaoSocial: "",
        nome: "",
        email: "",
        telefone: "",
        senhaAtual: "",
        novaSenha: "",
    });

    // ==================================================
    // CARREGAR PERFIL
    // ==================================================

    useEffect(() => {
        const carregar = async () => {
            try {
                const data =
                    await authService.getUserData();

                setUserData(data);

                setForm({
                    razaoSocial: data?.razaoSocial || "",
                    nome: data?.nome || "",
                    email: data?.email || "",
                    telefone: data?.telefone || "",
                    senhaAtual: "",
                    novaSenha: "",
                });
            } catch (error) {
                console.error(
                    "Erro ao carregar perfil:",
                    error
                );

                addToast(
                    "Erro ao carregar dados do perfil",
                    "error"
                );
            } finally {
                setLoading(false);
            }
        };

        carregar();
    }, [addToast]);

    // ==================================================
    // CARREGAR IMPACTO AMBIENTAL
    // ==================================================

    useEffect(() => {
        const carregarImpacto = async () => {
            try {
                setLoadingImpacto(true);
                setErroImpacto(false);

                const dados =
                    await impactoAmbientalService.getMeuImpacto();

                setImpacto(dados);
            } catch (error) {
                console.error(
                    "Erro ao carregar impacto ambiental:",
                    error
                );

                setErroImpacto(true);
            } finally {
                setLoadingImpacto(false);
            }
        };

        carregarImpacto();
    }, []);

    // ==================================================
    // ALTERAÇÃO DOS INPUTS
    // ==================================================

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==================================================
    // SALVAR PERFIL
    // ==================================================

    const handleSalvar = async () => {
        try {
            setSalvando(true);

            const payload: any = {};

            if (
                form.razaoSocial &&
                form.razaoSocial.trim()
            ) {
                payload.razaoSocial =
                    form.razaoSocial.trim();
            }

            if (
                form.nome &&
                form.nome.trim()
            ) {
                payload.nome =
                    form.nome.trim();
            }

            if (
                form.email &&
                form.email.trim()
            ) {
                payload.email =
                    form.email.trim();
            }

            const telefoneLimpo =
                form.telefone
                    ? form.telefone.replace(/\D/g, "")
                    : "";

            if (telefoneLimpo) {
                if (
                    telefoneLimpo.length >= 10 &&
                    telefoneLimpo.length <= 11
                ) {
                    payload.telefone =
                        telefoneLimpo;
                } else {
                    addToast(
                        "O telefone precisa ter DDD + Número (10 ou 11 dígitos).",
                        "error"
                    );

                    return;
                }
            }

            // ==========================================
            // ALTERAÇÃO DE SENHA
            // ==========================================

            if (
                form.novaSenha &&
                form.novaSenha.trim() !== ""
            ) {
                if (
                    form.novaSenha.length < 6
                ) {
                    addToast(
                        "A nova senha deve ter pelo menos 6 caracteres.",
                        "error"
                    );

                    return;
                }

                if (!form.senhaAtual) {
                    addToast(
                        "Digite sua senha atual para autorizar a mudança.",
                        "error"
                    );

                    return;
                }

                payload.senhaAtual =
                    form.senhaAtual;

                payload.novaSenha =
                    form.novaSenha;
            }

            await authService.atualizarPerfil(
                payload
            );

            addToast(
                "Perfil atualizado com sucesso!",
                "success"
            );

            setEditando(false);

            // ==========================================
            // RECARREGAR PERFIL
            // ==========================================

            const dataAtualizada =
                await authService.getUserData();

            setUserData(dataAtualizada);

            setForm({
                razaoSocial:
                    dataAtualizada?.razaoSocial || "",
                nome:
                    dataAtualizada?.nome || "",
                email:
                    dataAtualizada?.email || "",
                telefone:
                    dataAtualizada?.telefone || "",
                senhaAtual: "",
                novaSenha: "",
            });
        } catch (error: any) {
            console.error(
                "Erro ao salvar perfil do parceiro:",
                error
            );

            addToast(
                error.response?.data?.message ||
                    "Erro ao salvar alterações",
                "error"
            );
        } finally {
            setSalvando(false);
        }
    };

    // ==================================================
    // CANCELAR EDIÇÃO
    // ==================================================

    const handleCancelarEdicao = () => {
        setForm({
            razaoSocial:
                userData?.razaoSocial || "",
            nome:
                userData?.nome || "",
            email:
                userData?.email || "",
            telefone:
                userData?.telefone || "",
            senhaAtual: "",
            novaSenha: "",
        });

        setEditando(false);
    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const handleSair = () => {
        setSaindo(true);

        authService.logout();

        setTimeout(() => {
            navigate("/login");
        }, 300);
    };

    // ==================================================
    // INICIAIS
    // ==================================================

    const getInitials = (
        texto: string
    ) =>
        texto
            ?.charAt(0)
            ?.toUpperCase() || "U";

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="
                flex
                flex-col
                h-full
                items-center
                justify-center
                bg-background
            ">
                <div className="
                    w-12
                    h-12
                    border-4
                    border-green-primary
                    border-t-transparent
                    rounded-full
                    animate-spin
                " />
            </div>
        );
    }

    const nomePrincipal =
        userData?.razaoSocial ||
        userData?.nome ||
        "Usuário";

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="
            flex
            flex-col
            h-full
            overflow-hidden
            bg-background
            relative
        ">
            <HeaderApp
                userName={nomePrincipal}
            />

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

                    {/* ================================= */}
                    {/* CABEÇALHO */}
                    {/* ================================= */}

                    <div className="
                        flex
                        items-center
                        gap-4
                        pt-2
                    ">
                        <button
                            type="button"
                            onClick={() =>
                                editando
                                    ? handleCancelarEdicao()
                                    : navigate("/home")
                            }
                            className="
                                w-10
                                h-10
                                bg-green-400
                                text-white
                                rounded-full
                                flex
                                items-center
                                justify-center
                                shadow-md
                                shrink-0
                                cursor-pointer
                            "
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

                        <h1 className="
                            text-xl
                            font-bold
                            text-green-primary
                        ">
                            {editando
                                ? "Editar Perfil"
                                : "Perfil"}
                        </h1>
                    </div>

                    {/* ================================= */}
                    {/* AVATAR / DADOS */}
                    {/* ================================= */}

                    <div className="
                        flex
                        flex-col
                        items-center
                        gap-3
                    ">
                        <div className="
                            w-28
                            h-28
                            rounded-full
                            bg-green-primary
                            text-white
                            flex
                            items-center
                            justify-center
                            text-4xl
                            font-bold
                            border-4
                            border-white
                            shadow-md
                        ">
                            {getInitials(
                                nomePrincipal
                            )}
                        </div>

                        {!editando && (
                            <div className="text-center">

                                {userData?.razaoSocial && (
                                    <p className="
                                        text-lg
                                        font-bold
                                        text-black-primary
                                    ">
                                        {
                                            userData.razaoSocial
                                        }
                                    </p>
                                )}

                                {userData?.nome &&
                                    userData?.nome !==
                                        userData?.razaoSocial && (
                                        <p className="
                                            text-sm
                                            font-medium
                                            text-white-600
                                        ">
                                            Contato:{" "}
                                            {
                                                userData.nome
                                            }
                                        </p>
                                    )}

                                {!userData?.razaoSocial &&
                                    userData?.nome && (
                                        <p className="
                                            text-lg
                                            font-bold
                                            text-black-primary
                                        ">
                                            {
                                                userData.nome
                                            }
                                        </p>
                                    )}

                                <p className="
                                    text-sm
                                    text-white-500
                                    mt-0.5
                                ">
                                    {userData?.email}
                                </p>

                                {userData?.telefone && (
                                    <p className="
                                        text-sm
                                        text-white-500
                                        mt-0.5
                                    ">
                                        {
                                            userData.telefone
                                        }
                                    </p>
                                )}

                            </div>
                        )}
                    </div>

                    {/* ================================= */}
                    {/* VISUALIZAÇÃO */}
                    {/* ================================= */}

                    {!editando ? (
                        <>

                            {/* EDITAR PERFIL */}

                            <Button
                                onClick={() =>
                                    setEditando(true)
                                }
                                variant="secondary"
                                fullWidth
                            >
                                Editar perfil
                            </Button>

                            {/* ========================= */}
                            {/* PONTOS / DESDE / IMPACTO */}
                            {/* ========================= */}

                            <div className="
                                grid
                                grid-cols-3
                                gap-3
                            ">

                                {/* PONTOS */}

                                <div className="
                                    bg-green-100
                                    rounded-xl
                                    p-3
                                    min-h-[90px]

                                    flex
                                    flex-col
                                    items-center
                                    justify-center

                                    text-center
                                ">
                                    <p className="
                                        text-2xl
                                        font-bold
                                        text-black-primary
                                    ">
                                        {impacto?.totalPontos ??
                                            userData
                                                ?.pontosColeta
                                                ?.length ??
                                            0}
                                    </p>

                                    <p className="
                                        text-[11px]
                                        font-bold
                                        text-white-600
                                        tracking-wide
                                        uppercase
                                    ">
                                        Pontos
                                    </p>
                                </div>

                                {/* DESDE */}

                                <div className="
                                    bg-green-100
                                    rounded-xl
                                    p-3
                                    min-h-[90px]

                                    flex
                                    flex-col
                                    items-center
                                    justify-center

                                    text-center
                                ">
                                    <p className="
                                        text-lg
                                        font-bold
                                        text-black-primary
                                        whitespace-nowrap
                                    ">
                                        {userData?.criadoEm
                                            ? formatarDesde(
                                                  userData.criadoEm
                                              )
                                            : "-"}
                                    </p>

                                    <p className="
                                        text-[11px]
                                        font-bold
                                        text-white-600
                                        tracking-wide
                                        uppercase
                                    ">
                                        Desde
                                    </p>
                                </div>

                                {/* IMPACTO */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setModalImpactoAberta(
                                            true
                                        )
                                    }
                                    className="
                                        bg-green-primary
                                        hover:bg-green-hover
                                        rounded-xl
                                        p-3
                                        min-h-[90px]

                                        flex
                                        flex-col
                                        items-center
                                        justify-center

                                        text-center

                                        shadow-sm
                                        hover:shadow-md

                                        transition-all
                                        duration-200

                                        cursor-pointer
                                    "
                                >
                                    <Leaf className="
                                        w-7
                                        h-7
                                        text-white
                                        mb-1
                                    " />

                                    <p className="
                                        text-[11px]
                                        font-bold
                                        text-white
                                        tracking-wide
                                        uppercase
                                    ">
                                        Impacto
                                    </p>
                                </button>

                            </div>

                            {/* ========================= */}
                            {/* LINKS */}
                            {/* ========================= */}

                            <div className="
                                bg-white
                                rounded-xl
                                shadow-sm
                                overflow-hidden
                            ">

                                {/* SOBRE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/sobre")
                                    }
                                    className="
                                        w-full
                                        flex
                                        items-center
                                        justify-between
                                        px-4
                                        py-3.5
                                        hover:bg-green-50
                                        cursor-pointer
                                    "
                                >
                                    <span className="
                                        flex
                                        items-center
                                        gap-3
                                        text-sm
                                        font-medium
                                        text-black-200
                                    ">
                                        <img
                                            src="/assets/icons/icon-info2.svg"
                                            alt=""
                                            className="
                                                w-5
                                                h-5
                                            "
                                        />

                                        Sobre o Óleo Circular
                                    </span>

                                    <svg
                                        className="
                                            w-4
                                            h-4
                                            text-white-400
                                        "
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                <hr className="
                                    border-white-100
                                " />

                                {/* PRIVACIDADE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/privacidade"
                                        )
                                    }
                                    className="
                                        w-full
                                        flex
                                        items-center
                                        justify-between
                                        px-4
                                        py-3.5
                                        hover:bg-green-50
                                        cursor-pointer
                                    "
                                >
                                    <span className="
                                        flex
                                        items-center
                                        gap-3
                                        text-sm
                                        font-medium
                                        text-black-200
                                    ">
                                        <img
                                            src="/assets/icons/icon-privacidade.svg"
                                            alt=""
                                            className="
                                                w-5
                                                h-5
                                            "
                                        />

                                        Política de Privacidade
                                    </span>

                                    <svg
                                        className="
                                            w-4
                                            h-4
                                            text-white-400
                                        "
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                <hr className="
                                    border-white-100
                                " />

                                {/* TERMOS */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/termos")
                                    }
                                    className="
                                        w-full
                                        flex
                                        items-center
                                        justify-between
                                        px-4
                                        py-3.5
                                        hover:bg-green-50
                                        cursor-pointer
                                    "
                                >
                                    <span className="
                                        flex
                                        items-center
                                        gap-3
                                        text-sm
                                        font-medium
                                        text-black-200
                                    ">
                                        <img
                                            src="/assets/icons/icon-termos.svg"
                                            alt=""
                                            className="
                                                w-5
                                                h-5
                                            "
                                        />

                                        Termos de Uso
                                    </span>

                                    <svg
                                        className="
                                            w-4
                                            h-4
                                            text-white-400
                                        "
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                            </div>

                            {/* SAIR */}

                            <Button
                                onClick={() =>
                                    setModalSaidaAberta(
                                        true
                                    )
                                }
                                variant="danger"
                                fullWidth
                            >
                                Sair do aplicativo
                            </Button>

                        </>
                    ) : (

                        /* ================================= */
                        /* EDIÇÃO */
                        /* ================================= */

                        <>

                            {/* INFORMAÇÕES PESSOAIS */}

                            <div>
                                <p className="
                                    text-xs
                                    font-bold
                                    text-white-500
                                    tracking-widest
                                    mb-3
                                ">
                                    INFORMAÇÕES PESSOAIS
                                </p>

                                <div className="
                                    bg-white
                                    rounded-xl
                                    shadow-sm
                                    overflow-hidden
                                ">
                                    <Input
                                        type="text"
                                        icon="icon-name"
                                        placeholder="Razão Social"
                                        name="razaoSocial"
                                        value={
                                            form.razaoSocial
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />

                                    <hr className="
                                        border-white-100
                                    " />

                                    <Input
                                        type="text"
                                        icon="icon-name"
                                        placeholder="Nome de Contato / Responsável"
                                        name="nome"
                                        value={
                                            form.nome
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />

                                    <hr className="
                                        border-white-100
                                    " />

                                    <Input
                                        type="email"
                                        icon="email"
                                        placeholder="E-mail"
                                        name="email"
                                        value={
                                            form.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />

                                    <hr className="
                                        border-white-100
                                    " />

                                    <Input
                                        type="tel"
                                        icon="phone"
                                        placeholder="Telefone"
                                        name="telefone"
                                        value={
                                            form.telefone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />
                                </div>
                            </div>

                            {/* ALTERAR SENHA */}

                            <div>
                                <p className="
                                    text-xs
                                    font-bold
                                    text-white-500
                                    tracking-widest
                                    mb-3
                                ">
                                    ALTERAR SENHA
                                </p>

                                <div className="
                                    bg-white
                                    rounded-xl
                                    shadow-sm
                                    overflow-hidden
                                ">
                                    <Input
                                        type="password"
                                        icon="cadeado"
                                        placeholder="Senha atual"
                                        name="senhaAtual"
                                        value={
                                            form.senhaAtual
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />

                                    <hr className="
                                        border-white-100
                                    " />

                                    <Input
                                        type="password"
                                        icon="cadeado"
                                        placeholder="Nova senha"
                                        name="novaSenha"
                                        value={
                                            form.novaSenha
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        noBorder
                                    />
                                </div>
                            </div>

                            {/* BOTÕES */}

                            <div className="
                                flex
                                flex-col
                                gap-3
                            ">
                                <Button
                                    onClick={
                                        handleSalvar
                                    }
                                    loading={
                                        salvando
                                    }
                                    variant="primary"
                                    fullWidth
                                >
                                    Salvar alterações
                                </Button>

                                <Button
                                    onClick={
                                        handleCancelarEdicao
                                    }
                                    variant="secondary"
                                    fullWidth
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </Button>
                            </div>

                        </>
                    )}

                </div>
            </main>

            {/* ================================================= */}
            {/* MODAL IMPACTO AMBIENTAL */}
            {/* ================================================= */}

            {modalImpactoAberta && (
                <div
                    className="
                        absolute
                        inset-0
                        z-50

                        flex
                        items-center
                        justify-center

                        bg-black/50
                        backdrop-blur-sm

                        p-4
                        animate-fade-in
                    "
                    onClick={() =>
                        setModalImpactoAberta(false)
                    }
                >
                    <div
                        className="
                            bg-white
                            rounded-3xl

                            w-full
                            max-w-md
                            max-h-[90vh]

                            overflow-y-auto

                            relative

                            shadow-2xl
                            animate-fade-in-up
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* ============================= */}
                        {/* CABEÇALHO MODAL */}
                        {/* ============================= */}

                        <div className="
                            sticky
                            top-0
                            z-20

                            bg-white

                            px-5
                            pt-5
                            pb-4

                            border-b
                            border-white-100

                            flex
                            items-start
                            justify-between
                            gap-3
                        ">
                            <div className="
                                flex
                                items-center
                                gap-3
                            ">
                                <div className="
                                    w-11
                                    h-11
                                    rounded-full

                                    bg-green-50

                                    flex
                                    items-center
                                    justify-center

                                    shrink-0
                                ">
                                    <Leaf className="
                                        w-6
                                        h-6
                                        text-green-primary
                                    " />
                                </div>

                                <div>
                                    <h2 className="
                                        text-lg
                                        font-bold
                                        text-green-primary
                                    ">
                                        Meu impacto ambiental
                                    </h2>

                                    <p className="
                                        text-xs
                                        text-white-500
                                    ">
                                        Todos os seus pontos de
                                        coleta
                                    </p>
                                </div>
                            </div>

                            {/* X */}

                            <button
                                type="button"
                                onClick={() =>
                                    setModalImpactoAberta(
                                        false
                                    )
                                }
                                className="
                                    w-9
                                    h-9

                                    rounded-full
                                    bg-white-100
                                    hover:bg-white-200

                                    flex
                                    items-center
                                    justify-center

                                    shrink-0
                                    cursor-pointer

                                    transition
                                "
                                aria-label="Fechar"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* ============================= */}
                        {/* CONTEÚDO MODAL */}
                        {/* ============================= */}

                        <div className="p-5">

                            {/* LOADING */}

                            {loadingImpacto ? (
                                <div className="
                                    grid
                                    grid-cols-2
                                    gap-3
                                ">
                                    {[
                                        1,
                                        2,
                                        3,
                                        4,
                                        5,
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className={`
                                                h-24
                                                rounded-xl
                                                bg-white-100
                                                animate-pulse

                                                ${
                                                    item ===
                                                    5
                                                        ? "col-span-2"
                                                        : ""
                                                }
                                            `}
                                        />
                                    ))}
                                </div>
                            ) : erroImpacto ? (

                                /* ===================== */
                                /* ERRO */
                                /* ===================== */

                                <div className="
                                    py-10
                                    text-center
                                ">
                                    <Leaf className="
                                        w-10
                                        h-10
                                        text-white-300
                                        mx-auto
                                        mb-3
                                    " />

                                    <p className="
                                        text-sm
                                        text-white-500
                                    ">
                                        Não foi possível
                                        carregar seu impacto
                                        ambiental.
                                    </p>
                                </div>

                            ) : impacto ? (
                                <>

                                    {/* ================= */}
                                    {/* ÓLEO COLETADO */}
                                    {/* ================= */}

                                    <div className="
                                        bg-green-50
                                        rounded-2xl
                                        p-5
                                        text-center
                                        mb-4
                                    ">
                                        <div className="
                                            w-14
                                            h-14
                                            rounded-full

                                            bg-white
                                            shadow-sm

                                            flex
                                            items-center
                                            justify-center

                                            mx-auto
                                            mb-3
                                        ">
                                            <Droplets className="
                                                w-7
                                                h-7
                                                text-green-primary
                                            " />
                                        </div>

                                        <p className="
                                            text-sm
                                            text-white-500
                                        ">
                                            Óleo coletado
                                        </p>

                                        <div className="
                                            flex
                                            items-baseline
                                            justify-center
                                            gap-1
                                            mt-1
                                        ">
                                            <span className="
                                                text-4xl
                                                font-bold
                                                text-green-primary
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .volumeTotalColetado
                                                )}
                                            </span>

                                            <span className="
                                                text-base
                                                font-bold
                                                text-green-primary
                                            ">
                                                L
                                            </span>
                                        </div>

                                        <p className="
                                            text-xs
                                            text-white-500
                                            mt-2
                                        ">
                                            {
                                                impacto.totalColetas
                                            }{" "}
                                            {impacto.totalColetas ===
                                            1
                                                ? "coleta concluída"
                                                : "coletas concluídas"}
                                        </p>
                                    </div>

                                    {/* ================= */}
                                    {/* GRID INDICADORES */}
                                    {/* ================= */}

                                    <div className="
                                        grid
                                        grid-cols-2
                                        gap-3
                                    ">

                                        {/* BIODIESEL */}

                                        <div className="
                                            bg-green-50
                                            rounded-xl
                                            p-4
                                            min-h-[110px]
                                        ">
                                            <Fuel className="
                                                w-5
                                                h-5
                                                text-green-primary
                                                mb-2
                                            " />

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Biodiesel estimado
                                            </p>

                                            <p className="
                                                text-lg
                                                font-bold
                                                text-black-primary
                                                mt-1
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .biodieselEstimadoLitros
                                                )}{" "}
                                                <span className="
                                                    text-xs
                                                ">
                                                    L
                                                </span>
                                            </p>
                                        </div>

                                        {/* DIESEL */}

                                        <div className="
                                            bg-green-50
                                            rounded-xl
                                            p-4
                                            min-h-[110px]
                                        ">
                                            <Truck className="
                                                w-5
                                                h-5
                                                text-green-primary
                                                mb-2
                                            " />

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Diesel equivalente
                                            </p>

                                            <p className="
                                                text-lg
                                                font-bold
                                                text-black-primary
                                                mt-1
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .dieselEquivalenteLitros
                                                )}{" "}
                                                <span className="
                                                    text-xs
                                                ">
                                                    L
                                                </span>
                                            </p>
                                        </div>

                                        {/* CO2 */}

                                        <div className="
                                            bg-green-50
                                            rounded-xl
                                            p-4
                                            min-h-[110px]
                                        ">
                                            <Leaf className="
                                                w-5
                                                h-5
                                                text-green-primary
                                                mb-2
                                            " />

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                CO₂ evitado
                                            </p>

                                            <p className="
                                                text-lg
                                                font-bold
                                                text-black-primary
                                                mt-1
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .co2EvitadoKg
                                                )}{" "}
                                                <span className="
                                                    text-xs
                                                ">
                                                    kg
                                                </span>
                                            </p>
                                        </div>

                                        {/* RESÍDUO */}

                                        <div className="
                                            bg-green-50
                                            rounded-xl
                                            p-4
                                            min-h-[110px]
                                        ">
                                            <Recycle className="
                                                w-5
                                                h-5
                                                text-green-primary
                                                mb-2
                                            " />

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Resíduo desviado
                                            </p>

                                            <p className="
                                                text-lg
                                                font-bold
                                                text-black-primary
                                                mt-1
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .residuoDesviadoKg
                                                )}{" "}
                                                <span className="
                                                    text-xs
                                                ">
                                                    kg
                                                </span>
                                            </p>
                                        </div>

                                    </div>

                                    {/* ================= */}
                                    {/* ENERGIA */}
                                    {/* ================= */}

                                    <div className="
                                        bg-green-50
                                        rounded-xl
                                        p-4
                                        mt-3

                                        flex
                                        items-center
                                        gap-3
                                    ">
                                        <div className="
                                            w-11
                                            h-11
                                            bg-white
                                            rounded-full

                                            flex
                                            items-center
                                            justify-center

                                            shrink-0
                                        ">
                                            <Zap className="
                                                w-5
                                                h-5
                                                text-green-primary
                                            " />
                                        </div>

                                        <div>
                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Energia do biodiesel
                                            </p>

                                            <p className="
                                                text-xl
                                                font-bold
                                                text-black-primary
                                            ">
                                                {formatarNumero(
                                                    impacto
                                                        .energiaBiodieselMj
                                                )}{" "}
                                                <span className="
                                                    text-xs
                                                ">
                                                    MJ
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* ================= */}
                                    {/* TOTAIS */}
                                    {/* ================= */}

                                    <div className="
                                        grid
                                        grid-cols-2

                                        mt-5
                                        pt-5

                                        border-t
                                        border-white-100
                                    ">

                                        {/* PONTOS */}

                                        <div className="
                                            text-center

                                            border-r
                                            border-white-100
                                        ">
                                            <p className="
                                                text-2xl
                                                font-bold
                                                text-green-primary
                                            ">
                                                {
                                                    impacto.totalPontos
                                                }
                                            </p>

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Pontos participantes
                                            </p>
                                        </div>

                                        {/* COLETAS */}

                                        <div className="
                                            text-center
                                        ">
                                            <p className="
                                                text-2xl
                                                font-bold
                                                text-green-primary
                                            ">
                                                {
                                                    impacto.totalColetas
                                                }
                                            </p>

                                            <p className="
                                                text-xs
                                                text-white-500
                                            ">
                                                Coletas concluídas
                                            </p>
                                        </div>

                                    </div>

                                </>
                            ) : (

                                /* ===================== */
                                /* SEM DADOS */
                                /* ===================== */

                                <div className="
                                    text-center
                                    py-10
                                ">
                                    <Leaf className="
                                        w-10
                                        h-10
                                        text-green-primary
                                        mx-auto
                                        mb-3
                                    " />

                                    <p className="
                                        font-bold
                                        text-black-primary
                                    ">
                                        Ainda não há impacto
                                        calculado
                                    </p>

                                    <p className="
                                        text-xs
                                        text-white-500
                                        mt-1
                                    ">
                                        Os indicadores serão
                                        atualizados após suas
                                        primeiras coletas
                                        concluídas.
                                    </p>
                                </div>
                            )}

                            {/* ========================= */}
                            {/* FECHAR */}
                            {/* ========================= */}

                            <Button
                                onClick={() =>
                                    setModalImpactoAberta(
                                        false
                                    )
                                }
                                variant="primary"
                                fullWidth
                                className="mt-5"
                            >
                                Fechar
                            </Button>

                        </div>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* MODAL DE LOGOUT */}
            {/* ================================================= */}

            {modalSaidaAberta && (
                <div className="
                    absolute
                    inset-0
                    z-50

                    flex
                    items-center
                    justify-center

                    bg-black/50
                    p-6

                    backdrop-blur-sm
                    animate-fade-in
                ">
                    <div className="
                        bg-white
                        rounded-3xl

                        w-full
                        max-w-sm

                        p-6

                        relative
                        overflow-hidden

                        shadow-2xl
                        animate-fade-in-up
                    ">
                        <img
                            src="/assets/fundo-popUp-superior.svg"
                            alt=""
                            className="
                                absolute
                                -top-10
                                -right-10

                                w-40
                                h-40

                                object-contain
                                pointer-events-none
                                opacity-90
                            "
                        />

                        <img
                            src="/assets/fundo-popUp-inferior.svg"
                            alt=""
                            className="
                                absolute
                                -bottom-10
                                -left-10

                                w-40
                                h-40

                                object-contain
                                pointer-events-none
                                opacity-90
                            "
                        />

                        <div className="
                            relative
                            z-10

                            flex
                            flex-col
                            gap-4

                            pt-2
                        ">
                            <div>
                                <h3 className="
                                    text-xl
                                    font-bold
                                    text-green-700
                                    mb-2
                                ">
                                    Confirmar saída
                                </h3>

                                <p className="
                                    text-sm
                                    text-black-200
                                    leading-relaxed
                                ">
                                    Tem certeza que deseja sair?
                                </p>
                            </div>

                            <div className="
                                flex
                                gap-3
                            ">
                                <Button
                                    onClick={
                                        handleSair
                                    }
                                    loading={
                                        saindo
                                    }
                                    variant="danger"
                                    fullWidth
                                >
                                    Sair
                                </Button>

                                <Button
                                    onClick={() =>
                                        setModalSaidaAberta(
                                            false
                                        )
                                    }
                                    variant="outline"
                                    fullWidth
                                    disabled={
                                        saindo
                                    }
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Profile;