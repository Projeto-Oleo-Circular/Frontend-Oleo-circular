import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import { useState } from "react";
import RangeSlider from "../../../../../components/ui/RangeSlider";

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number
    totalSteps: number
    userName?: string
}

function VolumeSo({ onNext, onBack, step, totalSteps, userName = 'Milena'}: Props) {
    const [volume, setVolume] = useState<number>(0);
    
    const volumeMarks = [
        { value: 0, label: '0'},
        { value: 20, label: '20 L'},
        { value: 50, label: '50 L'},
        { value: 100, label: '100 L'},
        { value: 1000, label: '1000 L'},
    ]

    const handleVolumeChange = (value: number) => {
        setVolume(value);
        console.log('Volume selecionado:', value)
    }

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
                                Informe a quantidade estimada de óleo que produzirá por semana
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="w-full pb-4">
                            <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">EXPECTATIVA DE VOLUME</p>

                            <RangeSlider
                                marks={volumeMarks}
                                defaultValue={0}
                                onChange={handleVolumeChange}
                            />

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

                    <p className="text-center text-xs text-black-100 py-4 flex-shrink-0">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default VolumeSo;