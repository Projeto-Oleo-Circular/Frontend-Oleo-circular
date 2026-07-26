import { useState, ChangeEvent } from 'react';
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';
import Button from '../../../../../components/ui/Button';
import { authService } from '../../../../../services/authService'

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

    const [fieldErrors, setFieldErrors] = useState({
        responsavel: '',
        cnpj: '',
        razaoSocial: '',
        cep: '',
        cidade: '',
        rua: '',
        bairro: '',
        numero: ''
    });

    const [loadingCep, setLoadingCep] = useState(false);

    const formatCep = (value: string): string => {
        const cleaned = value.replace(/\D/g, '').slice(0, 8);
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        }
        return cleaned;
    };

    const formatDocument = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length <= 11) {
            return cleaned
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return cleaned
                .slice(0, 14)
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    const validateCNPJ = (cnpj: string): boolean => {
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return false;
        if (/^(\d)\1+$/.test(cleaned)) return false;

        let sum = 0;
        let weight = 5;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleaned[i]) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        sum = 0;
        weight = 6;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleaned[i]) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        return parseInt(cleaned[12]) === digit1 && parseInt(cleaned[13]) === digit2;
    };

    const validateCPF = (cpf: string): boolean => {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length !== 11) return false;
        if (/^(\d)\1+$/.test(cleaned)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i]) * (10 - i);
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned[i]) * (11 - i);
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        return parseInt(cleaned[9]) === digit1 && parseInt(cleaned[10]) === digit2;
    };

    const validateDocument = (doc: string): { valid: boolean; message: string } => {
        const cleaned = doc.replace(/\D/g, '');

        if (!doc) {
            return { valid: false, message: 'CNPJ/CPF é obrigatório' };
        }

        if (cleaned.length === 11) {
            if (validateCPF(doc)) {
                return { valid: true, message: '' };
            } else {
                return { valid: false, message: 'CPF inválido' };
            }
        } else if (cleaned.length === 14) {
            if (validateCNPJ(doc)) {
                return { valid: true, message: '' };
            } else {
                return { valid: false, message: 'CNPJ inválido' };
            }
        } else {
            return { valid: false, message: 'CNPJ/CPF deve ter 11 (CPF) ou 14 (CNPJ) dígitos' };
        }
    };

    const validateForm = (): boolean => {
        let hasError = false;
        const errors = {
            responsavel: '',
            cnpj: '',
            razaoSocial: '',
            cep: '',
            cidade: '',
            rua: '',
            bairro: '',
            numero: ''
        };

        if (!formData.responsavel) {
            errors.responsavel = 'Nome do responsável é obrigatório';
            hasError = true;
        }

        const docValidation = validateDocument(formData.cnpj);
        if (!docValidation.valid) {
            errors.cnpj = docValidation.message;
            hasError = true;
        }

        if (!formData.razaoSocial) {
            errors.razaoSocial = 'Razão social é obrigatória';
            hasError = true;
        }

        if (!formData.cep) {
            errors.cep = 'CEP é obrigatório';
            hasError = true;
        }

        if (!formData.cidade) {
            errors.cidade = 'Cidade é obrigatória';
            hasError = true;
        }

        if (!formData.rua) {
            errors.rua = 'Rua é obrigatória';
            hasError = true;
        }

        if (!formData.bairro) {
            errors.bairro = 'Bairro é obrigatório';
            hasError = true;
        }

        if (!formData.numero) {
            errors.numero = 'Número é obrigatório';
            hasError = true;
        }

        setFieldErrors(errors);
        return !hasError;
    };

    const handleInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value } = target;

        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'cnpj') {
            const formatted = formatDocument(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
            return;
        }

        if (name === 'cep') {
            const formatted = formatCep(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));

            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length === 8) {
                setLoadingCep(true);
                try {
                    const address = await authService.buscarCep(cleaned);
                    setFormData(prev => ({
                        ...prev,
                        cidade: address.cidade || '',
                        rua: address.logradouro || '',
                        bairro: address.bairro || '',
                    }));
                    setFieldErrors(prev => ({
                        ...prev,
                        cidade: '',
                        rua: '',
                        bairro: '',
                    }));
                } catch {
                    setFieldErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
                } finally {
                    setLoadingCep(false);
                }
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (!validateForm()) {
            return;
        }

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
                    <img src="src/assets/Imagem 3.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
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
                                error={fieldErrors.responsavel}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-CNPJ"
                                placeholder="CNPJ ou CPF"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.cnpj}
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
                                error={fieldErrors.razaoSocial}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-CEP"
                                placeholder={loadingCep ? 'Buscando CEP...' : 'CEP'}
                                name="cep"
                                value={formData.cep}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.cep}
                                disabled={loadingCep}
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
                                error={fieldErrors.cidade}
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
                                error={fieldErrors.rua}
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
                                error={fieldErrors.bairro}
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
                                error={fieldErrors.numero}
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
    );
}

export default InfoSo;