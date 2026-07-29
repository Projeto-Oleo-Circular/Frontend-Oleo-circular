import HeaderPublic from '../../../../components/layout/HeaderPublic';
import Input from '../../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';

function NewPassword() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen">
            <HeaderPublic />

            <div className="flex flex-1">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-158 object-cover" />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background">
                    <img src="/assets/LogoVertical.png" alt="Logo do Óleo Circular" className="h-30 md:h-36 w-auto m-12" />
                    <div className="w-full max-w-sm">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-2">NOVA SENHA</p>
                        <label className="block text-sm font-medium text-white-400 mb-4">
                            Digite sua nova senha
                        </label>
                        <div className="bg-white rounded-xl shadow-sm mb-8">
                            <Input type="password" icon="cadeado" placeholder="Sua nova senha" noBorder />
                            <hr className="border-white-100 mx-full" />
                            <Input type="password" icon="cadeado" placeholder="Confirme sua nova senha" noBorder />
                        </div>

                    <div className="flex flex-col gap-8 md:gap-4">
                        <button className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200" onClick={() => navigate("/Home")}>
                            Salvar
                        </button>

                        <button className="w-full bg-white-primary text-green-primary font-bold py-3 rounded-xl border-2 border-green-primary hover:bg-green-100 transition-all duration-200" onClick={() => navigate("/Forgot-Password")}>
                            Voltar
                        </button>
                    </div>
                    </div>

                    <p className="absolute bottom-6 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default NewPassword;