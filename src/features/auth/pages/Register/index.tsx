import { useNavigate } from "react-router-dom"
import HeaderCadastro from "../../../../components/layout/HeaderCadastro"
import Input from '../../../../components/ui/Input'
import { useState, ChangeEvent } from "react"
import StepProfile from "./StepProfile"
import useToast from '../../../../hooks/useToast'
import ToastContainer from '../../../../components/ui/ToastContainer'
import { authService } from '../../../../services/authService'

import InfoIns from "./Instituicao/InfoIns"
import ComunicacaoIns from "./Instituicao/ComunicacaoIns"
import VolumeIns from "./Instituicao/VolumeIns"
import AboutProjectIns from "./Instituicao/AboutProjectIns"
import FeedbackIns from "./Instituicao/FeedbackIns"

import InfoCt from "./Comunitario/InfoCt"
import VolumeCt from "./Comunitario/VolumeCt"
import AboutProjectCt from "./Comunitario/AboutProjectCt"
import FeedbackCt from "./Comunitario/FeedbackCt"

import InfoSo from "./Solidario/InfoSo"
import VolumeSo from "./Solidario/VolumeSo"
import AboutProjectSo from "./Solidario/AboutProjectSo"
import FeedbackSo from "./Solidario/FeedbackSo"
import Checkbox from "../../../../components/ui/Checkbox"

function Register() {
    const navigate = useNavigate()
    const { toasts, addToast, removeToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(0)
    const [profile, setProfile] = useState<string | null>(null)
    
    const [fieldErrors, setFieldErrors] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        telefone: '',
        aceiteMarketing: ''
    })

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        telefone: '',
        tipoPessoa: 'FISICA',
        documento: '',
        porte: 'PEQUENO',
        aceiteMarketing: false,
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        capacidadeBombona: 0
    });

    const onNext = () => {
        if (step === 0) {
            handleRegister();
        } else {
            setStep(prev => prev + 1)
        }
    }

    const onBack = () => {
        if (step === 0) navigate('/Login')
        else setStep(prev => prev - 1)
    }

    const onSelectProfile = (selectedProfile: string) => {
        setProfile(selectedProfile)
        setStep(2)
    }

    const validateForm = () => {
        let hasError = false
        const errors = { 
            nome: '', 
            email: '', 
            senha: '', 
            confirmarSenha: '', 
            telefone: '',
            aceiteMarketing: '' 
        }

        if (!formData.nome) {
            errors.nome = 'Nome é obrigatório'
            hasError = true
        }

        if (!formData.email) {
            errors.email = 'E-mail é obrigatório'
            hasError = true
        } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
            errors.email = 'E-mail inválido'
            hasError = true
        }

        if (!formData.senha) {
            errors.senha = 'Senha é obrigatória'
            hasError = true
        } else if (formData.senha.length < 6) {
            errors.senha = 'Senha deve ter no mínimo 6 caracteres'
            hasError = true
        }

        if (!formData.confirmarSenha) {
            errors.confirmarSenha = 'Confirme sua senha'
            hasError = true
        } else if (formData.senha !== formData.confirmarSenha) {
            errors.confirmarSenha = 'As senhas não coincidem'
            hasError = true
        }

        if (!formData.telefone) {
            errors.telefone = 'Telefone é obrigatório'
            hasError = true
        }

        if (!formData.aceiteMarketing) {
            errors.aceiteMarketing = 'Você precisa aceitar os Termos de Uso e Política de Privacidade'
            hasError = true
        }

        setFieldErrors(errors)
        return !hasError
    }

    const handleRegister = async () => {
        if (!validateForm()) {
            return
        }

        setLoading(true)
        try {
            const registerData = {
                tipoPessoa: formData.tipoPessoa,
                nomeRazaoSocial: formData.nome,
                email: formData.email,
                senha: formData.senha,
                documento: formData.documento || '00000000000',
                porte: formData.porte,
                aceiteMarketing: formData.aceiteMarketing,
                cep: formData.cep || '00000000',
                logradouro: formData.logradouro || 'Não informado',
                numero: formData.numero || 'S/N',
                bairro: formData.bairro || 'Não informado',
                capacidadeBombona: formData.capacidadeBombona
            }

            console.log('Enviando cadastro:', registerData)

            const response = await authService.register(registerData)
            console.log('Cadastro realizado:', response)

            addToast('Cadastro realizado com sucesso! Aguarde a aprovação.', 'success')
            
            setStep(prev => prev + 1)

        } catch (err: any) {
            console.error('Erro no cadastro:', err)
            
            if (err.response?.data?.message) {
                addToast(err.response.data.message, 'error')
            } else if (err.response?.status === 400) {
                addToast('Dados inválidos. Verifique as informações.', 'error')
            } else if (err.response?.status === 409) {
                addToast('Este e-mail já está cadastrado.', 'error')
            } else {
                addToast('Erro ao realizar cadastro. Tente novamente.', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement
        const { name, value, type, checked } = target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const getTotalSteps = () => {
        if (profile === 'institucional') return 6;
        if (profile === 'comunitario' || profile === 'solidario') return 5;
        return 5
    }

    const renderStep = () => {
        if (step === 1) {
            return <StepProfile onSelectProfile={onSelectProfile} onBack={onBack} step={step} userName="Milena" />
        }

        const currentTotalSteps = getTotalSteps()

        if (profile === 'institucional') {
            if (step === 2) return <InfoIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 3) return <ComunicacaoIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 4) return <VolumeIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 5) return <AboutProjectIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 6) return <FeedbackIns onBack={onBack} step={step} totalSteps={currentTotalSteps} />
        }

        if (profile === 'comunitario') {
            if (step === 2) return <InfoCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 3) return <VolumeCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 4) return <AboutProjectCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 5) return <FeedbackCt onBack={onBack} step={step} totalSteps={currentTotalSteps} />
        }

          if (profile === 'solidario') {
            if (step === 2) return <InfoSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 3) return <VolumeSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 4) return <AboutProjectSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} />
            if (step === 5) return <FeedbackSo onBack={onBack} step={step} totalSteps={currentTotalSteps} />
        }

        return null
    }

    if (step === 0) {
    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Imagem 1.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background overflow-y-auto">
                    <div className="flex flex-col items-center w-full max-w-sm mt-8 mb-8">
                        <img src="src/assets/logo-horizontal.svg" alt="Logo Óleo Circular" className="h-32 md:h-36 w-auto" />
                        <p className="text-sm text-black-100 font-medium mt-2 text-center">Plataforma de Coleta Solidária</p>
                    </div>

                    <div className="w-full max-w-sm py-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">DADOS DE ACESSO</p>
                        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                            <Input 
                                type="text" 
                                icon="icon-name" 
                                placeholder="Seu nome completo"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange} 
                                noBorder
                                error={fieldErrors.nome} 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="email" 
                                icon="email" 
                                placeholder="Seu e-mail" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.email} 
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="password"
                                icon="cadeado"
                                placeholder="Sua senha"
                                name="senha"
                                value={formData.senha}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.senha} 
                            />
                            <hr className="border-white-100" />

                            <Input 
                                type="password" 
                                icon="cadeado" 
                                placeholder="Confirme sua senha" 
                                name="confirmarSenha"
                                value={formData.confirmarSenha}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.confirmarSenha} 
                            />
                        </div>

                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3 mt-8">CONTATO</p>
                        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                            <Input 
                                type="tel" 
                                icon="phone" 
                                placeholder="Telefone / WhatsApp"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleInputChange}
                                noBorder
                                error={fieldErrors.telefone} 
                            />
                        </div>

                        <div className="flex flex-col gap-1 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="relative flex items-center mt-0.5">
                                    <Checkbox 
                                        id="aceiteMarketing"
                                        checked={formData.aceiteMarketing}
                                        onChange={(checked) => {
                                            setFormData(prev => ({ ...prev, aceiteMarketing: checked }))
                                            if (fieldErrors.aceiteMarketing) {
                                                setFieldErrors(prev => ({ ...prev, aceiteMarketing: '' }))
                                            }
                                        }}
                                    />
                                </div>
                                <label htmlFor="aceiteMarketing" className="text-xs md:text-sm text-black-200 cursor-pointer">
                                    Aceito os{' '}
                                    <button className="text-green-primary font-bold underline" onClick={() => navigate('/termos')}>
                                        Termos de Uso
                                    </button>
                                    {' '}e a{' '}
                                    <button className="text-green-primary font-bold underline" onClick={() => navigate('/privacidade')}>
                                        Política de Privacidade
                                    </button>
                                </label>
                            </div>
                            {fieldErrors.aceiteMarketing && (
                                <p className="text-red-500 text-xs mt-1 font-medium">
                                    {fieldErrors.aceiteMarketing}
                                </p>
                            )}
                        </div>

                        <button 
                            className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200" 
                            onClick={onNext} 
                            disabled={loading}
                        >
                            {loading ? 'Cadastrando...' : 'Avançar'}
                        </button>
                    </div>

                    <p className="pb-6 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

    return (
        <div className="flex flex-col min-h-screnn bg-background">
            {renderStep()}
        </div>
    )
}

export default Register;