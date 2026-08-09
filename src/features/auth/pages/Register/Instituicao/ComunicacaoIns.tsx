import { useState, ChangeEvent } from 'react';
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';
import Button from '../../../../../components/ui/Button';
import Checkbox from '../../../../../components/ui/Checkbox';
import Dropdown from '../../../../../components/ui/Dropdown'; // Certifique-se de ajustar o caminho de importação

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
    userName?: string;
    onDataChange?: (data: any) => void;
    initialData?: any;
}

const REDES_OPCOES = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'outra', label: 'Outra Rede Social' },
];

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

    const [selectedRede, setSelectedRede] = useState<string | null>(initialData.redeSelecionada || null);
    const [redesSociaisValue, setRedesSociaisValue] = useState<string>(initialData.redesSociais || '');
    const [site, setSite] = useState<string>(initialData.site || '');
    const [aceiteDivulgacao, setAceiteDivulgacao] = useState<boolean>(initialData.aceiteDivulgacao || false);

    const handleSelectRede = (value: string) => {
        setSelectedRede(value);
    };

    const handleNext = () => {
        if (onDataChange) {
            onDataChange({
                redeSelecionada: selectedRede,
                redesSociais: redesSociaisValue,
                site: site,
                aceiteDivulgacao: aceiteDivulgacao
            });
        }
        onNext();
    };

    const getPlaceholderInput = () => {
        const item = REDES_OPCOES.find(r => r.value === selectedRede);
        return item ? `Digite o link ou @ do seu ${item.label}` : 'Digite a sua rede social';
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
                            Informe suas redes sociais e site para divulgarmos sua empresa como parceira
                        </p>
                    </div>
                    
                    <ProgressBar step={step} totalSteps={totalSteps} />

                    <div className="w-full pb-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
                            REDES SOCIAIS
                        </p>
                        
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex flex-col">
                                <Dropdown 
                                    placeholder="Selecione a rede social"
                                    options={REDES_OPCOES}
                                    value={selectedRede}
                                    onChange={handleSelectRede}
                                />
                            </div>

                            {selectedRede && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fadeIn">
                                    <Input 
                                        type="text" 
                                        icon="icon-redesSociais" 
                                        placeholder={getPlaceholderInput()}
                                        name="redesSociais"
                                        value={redesSociaisValue}
                                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => setRedesSociaisValue(e.target.value)}
                                        noBorder 
                                    />
                                </div>
                            )}

                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <Input 
                                    type="text" 
                                    icon="icon-site" 
                                    placeholder="Site (opcional)" 
                                    name="site"
                                    value={site}
                                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSite(e.target.value)}
                                    noBorder 
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 pb-4">
                            <Checkbox 
                                id="aceiteDivulgacao"
                                checked={aceiteDivulgacao}
                                onChange={(checked: boolean) => setAceiteDivulgacao(checked)}
                            />
                            <label htmlFor="aceiteDivulgacao" className="text-xs sm:text-sm text-black-200 cursor-pointer">
                                Aceito os{' '}
                                <button 
                                    className="text-green-primary font-bold underline hover:text-green-hover transition-colors" 
                                    onClick={() => navigate('')}
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
                </main>
                
            </div>
        </div>
    );
}

export default ComunicacaoIns