import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";
import Input from '../../../../components/ui/Input';
import { useState } from "react";
import StepProfile from "./StepProfile";

import InfoIns from "./Instituicao/InfoIns";
import ComunicacaoIns from "./Instituicao/ComunicacaoIns"
import VolumeIns from "./Instituicao/VolumeIns"
import AboutProjectIns from "./Instituicao/AboutProjectIns"
import FeedbackIns from "./Instituicao/FeedbackIns"

import InfoCt from "./Comunitario/InfoCt";
import VolumeCt from "./Comunitario/VolumeCt"
import AboutProjectCt from "./Comunitario/AboutProjectCt"
import FeedbackCt from "./Comunitario/FeedbackCt"

import InfoSo from "./Solidario/InfoSo";
import VolumeSo from "./Solidario/VolumeSo"
import AboutProjectSo from "./Solidario/AboutProjectSo"
import FeedbackSo from "./Solidario/FeedbackSo"

function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0)
    const [profile, setProfile] = useState<string | null>(null)

    const onNext = () => setStep(prev => prev + 1)
    const onBack = () => {
        if (step === 0) navigate('/Login')
        else setStep(prev => prev - 1)
    }

    const onSelectProfile = (selectedProfile: string) => {
        setProfile(selectedProfile)
        setStep(2)
    }

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
                <HeaderCadastro
                 title="Criar Conta"
                 onBack={onBack}
                />
    
                <div className="flex flex-1 overflow-hidden">
                    <aside className="hidden md:flex md:w-1/2">
                        <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                    </aside>
    
                    <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background overflow-y-auto">
                        <img src="src/assets/LogoVertical.png" alt="Logo do Óleo Circular" className="h-30 md:h-36 w-auto m-4" />
                        <div className="w-full max-w-sm py-4">
                            <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">DADOS DE ACESSO</p>
                            <div className="bg-white rounded-xl shadow-sm mb-4">
                                <Input type="text" icon="icon-name" placeholder="Seu nome completo" noBorder />
                                <hr className="border-white-100 mx-full" />
                                <Input type="email" icon="email" placeholder="Seu e-mail" noBorder />
                                <hr className="border-white-100 mx-full" />
                                <Input type="password" icon="cadeado" placeholder="Sua senha" noBorder />
                                <hr className="border-white-100 mx-full" />
                                <Input type="password" icon="cadeado" placeholder="Confirme sua senha" noBorder />
                            </div>
    
    
    
                            <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3 mt-8">CONTATO</p>
                            <div className="bg-white rounded-xl shadow-sm mb-4">
                                <Input type="tel" icon="phone" placeholder="Telefone / WhatsApp" noBorder />
                            </div>
    
                            <div className="flex items-center gap-2 mb-6">
                                <input type="checkbox" className="w-4 h-4 accent-green-primary" />
                                <label className="text-xs md:text-sm text-black-200">
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
    
                        <button className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200" onClick={onNext}>
                            Avançar
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