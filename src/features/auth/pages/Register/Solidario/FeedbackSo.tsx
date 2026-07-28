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
}

function FeedbackSo({  
    step, 
    totalSteps, 
    userName = 'Usuário',
    onSubmit,
    loading = false,
}: Props) {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (isSubmitting || loading) return

        setIsSubmitting(true)
        if (onSubmit) {
            await onSubmit()
        }
         navigate("/login")
    }

    return (
        <div className="flex flex-col h-screen">
                
            <header className="flex items-center px-4 sm:px-6 md:px-8 py-3 bg-white border-b border-white-100 h-16 sm:h-20">
                <img 
                    src="/src/assets/logo-horizontal.svg" 
                    alt="Óleo Circular" 
                    className="h-8 sm:h-10 w-auto" 
                />
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2 relative">
                    <img 
                        src="src/assets/Imagem 1.jpg" 
                        alt="Projeto Óleo Circular" 
                        className="w-full h-full object-cover object-center" 
                    />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 bg-background overflow-y-auto">
                    <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 lg:px-12">
                        <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-green-primary">
                                Bem-vindo(a), {userName}!
                            </h1>
                            <p className="text-sm sm:text-base font-medium text-white-500">
                                Aguarde a sua aprovação para ter acesso ao aplicativo.
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="flex-1 flex flex-col items-center justify-center pb-4">                            
                            <img 
                                src="/src/assets/icons/icon-relogio.svg"
                                alt="Relógio"
                                className="h-20 sm:h-24 md:h-32 lg:h-40 mt-4 mb-4" 
                            />
                            
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-center text-green-primary">
                                Cadastro enviado!
                            </h2>
                            
                            <p className="text-sm sm:text-base text-center max-w-sm px-4 text-green-primary">
                                Aguarde a aprovação da{' '} 
                                <span className="font-bold">Equipe Óleo Circular</span> 
                                {' '} para ter acesso ao aplicativo. Você receberá um e-mail em breve.
                            </p>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                variant="primary"
                                fullWidth={false}
                                className="w-full max-w-xs sm:max-w-sm mt-4 sm:mt-6"
                                disabled={loading || isSubmitting}
                            >
                                {isSubmitting ? 'Finalizando...' : 'Ir para o Login'}
                            </Button>
                        </div>
                    </div>

                    <div className="md:hidden w-full flex-shrink-0">
                        <img 
                            src="/src/assets/Slogan.png" 
                            alt="Mulher segurando uma garrafa de óleo" 
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    <p className="text-center text-xs text-black-100 py-4 sm:py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default FeedbackSo