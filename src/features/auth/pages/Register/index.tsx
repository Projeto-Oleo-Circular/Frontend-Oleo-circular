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
import Button from "../../../../components/ui/Button"

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

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
    telefone: ''
  })

  const [additionalData, setAdditionalData] = useState({
    tipoPessoa: 'FISICA',
    documento: '',
    porte: 'PEQUENO',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    capacidadeBombona: 0,
    aceiteMarketing: false,
    redesSociais: '',
    site: '',
    aceiteDivulgacao: false,
    comoConheceu: '',
    observacao: ''
  })

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 11)
    if (limited.length <= 2) return limited
    else if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    else if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
    else return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`
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
    } else if (!validatePhone(formData.telefone)) {
      errors.telefone = 'Telefone inválido'
      hasError = true
    }

    if (!additionalData.aceiteMarketing) {
      errors.aceiteMarketing = 'Você precisa aceitar os Termos de Uso e Política de Privacidade'
      hasError = true
    }

    setFieldErrors(errors)
    return !hasError
  }

  const getCompleteRegisterData = () => {
    return {
      tipoPessoa: additionalData.tipoPessoa,
      nomeRazaoSocial: formData.nome,
      email: formData.email,
      senha: formData.senha,
      documento: additionalData.documento || '',
      porte: additionalData.porte,
      aceiteMarketing: additionalData.aceiteMarketing,
      cep: additionalData.cep || '',
      logradouro: additionalData.logradouro || '',
      numero: additionalData.numero || '',
      bairro: additionalData.bairro || '',
      capacidadeBombona: additionalData.capacidadeBombona || 0,
    }
  }

  const handleRegister = () => {
    if (!validateForm()) return
    setStep(prev => prev + 1)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const registerData = getCompleteRegisterData()
      await authService.register(registerData)
    } catch (err: any) {
      if (err.response?.data?.message) {
        addToast(err.response.data.message, 'error')
      } else if (err.response?.status === 409) {
        addToast('Este e-mail já está cadastrado.', 'error')
      } else {
        addToast('Erro ao realizar cadastro. Tente novamente.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const onNext = () => {
    if (step === 0) {
      handleRegister()
    } else {
      setStep(prev => prev + 1)
    }
  }

  const onBack = () => {
    if (step === 0) navigate('/login')
    else setStep(prev => prev - 1)
  }

  const onSelectProfile = (selectedProfile: string) => {
    setProfile(selectedProfile)
    setStep(2)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value } = target

    if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setAdditionalData(prev => ({ ...prev, aceiteMarketing: checked }))
    if (fieldErrors.aceiteMarketing) {
      setFieldErrors(prev => ({ ...prev, aceiteMarketing: '' }))
    }
  }

  const handleStepDataChange = (data: any) => {
    setAdditionalData(prev => ({ ...prev, ...data }))
  }

  const getFirstName = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'Usuário'
    return fullName.trim().split(' ')[0]
  }

  const getTotalSteps = () => {
    if (profile === 'institucional') return 6
    if (profile === 'comunitario' || profile === 'solidario') return 5
    return 5
  }

  const renderStep = () => {
    const userName = getFirstName(formData.nome)
    const currentTotalSteps = getTotalSteps()

    switch (step) {
      case 1:
        return <StepProfile
          onSelectProfile={onSelectProfile}
          onBack={onBack}
          step={step}
          userName={userName}
        />

      case 2:
        if (profile === 'institucional') return <InfoIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'comunitario') return <InfoCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'solidario') return <InfoSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        return null

      case 3:
        if (profile === 'institucional') return <ComunicacaoIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'comunitario' || profile === 'solidario') {
          setStep(4)
          return null
        }
        return null

      case 4:
        if (profile === 'institucional') return <VolumeIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'comunitario') return <VolumeCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'solidario') return <VolumeSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        return null

      case 5:
        if (profile === 'institucional') return <AboutProjectIns onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'comunitario') return <AboutProjectCt onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        if (profile === 'solidario') return <AboutProjectSo onNext={onNext} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} onDataChange={handleStepDataChange} initialData={additionalData} />
        return null

      case 6:
        if (profile === 'institucional') return <FeedbackIns onSubmit={handleFinalSubmit} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} />
        if (profile === 'comunitario') return <FeedbackCt onSubmit={handleFinalSubmit} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} />
        if (profile === 'solidario') return <FeedbackSo onSubmit={handleFinalSubmit} onBack={onBack} step={step} totalSteps={currentTotalSteps} userName={userName} />
        return null

      default:
        return null
    }
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
                <Input type="text" icon="icon-name" placeholder="Seu nome completo" name="nome" value={formData.nome} onChange={handleInputChange} noBorder error={fieldErrors.nome} />
                <hr className="border-white-100" />
                <Input type="email" icon="email" placeholder="Seu e-mail" name="email" value={formData.email} onChange={handleInputChange} noBorder error={fieldErrors.email} />
                <hr className="border-white-100" />
                <Input type="password" icon="cadeado" placeholder="Sua senha" name="senha" value={formData.senha} onChange={handleInputChange} noBorder error={fieldErrors.senha} />
                <hr className="border-white-100" />
                <Input type="password" icon="cadeado" placeholder="Confirme sua senha" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleInputChange} noBorder error={fieldErrors.confirmarSenha} />
              </div>

              <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3 mt-8">CONTATO</p>
              <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                <Input type="tel" icon="phone" placeholder="Telefone / WhatsApp" name="telefone" value={formData.telefone} onChange={handleInputChange} noBorder error={fieldErrors.telefone} />
              </div>

              <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="aceiteMarketing" checked={additionalData.aceiteMarketing} onChange={handleCheckboxChange} />
                  <label htmlFor="aceiteMarketing" className="text-xs md:text-sm text-black-200 cursor-pointer">
                    Aceito os{' '}
                    <button className="text-green-primary font-bold underline" onClick={() => navigate('/termos')}>Termos de Uso</button>
                    {' '}e a{' '}
                    <button className="text-green-primary font-bold underline" onClick={() => navigate('/privacidade')}>Política de Privacidade</button>
                  </label>
                </div>
                {fieldErrors.aceiteMarketing && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.aceiteMarketing}</p>
                )}
              </div>

              <Button type="button" onClick={onNext} disabled={loading} variant="primary">
                Avançar
              </Button>
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
    <div className="flex flex-col min-h-screen bg-background">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {renderStep()}
    </div>
  )
}

export default Register