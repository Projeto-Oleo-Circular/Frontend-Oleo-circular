import { useState } from "react";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Dropdown from '../../../../../components/ui/Dropdown';

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number
    totalSteps: number
    userName?: string
}

const partnerOptions = [
    { value: 'asmare', label: 'Asamare' },
    { value: 'associerecicle', label: 'Associerecicle' },
    { value: 'coomarp', label: 'Coomarp' },
    { value: 'outro', label: 'Outro' },
]

function AboutProjectSo({ onNext, onBack, step, totalSteps, userName = 'Milena'}: Props) {
    const [partner, setPartner] = useState<string | null>(null)
    const [howFound, setHowFound] = useState('')
    const [observation, setObservation] = useState('')
    
    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 px-6 sm:px-8 md:px-16 bg-background overflow-y-auto">
                    <div className="flex-1">
                        <div className="pt-6 pb-3">
                            <h1 className="text-xl md:text-2xl font-bold text-green-primary">Bem-vindo(a), {userName}!</h1>
                            <p className="text-sm md:text-base font-medium text-white-500">
                                Nos conte como conheceu o projeto.
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="w-full pb-4">
                            <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">COMO CONHECEU O ÓLEO CIRCULAR</p>
                            
                            <div className="flex flex-col gap-3 mb-6">
                               <Dropdown
                                    placeholder="Selecione um parceiro"
                                    options={partnerOptions}
                                    value={partner}
                                    onChange={setPartner}
                                />

                                <textarea
                                    value={howFound}
                                    onChange={e => setHowFound(e.target.value)}
                                    placeholder="Como descobriu o projeto?"
                                    className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-white-500 outline-none resize-none h-28 placeholder:text-white-500"
                                />

                                <textarea
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                    placeholder="Quer deixar alguma observação?"
                                    className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-white-500 outline-none resize-none h-28 placeholder:text-white-500"
                                />

                            </div>

                            <div className="flex flex-col gap-6 md:gap-8 mt-8">
                                <button 
                                    className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200" 
                                    onClick={onNext}
                                >
                                    Avançar
                                </button>

                                <button 
                                    className="w-full bg-white-primary text-green-primary font-bold py-3 rounded-xl border-2 border-green-primary hover:bg-green-100 transition-all duration-200" 
                                    onClick={onBack}
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-black-100 py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default AboutProjectSo;