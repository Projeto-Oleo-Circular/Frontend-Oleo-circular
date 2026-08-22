import { useState } from "react"
import HeaderApp from "../../../../../components/layout/HeaderApp"
import Button from "../../../../../components/ui/Button"
import type { EstabelecimentoTag } from "../../../../../constants/perfisParceiros"

interface Props {
    tags: EstabelecimentoTag[]
    totalSteps: number
    onSelect: (tag: EstabelecimentoTag) => void
    onBack: () => void
}

function SelectCategory({ tags, totalSteps, onSelect, onBack }: Props) {
    const [selecionado, setSelecionado] = useState<EstabelecimentoTag | null>(null)

    const handleAvancar = () => {
        if (selecionado) onSelect(selecionado)
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Novo Ponto</h1>
                    </div>

                    <p className="text-sm text-white-500 -mt-2">
                        Para começar, identifique a categoria do seu estabelecimento
                    </p>

                    <div className="flex flex-col gap-1">
                        <div className="w-full h-2 bg-white-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-primary rounded-full transition-all duration-300"
                                style={{ width: `${(1 / totalSteps) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-white-500 text-center">
                            Passo 1 de {totalSteps}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {tags.map((tag) => (
                            <button
                                key={tag.categoriaId}
                                onClick={() => setSelecionado(tag)}
                                className={`flex flex-col items-start gap-3 p-4 bg-white rounded-xl border-2 shadow-card transition-all duration-200 text-left ${
                                    selecionado?.categoriaId === tag.categoriaId
                                        ? "border-green-primary ring-2 ring-green-200"
                                        : "border-transparent hover:border-green-200"
                                }`}
                            >
                                <img src={`/assets/icons/${tag.icon}`} alt={tag.label} className="w-7 h-7" />
                                <span className="text-sm font-medium text-black-100">{tag.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <Button onClick={handleAvancar} disabled={!selecionado} variant="primary" fullWidth>
                            Avançar
                        </Button>
                        <Button onClick={onBack} variant="secondary" fullWidth>
                            Voltar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default SelectCategory