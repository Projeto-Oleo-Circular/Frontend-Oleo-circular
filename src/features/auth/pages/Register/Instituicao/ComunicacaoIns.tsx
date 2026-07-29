import { useState, ChangeEvent } from 'react';
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';
import Button from '../../../../../components/ui/Button';
import Checkbox from '../../../../../components/ui/Checkbox';

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
    userName?: string;
    onDataChange?: (data: any) => void;
    initialData?: any;
}

function ComunicacaoIns({ 
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
        redesSociais: initialData.redesSociais || '',
        site: initialData.site || '',
        aceiteDivulgacao: initialData.aceiteDivulgacao || false
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value } = target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, aceiteDivulgacao: checked }));
    };

    const handleNext = () => {
        if (onDataChange) {
            onDataChange({
                redesSociais: formData.redesSociais,
                site: formData.site,
                aceiteDivulgacao: formData.aceiteDivulgacao
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
                        src="/assets/Imagem 1.jpg" 
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
                            Gostaria de ser divulgado nas nossas redes sociais?
                        </p>
                    </div>
                    
                    <ProgressBar step={step} totalSteps={totalSteps} />

                    <div className="w-full pb-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
                            COMUNICAÇÃO
                        </p>
                        
                        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                            <Input 
                                type="text" 
                                icon="icon-redesSociais" 
                                placeholder="Redes sociais (opcional)" 
                                name="redesSociais"
                                value={formData.redesSociais}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />
                            
                            <Input 
                                type="text" 
                                icon="icon-site" 
                                placeholder="Site (opcional)" 
                                name="site"
                                value={formData.site}
                                onChange={handleInputChange}
                                noBorder 
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 pb-4">
                            <Checkbox 
                                id="aceiteDivulgacao"
                                checked={formData.aceiteDivulgacao}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor="aceiteDivulgacao" className="text-xs sm:text-sm text-black-200 cursor-pointer">
                                Aceito os{' '}
                                <button 
                                    className="text-green-primary font-bold underline hover:text-green-hover transition-colors" 
                                    onClick={() => navigate('/termos')}
                                    type="button"
                                >
                                    Termos de Divulgação
                                </button>
                                {' '} de parceria
                            </label>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4 mt-4">
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

export default ComunicacaoIns