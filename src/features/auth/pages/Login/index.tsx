import HeaderPublic from '../../../../components/layout/HeaderPublic';
import Input from '../../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen">
            <HeaderPublic />

            <div className="flex flex-1">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-158 object-cover" />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background">
                    <img src="src/assets/LogoVertical.png" alt="Logo do Óleo Circular" className="h-30 md:h-36 w-auto m-12" />
                    <div className="w-full max-w-sm">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">DADOS DE ACESSO</p>
                        <div className="bg-white rounded-xl shadow-sm mb-4">
                            <Input type="email" icon="email" placeholder="Seu e-mail" noBorder />
                            <hr className="border-white-100 mx-full" />
                            <Input type="password" icon="cadeado" placeholder="Sua senha" noBorder />
                        </div>
                    <div className="flex justify-end mb-6">
                        <button className="text-green-primary text-sm font-bold" onClick={() => navigate("/ForgotPassword")}>
                            Esqueci minha senha?
                        </button>
                    </div>

                    <button className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200">
                        Entrar
                    </button>

                    <p className="text-center text-sm text-black-100">
                        Não tem um conta? {' '}
                        <button className="text-green-primary font-bold" onClick={() => navigate("/Register")}>
                            Criar conta
                        </button>
                    </p>
                    </div>

                    <p className="absolute bottom-6 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default Login;