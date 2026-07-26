import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Button from '../../../../../components/ui/Button';

interface Props {
    onBack: () => void
    step: number
    totalSteps: number
    userName?: string
    onSubmit?: () => void
}

function FeedbackCt({ 
    onBack, 
    step, 
    totalSteps, 
    userName = 'Usuário',
    onSubmit
}: Props) {
    const navigate = useNavigate();

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit();
        }
        setTimeout(() => {
            navigate("/Login");
        }, 500);
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 bg-background overflow-y-auto relative">
                    <div className="flex-1 flex flex-col px-6 sm:px-8 md:px-16">
                        <div className="pt-6 pb-3">
                            <h1 className="text-xl md:text-2xl font-bold text-green-primary">
                                Bem-vindo(a), {userName}!
                            </h1>
                            <p className="text-sm md:text-base font-medium text-white-500">
                                Aguarde a sua aprovação para ter acesso ao aplicativo.
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="flex-1 flex flex-col items-center justify-center pb-4">                            
                            <img 
                                src="/src/assets/icons/icon-relogio.svg" 
                                alt="Imagem de um relógio" 
                                className="h-16 md:h-24 mt-4" 
                            />
                            
                            <h2 className="text-2xl md:text-3xl font-bold text-green-primary mb-3 text-center">
                                Cadastro enviado!
                            </h2>
                            
                            <p className="text-sm md:text-base text-green-primary text-center max-w-sm">
                                Aguarde a aprovação da{' '} 
                                <span className="font-bold">Equipe Óleo Circular</span> 
                                {' '} para ter acesso ao aplicativo. Você receberá um e-mail em breve.
                            </p>
    
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                variant="primary"
                                fullWidth={false}
                                className="w-full max-w-sm mt-6"
                            >
                                Ir para o Login
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

                    <p className="text-center text-xs text-black-100 py-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default FeedbackCt;