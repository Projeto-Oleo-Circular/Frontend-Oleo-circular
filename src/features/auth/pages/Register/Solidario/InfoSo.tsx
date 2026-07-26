import { useState, ChangeEvent } from 'react';
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';
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

function InfoSo({ 
    onNext, 
    onBack, 
    step, 
    totalSteps, 
    userName = 'Usuário',
    onDataChange, 
    initialData = {} 
}: Props) {
    const [formData, setFormData] = useState({
        responsavel: initialData.responsavel || '',
        cnpj: initialData.documento || '',
        razaoSocial: initialData.nomeRazaoSocial || '',
        cep: initialData.cep || '',
        cidade: initialData.cidade || '',
        rua: initialData.logradouro || '',
        bairro: initialData.bairro || '',
        numero: initialData.numero || ''
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value } = target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (onDataChange) {
            onDataChange({
                documento: formData.cnpj,
                nomeRazaoSocial: formData.razaoSocial,
                cep: formData.cep,
                cidade: formData.cidade,
                logradouro: formData.rua,
                bairro: formData.bairro,
                numero: formData.numero,
                responsavel: formData.responsavel
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
                            Próximo passo é preencher seus dados de contato e localização.
                        </p>
                    </div>
                    
                    <ProgressBar step={step} totalSteps={totalSteps} />

                    <div className="w-full pb-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
                            INFORMAÇÕES DA INSTITUIÇÃO
                        </p>
                        
                        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                            <Input 
                                type="text" 
                                icon="icon-name" 
                                placeholder="Nome do responsável legal" 
                                name="responsavel"
                                value={formData.responsavel}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />
                            
                            <Input 
                                type="text" 
                                icon="icon-CNPJ" 
                                placeholder="CNPJ" 
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-razaoSocial" 
                                placeholder="Razão social" 
                                name="razaoSocial"
                                value={formData.razaoSocial}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-CEP" 
                                placeholder="CEP" 
                                name="cep"
                                value={formData.cep}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-city" 
                                placeholder="Cidade" 
                                name="cidade"
                                value={formData.cidade}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-rua" 
                                placeholder="Rua" 
                                name="rua"
                                value={formData.rua}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-bairro" 
                                placeholder="Bairro" 
                                name="bairro"
                                value={formData.bairro}
                                onChange={handleInputChange}
                                noBorder 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="text" 
                                icon="icon-number" 
                                placeholder="Número do estabelecimento" 
                                name="numero"
                                value={formData.numero}
                                onChange={handleInputChange}
                                noBorder 
                            />
                        </div>

                        <div className="flex flex-col gap-4">
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

export default InfoSo;