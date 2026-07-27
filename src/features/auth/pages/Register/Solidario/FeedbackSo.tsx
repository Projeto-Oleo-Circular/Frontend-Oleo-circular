import { useNavigate } from "react-router-dom"
import ProgressBar from "../../../../../components/ui/ProgressBar"
import Button from '../../../../../components/ui/Button'
import { useState } from "react"

interface Props {
    step: number
    totalSteps: number
    userName?: string
    onSubmit?: () => Promise<void>
    loading?: boolean
    onBack?: () => void
}

function FeedbackSo({  
    step, 
    totalSteps, 
    userName = 'Usuário',
    onSubmit,
    loading = false,
    onBack
}: Props) {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (isSubmitting || loading) return

        setIsSubmitting(true)
        try {
            if (onSubmit) {
                await onSubmit()
            }
            navigate("/login")
        } catch (error: any) {
            setIsSubmitting(false)
            
            const message = error.response?.data?.message || 'Erro ao finalizar cadastro. Tente novamente.'
            setError(message)
            
            if (error.response?.status === 409 || 
                message.includes('CNPJ/CPF já cadastrado') || 
                message.includes('CPF') || 
                message.includes('CNPJ') ||
                message.includes('E-mail já cadastrado') ||
                message.includes('email já cadastrado')) {
                
                setError(message)
            } else {
                setError(message)
            }
        }
    }

    const handleGoBack = () => {
        if (onBack) {
            onBack()
        } else {
            navigate(-1)
        }
    }

    return (
        <div className="flex flex-col h-screen">
                
            <header className="flex items-center px-4 md:px-8 py-3 bg-white border-b border-white-100 h-20">
                <img src="/src/assets/logo-horizontal.svg" alt="Óleo Circular" className="h-10 w-auto" />
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Imagem 1.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 bg-background overflow-y-auto">
                    <div className="flex-1 flex flex-col px-6 sm:px-8 md:px-16">
                        <div className="pt-6 pb-3">
                            <h1 className="text-xl md:text-2xl font-bold text-green-primary">
                                Bem-vindo(a), {userName}!
                            </h1>
                            <p className="text-sm md:text-base font-medium text-white-500">
                                {error ? 'Ops! Algo deu errado. Retorne até a página das informações da instituição e corrija o erro.' : 'Aguarde a sua aprovação para ter acesso ao aplicativo.'}
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="flex-1 flex flex-col items-center justify-center pb-4">                            
                            <img 
                                src={error ? "/src/assets/icons/icon-erro-feedback.svg" : "/src/assets/icons/icon-relogio.svg"} 
                                alt={error ? "Erro" : "Relógio"} 
                                className="h-16 md:h-56 mt-4 mb-4" 
                            />
                            
                            <h2 className={`text-2xl md:text-3xl font-bold mb-3 text-center ${error ? 'text-red-500' : 'text-green-primary'}`}>
                                {error ? 'Cadastro não concluído!' : 'Cadastro enviado!'}
                            </h2>
                            
                            <p className={`text-sm md:text-base text-center max-w-sm ${error ? 'text-red-500' : 'text-green-primary'}`}>
                                {error ? (
                                    <>
                                        {error}
                                    </>
                                ) : (
                                    <>
                                        Aguarde a aprovação da{' '} 
                                        <span className="font-bold">Equipe Óleo Circular</span> 
                                        {' '} para ter acesso ao aplicativo. Você receberá um e-mail em breve.
                                    </>
                                )}
                            </p>

                            {error ? (
                                <div className="flex flex-col gap-3 w-full max-w-sm mt-6">
                                    <Button
                                        type="button"
                                        onClick={handleGoBack}
                                        variant="secondary"
                                        fullWidth={false}
                                        className="w-full"
                                    >
                                        Voltar e corrigir
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        variant="primary"
                                        fullWidth={false}
                                        className="w-full"
                                        disabled={loading || isSubmitting}
                                    >
                                        {isSubmitting ? 'Tentando novamente...' : 'Tentar novamente'}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    variant="primary"
                                    fullWidth={false}
                                    className="w-full max-w-sm mt-6"
                                    disabled={loading || isSubmitting}
                                >
                                    {isSubmitting ? 'Finalizando...' : 'Ir para o Login'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden w-full flex-shrink-0">
                        <img 
                            src="/src/assets/Slogan.png" 
                            alt="Mulher segurando uma garrafa de óleo" 
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    <p className="text-center text-xs text-black-100 py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default FeedbackSo