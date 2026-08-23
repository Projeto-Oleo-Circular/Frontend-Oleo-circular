import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../../../../services/authService"
import { EstabelecimentoTag, PERFIS_PARCEIRO } from "../../../../constants/perfisParceiros"
import useToast from "../../../../hooks/useToast"
import SelectCategory from "./SelectCategory"
import IdentifyPoint from "./IdentifyPoint"

function RegisterPoint() {
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [loadingPerfil, setLoadingPerfil] = useState(true)
    const [perfilId, setPerfilId] = useState<string | null>(null)
    const [step, setStep] = useState<0 | 1>(0)
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<EstabelecimentoTag | null>(null)
    const TOTAL_STEPS_NOVO_PONTO = 2

    useEffect(() => {
        const carregarPerfil = async () => {
            try {
                const userData = await authService.getUserData()
                const tipoParceiro = (userData?.tipoParceiro || "").toLowerCase()
                setPerfilId(tipoParceiro || null)
            } catch (error) {
                addToast("Não foi possível identificar seu perfil de parceiro", "error")
            } finally {
                setLoadingPerfil(false)
            }
        }
        carregarPerfil()
    }, [addToast])

    const perfil = PERFIS_PARCEIRO.find((p) => p.id === perfilId)

    const handleSelectCategoria = (tag: EstabelecimentoTag) => {
        setCategoriaSelecionada(tag)
        setStep(1)
    }

    const handleVoltarCategoria = () => {
        setCategoriaSelecionada(null)
        setStep(0)
    }

    const handleVoltarHome = () => navigate("/home")

    if (loadingPerfil) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!perfil) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background gap-4 p-6 text-center">
                <p className="text-black-100 font-medium">
                    Não conseguimos identificar o seu perfil de parceiro.
                </p>
                <button onClick={handleVoltarHome} className="text-green-primary font-bold underline">
                    Voltar para o início
                </button>
            </div>
        )
    }

    if (step === 0) {
        return (
            <SelectCategory
                tags={perfil.tags}
                totalSteps={TOTAL_STEPS_NOVO_PONTO}
                onSelect={handleSelectCategoria}
                onBack={handleVoltarHome}
            />
        )
    }

    return (
        <IdentifyPoint
            categoria={categoriaSelecionada!}
            totalSteps={TOTAL_STEPS_NOVO_PONTO}
            onBack={handleVoltarCategoria}
        />
    )
}

export default RegisterPoint