import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";
import Input from '../../../../components/ui/Input';

function Register() {
    const navigate = useNavigate();

    return (
         <div className="flex flex-col h-screen">
            <HeaderCadastro
             title="Criar Conta"
             onBack={() => navigate('/Login')}
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
                            <Input type="text" icon="name" placeholder="Nome completo" noBorder />
                            <hr className="border-white-100 mx-full" />
                            <Input type="email" icon="email" placeholder="Seu e-mail" noBorder />
                            <hr className="border-white-100 mx-full" />
                            <Input type="password" icon="cadeado" placeholder="Sua senha" noBorder />
                            <hr className="border-white-100 mx-full" />
                            <Input type="password" icon="cadeado" placeholder="Confirmar senha" noBorder />
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

                    <button className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200">
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

export default Register;