import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Dropdown from '../../../../../components/ui/Dropdown';
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

const partnerOptions = [
    { value: 'asmare', label: 'Asamare' },
    { value: 'associerecicle', label: 'Associerecicle' },
    { value: 'coomarp', label: 'Coomarp' },
    { value: 'outro', label: 'Outro' },
];

function AboutProjectSo({ 
    onNext, 
    onBack, 
    step, 
    totalSteps, 
    userName = 'Usuário',
    onDataChange,
    initialData = {}
}: Props) {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        partner: initialData.partner || null,
        howFound: initialData.comoConheceu || '',
        observation: initialData.observacao || ''
    });

    const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDropdownChange = (value: string) => {
        setFormData(prev => ({ ...prev, partner: value }));
    };

    const handleNext = () => {
        if (onDataChange) {
            onDataChange({
                comoConheceu: formData.howFound,
                observacao: formData.observation,
                partner: formData.partner
            });
        }
        onNext();
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 px-6 sm:px-8 md:px-16 bg-background overflow-y-auto">
                    <div className="pt-6 pb-3">
                        <h1 className="text-xl md:text-2xl font-bold text-green-primary">
                            Bem-vindo(a), {userName}!
                        </h1>
                        <p className="text-sm md:text-base font-medium text-white-500">
                            Nos conte como conheceu o projeto.
                        </p>
                    </div>
                    
                    <ProgressBar step={step} totalSteps={totalSteps} />

                    <div className="w-full pb-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
                            COMO CONHECEU O ÓLEO CIRCULAR
                        </p>
                        
                        <div className="flex flex-col gap-3 mb-6">
                            <Dropdown
                                placeholder="Selecione um parceiro"
                                options={partnerOptions}
                                value={formData.partner}
                                onChange={handleDropdownChange}
                            />

                            <textarea
                                name="howFound"
                                value={formData.howFound}
                                onChange={handleTextareaChange}
                                placeholder="Como descobriu o projeto?"
                                className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-black-primary outline-none resize-none h-28 placeholder:text-black-100 focus:border-green-primary transition-colors duration-200"
                            />

                            <textarea
                                name="observation"
                                value={formData.observation}
                                onChange={handleTextareaChange}
                                placeholder="Quer deixar alguma observação?"
                                className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-black-primary outline-none resize-none h-28 placeholder:text-black-100 focus:border-green-primary transition-colors duration-200"
                            />
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
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
                    
                    <p className="text-center text-xs text-black-100 py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default AboutProjectSo;