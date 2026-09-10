import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from "../../../../../components/ui/Input";
import Button from "../../../../../components/ui/Button";
import Checkbox from "../../../../../components/ui/Checkbox";
import Dropdown from "../../../../../components/ui/Dropdown";

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
    userName?: string;
    onDataChange?: (data: any) => void;
    initialData?: any;
}

interface RedeSocial {
    tipo: string;
    valor: string;
}

const REDES_OPCOES = [
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "X (Twitter)" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "YouTube" },
    { value: "outra", label: "Outra Rede Social" },
];

function ComunicacaoIns({
    onNext,
    onBack,
    step,
    totalSteps,
    userName = "Usuário",
    onDataChange,
    initialData = {},
}: Props) {
    const navigate = useNavigate();

    const [selectedRede, setSelectedRede] = useState<string | null>(null);

    const [redeValue, setRedeValue] = useState("");

    const [redesSociais, setRedesSociais] = useState<RedeSocial[]>(
        initialData.redesSociais || []
    );

    const [site, setSite] = useState<string>(
        initialData.site || ""
    );

    const [aceiteDivulgacao, setAceiteDivulgacao] = useState<boolean>(
        initialData.aceiteDivulgacao || false
    );

    const handleSelectRede = (value: string) => {
        setSelectedRede(value);
        setRedeValue("");
    };

    const getRedeLabel = (tipo: string) => {
        return (
            REDES_OPCOES.find((rede) => rede.value === tipo)?.label ||
            tipo
        );
    };

    const getPlaceholderInput = () => {
        switch (selectedRede) {
            case "instagram":
                return "@usuario ou https://instagram.com/usuario";

            case "linkedin":
                return "https://linkedin.com/in/usuario";

            case "facebook":
                return "@usuario ou https://facebook.com/usuario";

            case "twitter":
                return "@usuario ou https://x.com/usuario";

            case "tiktok":
                return "@usuario ou https://tiktok.com/@usuario";

            case "youtube":
                return "@canal ou link do canal";

            case "outra":
                return "@usuario ou link da rede social";

            default:
                return "Digite seu @ ou link";
        }
    };

    const adicionarRedeSocial = () => {
        if (!selectedRede || !redeValue.trim()) {
            return;
        }

        const novaRede: RedeSocial = {
            tipo: selectedRede,
            valor: redeValue.trim(),
        };

        /*
         * Evita adicionar duas vezes
         * exatamente a mesma rede.
         */
        const jaExiste = redesSociais.some(
            (rede) =>
                rede.tipo === novaRede.tipo &&
                rede.valor.toLowerCase() ===
                    novaRede.valor.toLowerCase()
        );

        if (jaExiste) {
            return;
        }

        setRedesSociais((prev) => [
            ...prev,
            novaRede,
        ]);

        setSelectedRede(null);
        setRedeValue("");
    };

    const removerRedeSocial = (index: number) => {
        setRedesSociais((prev) =>
            prev.filter((_, i) => i !== index)
        );
    };

    const handleNext = () => {
        onDataChange?.({
            redesSociais,
            site,
            aceiteDivulgacao,
        });

        onNext();
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro
                title="Criar Conta"
                onBack={onBack}
            />

            <div className="flex flex-1 overflow-hidden">

                {/* IMAGEM */}
                <aside className="hidden md:flex md:w-1/2 bg-[#1b6b3b] relative overflow-hidden">
                    <img 
                        src="/assets/imagem-lateral-parceiro.png" 
                        alt="Projeto Óleo Circular" 
                        className="absolute bottom-0 left-0 w-auto h-full max-h-full object-contain object-left-bottom" 
                    />
                </aside>

                {/* FORMULÁRIO */}
                <main className="
                    flex
                    flex-col
                    w-full
                    md:w-1/2
                    px-5
                    sm:px-8
                    md:px-12
                    bg-background
                    overflow-y-auto
                ">

                    <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">

                        <h1 className="
                            text-lg
                            sm:text-xl
                            md:text-2xl
                            font-bold
                            text-green-primary
                        ">
                            Bem-vindo(a), {userName}!
                        </h1>

                        <p className="
                            text-sm
                            sm:text-base
                            font-medium
                            text-white-500
                        ">
                            Informe suas redes sociais e site
                            para divulgarmos sua empresa como parceira
                        </p>

                    </div>

                    <ProgressBar
                        step={step}
                        totalSteps={totalSteps}
                    />

                    <div className="w-full pb-4">

                        <p className="
                            text-xs
                            font-extrabold
                            text-white-500
                            tracking-widest
                            py-4
                        ">
                            REDES SOCIAIS
                        </p>

                        <div className="flex flex-col gap-4 mb-6">

                            {/* SELEÇÃO DA REDE */}
                            <Dropdown
                                placeholder="Selecione a rede social"
                                options={REDES_OPCOES}
                                value={selectedRede}
                                onChange={handleSelectRede}
                            />

                            {/* INPUT DO @ OU LINK */}
                            {selectedRede && (
                                <div className="flex flex-col gap-2">

                                    <div className="
                                        bg-white
                                        rounded-xl
                                        shadow-sm
                                        overflow-hidden
                                    ">
                                        <Input
                                            type="text"
                                            icon="icon-redesSociais"
                                            placeholder={getPlaceholderInput()}
                                            name="redeSocial"
                                            value={redeValue}
                                            onChange={(
                                                e: ChangeEvent<
                                                    HTMLInputElement |
                                                    HTMLTextAreaElement
                                                >
                                            ) =>
                                                setRedeValue(
                                                    e.target.value
                                                )
                                            }
                                            noBorder
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={adicionarRedeSocial}
                                        variant="secondary"
                                        fullWidth
                                    >
                                        Adicionar rede social
                                    </Button>

                                </div>
                            )}

                            {/* REDES ADICIONADAS */}
                            {redesSociais.length > 0 && (
                                <div className="flex flex-col gap-2">

                                    <span className="
                                        text-xs
                                        font-bold
                                        text-white-500
                                    ">
                                        Redes adicionadas
                                    </span>

                                    {redesSociais.map(
                                        (rede, index) => (
                                            <div
                                                key={`${rede.tipo}-${index}`}
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                    bg-white
                                                    rounded-xl
                                                    px-4
                                                    py-3
                                                    shadow-sm
                                                "
                                            >

                                                <div className="
                                                    flex
                                                    flex-col
                                                    min-w-0
                                                ">

                                                    <span className="
                                                        text-xs
                                                        font-bold
                                                        text-green-primary
                                                    ">
                                                        {getRedeLabel(
                                                            rede.tipo
                                                        )}
                                                    </span>

                                                    <span className="
                                                        text-sm
                                                        text-black-200
                                                        truncate
                                                    ">
                                                        {rede.valor}
                                                    </span>

                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removerRedeSocial(
                                                            index
                                                        )
                                                    }
                                                    className="
                                                        text-red-500
                                                        text-sm
                                                        font-bold
                                                        hover:opacity-70
                                                        transition-opacity
                                                    "
                                                >
                                                    Remover
                                                </button>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                            {/* SITE */}
                            <div className="
                                bg-white
                                rounded-xl
                                shadow-sm
                                overflow-hidden
                            ">
                                <Input
                                    type="text"
                                    icon="icon-site"
                                    placeholder="Site (opcional)"
                                    name="site"
                                    value={site}
                                    onChange={(
                                        e: ChangeEvent<
                                            HTMLInputElement |
                                            HTMLTextAreaElement
                                        >
                                    ) =>
                                        setSite(e.target.value)
                                    }
                                    noBorder
                                />
                            </div>

                        </div>

                        {/* ACEITE */}
                        <div className="
                            flex
                            items-center
                            gap-2
                            pt-2
                            pb-4
                        ">

                            <Checkbox
                                id="aceiteDivulgacao"
                                checked={aceiteDivulgacao}
                                onChange={(checked: boolean) =>
                                    setAceiteDivulgacao(checked)
                                }
                            />

                            <label
                                htmlFor="aceiteDivulgacao"
                                className="
                                    text-xs
                                    sm:text-sm
                                    text-black-200
                                    cursor-pointer
                                "
                            >
                                Aceito os{" "}

                                <button
                                    className="
                                        text-green-primary
                                        font-bold
                                        underline
                                        hover:text-green-hover
                                        transition-colors
                                    "
                                    onClick={() => navigate("")}
                                    type="button"
                                >
                                    Termos de Divulgação
                                </button>

                                {" "}de parceria
                            </label>

                        </div>

                        {/* BOTÕES */}
                        <div className="
                            flex
                            flex-col
                            gap-3
                            sm:gap-4
                            mt-4
                        ">

                            <Button
                                type="button"
                                onClick={handleNext}
                                variant="primary"
                                fullWidth
                            >
                                Avançar
                            </Button>

                            <Button
                                type="button"
                                onClick={onBack}
                                variant="secondary"
                                fullWidth
                            >
                                Voltar
                            </Button>

                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default ComunicacaoIns;