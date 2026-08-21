{/*
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../../../../services/authService"
import { PERFIS_PARCEIRO, type EstabelecimentoTag } from "../../../../constants/perfisParceiros"
import useToast from "../../../../hooks/useToast"
import SelectCategory from "./SelectCategory"
import IdentifyPoint from "./IdentifyPoint"

// TODO(colega): reativar o filtro por perfil quando GET /parceiros/me passar
// a devolver o campo de perfil do parceiro (tipoParceiro ou tipoPerfil).
// Até lá, a tela de seleção mostra TODOS_ESTABELECIMENTOS sem filtro.

function RegisterPoint() {
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [loadingPerfil, setLoadingPerfil] = useState(true)
    const [perfilId, setPerfilId] = useState<string | null>(null)
    const [step, setStep] = useState<0 | 1>(0)
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<EstabelecimentoTag | null>(null)

    useEffect(() => {
        const carregarPerfil = async () => {
            try {
                const userData = await authService.getUserData()
                // Assumindo que /parceiros/me retorna "tipoParceiro" (mesmo nome usado no cadastro)
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
                <p className="text-black-primary font-medium">
                    Não conseguimos identificar o seu perfil de parceiro.
                </p>
                <button onClick={handleVoltarHome} className="text-green-primary font-bold underline">
                    Voltar para o início
                </button>
            </div>
        )
    }

    if (step === 0) {
        return <SelectCategory perfil={perfil} onSelect={handleSelectCategoria} onBack={handleVoltarHome} />
    }

    return <IdentifyPoint perfil={perfil} categoria={categoriaSelecionada!} onBack={handleVoltarCategoria} />
}

export default RegisterPoint

*/}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { TODOS_ESTABELECIMENTOS, type EstabelecimentoTag } from "../../../../constants/perfisParceiros"
import SelectCategory from "./SelectCategory"
import IdentifyPoint from "./IdentifyPoint"

// TODO(colega): reativar o filtro por perfil quando GET /parceiros/me passar
// a devolver o campo de perfil do parceiro (tipoParceiro ou tipoPerfil).
// Até lá, a tela de seleção mostra TODOS_ESTABELECIMENTOS sem filtro.
//
// Código antigo, pronto pra voltar assim que o campo existir:
//
// import { useEffect } from "react"
// import { authService } from "../../../../services/authService"
// import { PERFIS_PARCEIRO } from "../../../../constants/perfisParceiros"
// import useToast from "../../../../hooks/useToast"
//
// const { addToast } = useToast()
// const [loadingPerfil, setLoadingPerfil] = useState(true)
// const [perfilId, setPerfilId] = useState<string | null>(null)
//
// useEffect(() => {
//     const carregarPerfil = async () => {
//         try {
//             const userData = await authService.getUserData()
//             // Campo ainda não existe na resposta real do /parceiros/me — confirmar nome exato com a colega
//             const tipoParceiro = (userData?.tipoParceiro || userData?.tipoPerfil || "").toLowerCase()
//             setPerfilId(tipoParceiro || null)
//         } catch (error) {
//             addToast("Não foi possível identificar seu perfil de parceiro", "error")
//         } finally {
//             setLoadingPerfil(false)
//         }
//     }
//     carregarPerfil()
// }, [addToast])
//
// const perfil = PERFIS_PARCEIRO.find((p) => p.id === perfilId)
// (usar perfil.tags e perfil.totalSteps no lugar de TODOS_ESTABELECIMENTOS e TOTAL_STEPS)

const TOTAL_STEPS = 2 // Passo 1: categoria, Passo 2: dados do ponto

function RegisterPoint() {
    const navigate = useNavigate()

    const [step, setStep] = useState<0 | 1>(0)
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<EstabelecimentoTag | null>(null)

    const handleSelectCategoria = (tag: EstabelecimentoTag) => {
        setCategoriaSelecionada(tag)
        setStep(1)
    }

    const handleVoltarCategoria = () => {
        setCategoriaSelecionada(null)
        setStep(0)
    }

    const handleVoltarHome = () => navigate("/home")

    if (step === 0) {
        return (
            <SelectCategory
                tags={TODOS_ESTABELECIMENTOS}
                totalSteps={TOTAL_STEPS}
                onSelect={handleSelectCategoria}
                onBack={handleVoltarHome}
            />
        )
    }

    return (
        <IdentifyPoint
            categoria={categoriaSelecionada!}
            totalSteps={TOTAL_STEPS}
            onBack={handleVoltarCategoria}
        />
    )
}

export default RegisterPoint