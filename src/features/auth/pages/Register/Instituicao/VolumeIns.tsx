import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import { useState } from "react";
import RangeSlider from "../../../../../components/ui/RangeSlider";
import Button from '../../../../../components/ui/Button';

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
    userName?: string;
    onDataChange?: (data: any) => void;
    initialData?: any;
}

function VolumeIns({ 
    onNext, 
    onBack, 
    step, 
    totalSteps, 
    userName = 'Usuário',
    onDataChange,
    initialData = {}
}: Props) {
    const [volume, setVolume] = useState<number>(initialData.expectativaGeracao || 0);
    
    const handleVolumeChange = (value: number) => {
        setVolume(value);
    };
    const volumeMarks = [
        { value: 0, label: '0'},
        { value: 20, label: '20 L'},
        { value: 50, label: '50 L'},
        { value: 100, label: '100 L'},
        { value: 1000, label: '1000 L'},
    ];

    const handleNext = () => {
        if (onDataChange) {
            onDataChange({
                expectativaGeracao: volume
            });
        }
        onNext();
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2 relative">
                    <img 
                        src="/assets/Imagem 2.jpg" 
                        alt="Projeto Óleo Circular" 
                        className="w-full h-full object-cover object-center" 
                    />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
                    <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-green-primary">
                            Bem-vindo(a), {userName}!
                        </h1>
                        <p className="text-sm sm:text-base font-medium text-white-500">
                            Informe a quantidade estimada de óleo que produzirá por semana em litros (L)
                        </p>
                    </div>
                    
                    <ProgressBar step={step} totalSteps={totalSteps} />

                    <div className="w-full pb-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
                            EXPECTATIVA DE VOLUME
                        </p>

                        <RangeSlider
                            marks={volumeMarks}
                            defaultValue={volume}
                            onChange={handleVolumeChange}
                        />

                        <div className="flex flex-col gap-3 sm:gap-4 mt-6 sm:mt-8">
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
                    
                    <p className="text-center text-xs text-black-100 py-4 sm:py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default VolumeIns