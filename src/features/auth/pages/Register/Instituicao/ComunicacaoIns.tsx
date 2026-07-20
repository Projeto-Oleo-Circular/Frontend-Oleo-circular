import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';
import { useNavigate } from "react-router-dom";

interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number
    totalSteps: number
    userName?: string
}

function ComunicacaoIns({ onNext, onBack, step, totalSteps, userName = 'Milena'}: Props) {
    const navigate = useNavigate();
    
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
                                Gostaria de ser divulgado nas nossas redes sociais?
                            </p>
                        </div>
                        
                        <ProgressBar step={step} totalSteps={totalSteps} />

                        <div className="w-full pb-4">
                            <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">COMUNICAÇÃO</p>
                            
                            <div className="flex flex-col gap-3">
                                <div className="bg-white rounded-xl shadow-sm">
                                    <Input type="text" icon="icon-redesSociais" placeholder="Redes sociais" noBorder />
                                </div>

                                <div className="bg-white rounded-xl shadow-sm">
                                    <Input type="text" icon="icon-site" placeholder="Site" noBorder />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4">
                                <input type="checkbox" className="w-4 h-4 accent-green-primary" />
                                <label className="text-sm md:text-sm text-black-200">
                                    Aceito os{' '}
                                    <button className="text-green-primary font-bold underline" onClick={() => navigate('/termos')}>
                                        Termos de Divulgação
                                    </button>
                                    {' '} de parceria{' '}
                                </label>
                            </div>

                            <div className="flex flex-col gap-6 md:gap-8 mt-8">
                                <button 
                                    className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200" 
                                    onClick={onNext}
                                >
                                    Avançar
                                </button>

                                <button 
                                    className="w-full bg-white-primary text-green-primary font-bold py-3 rounded-xl border-2 border-green-primary hover:bg-green-100 transition-all duration-200" 
                                    onClick={onBack}
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-black-100 py-4 flex-shrink-0">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default ComunicacaoIns;