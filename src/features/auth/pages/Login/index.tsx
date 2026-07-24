import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderPublic from '../../../../components/layout/HeaderPublic';
import { authService } from '../../../../../src/services/authService';
import Input from '../../../../components/ui/Input';

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.senha) {
                setError('Os campos não podem estar vazios');
                setLoading(false);
                return;
            }

            console.log('Tentando login com:', formData);

            const response = await authService.login({
                email: formData.email,
                senha: formData.senha
            });

            console.log('Login realizado com sucesso:', response);
            navigate('/dashboard');
            
        } catch (err: any) {
            console.error('Erro no login:', err);
            setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderPublic />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Imagem 4.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background overflow-y-auto relative">
                    <div className="flex flex-col items-center w-full max-w-sm mt-8">
                        <div className="flex flex-col items-center mb-8">
                            <img src="src/assets/logo-horizontal.svg" alt="Logo do Óleo Circular" className="h-32 md:h-36 w-auto" />
                            <p className="text-sm md:text-base text-black-100 font-medium mt-2 text-center">Plataforma de Coleta Solidária</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleLogin} className="w-full max-w-sm mt-4">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">DADOS DE ACESSO</p>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                            <Input
                                type="email"
                                name="email"
                                icon="email"
                                placeholder="Seu e-mail"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                                noBorder
                            />
                            <hr className="border-white-100" />
                            <Input
                                type="password"
                                name="senha"
                                icon="cadeado"
                                placeholder="Sua senha"
                                value={formData.senha}
                                onChange={handleInputChange}
                                disabled={loading}
                                noBorder
                            />
                        </div>

                        <div className="flex justify-end mb-6">
                            <button 
                                type="button"
                                className="text-green-primary text-sm font-medium hover:text-green-hover transition-colors" 
                                onClick={() => navigate("/forgot-password")}
                                disabled={loading}
                            >
                                Esqueci minha senha?
                            </button>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <p className="text-center text-sm text-black-100">
                            Não tem uma conta? {' '}
                            <button 
                                type="button"
                                className="text-green-primary font-bold hover:text-green-hover transition-colors" 
                                onClick={() => navigate("/register")}
                                disabled={loading}
                            >
                                Criar conta
                            </button>
                        </p>
                    </form>

                    <p className="absolute bottom-6 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    );
}

export default Login;