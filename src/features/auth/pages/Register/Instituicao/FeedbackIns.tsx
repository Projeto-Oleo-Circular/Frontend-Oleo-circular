import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number
    totalSteps: number
    userName?: string
}

function FeedbackIns({ onNext, onBack, step, totalSteps, userName = 'Milena'}: Props) {

    
    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col w-full md:w-1/2 px-6 sm:px-8 md:px-16 bg-background overflow-y-auto">
                    <div className="flex-1">
                        <div className="pt-6 pb-3">
                            <h1 className="text-xl md:text-2xl font-bold text-green-primary">Bem-vindo(a), {userName}!</h1>
                            <p className="text-sm md:text-base font-medium text-white-500">
                                Aguarde a sua aprovação para ter acesso ao aplicativo.
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="w-full pb-4">                            
                            <div className="flex flex-col gap-3 mb-6">

                            </div>

                            <div className="flex flex-col gap-6 md:gap-8 mt-8">
                                <button 
                                    className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200" 
                                    onClick={onNext}
                                >
                                    Avançar
                                </button>
                            </div>
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

export default FeedbackIns;