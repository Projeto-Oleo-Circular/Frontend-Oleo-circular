import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Input from '../../../../../components/ui/Input';


interface Props {
    onNext: () => void;
    onBack: () => void;
    step: number
    totalSteps: number
    userName?: string
}

function InfoCt({ onNext, onBack, step, totalSteps, userName = 'Milena'}: Props) {
    return (
        <div className="flex flex-col h-screen">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-over" />
                </aside>

            <main className="flex flex-col w-full md:w-1/2 px-8 sm:px-8 md:px-16 bg-background overflow-y-auto">
                <div className="pt-6 pb-3">
                    <h1 className="text-xl md:text-2xl font-bold text-green-primary">Bem-vindo(a), {userName}!</h1>
                    <p className="text-sm md:text-base font-medium text-white-500">
                        Próximo passo é preencher seus dados de contato e localização.
                    </p>
                </div>
                
                <ProgressBar step={step} totalSteps={totalSteps} />

                <div className="w-full pb-4">
                    <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">INFORMAÇÕES DA INSTITUIÇÃO</p>
                    
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-name" placeholder="Nome do responsável legal" noBorder />
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-CNPJ" placeholder="CNPJ" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-razaoSocial" placeholder="Razão social" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-CEP" placeholder="CEP" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-city" placeholder="Cidade" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-rua" placeholder="Rua" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-bairro" placeholder="Bairro" noBorder />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <Input type="text" icon="icon-number" placeholder="Número do estabelecimento" noBorder />
                        </div>

                    </div>

                    <div className="flex flex-col gap-6 md:gap-8 mt-8">
                        <button className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200" onClick={onNext}>
                            Avançar
                        </button>

                        <button className="w-full bg-white-primary text-green-primary font-bold py-3 rounded-xl border-2 border-green-primary hover:bg-green-100 transition-all duration-200" onClick={onBack}>
                            Voltar
                        </button>
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

export default InfoCt;