import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderPublic from '../../../../components/layout/HeaderPublic';
import { authService } from '../../../../../src/services/authService';

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
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
                setError('Preencha todos os campos');
                setLoading(false);
                return;
            }

            console.log('Tentando login com:', formData); // Debug

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

            <div className="flex flex-1">
                <aside className="hidden md:flex md:w-1/2">
                    <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-158 object-cover" />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background">
                    <img src="src/assets/LogoVertical.png" alt="Logo do Óleo Circular" className="h-30 md:h-36 w-auto m-12" />
                    
                    <form onSubmit={handleLogin} className="w-full max-w-sm">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">DADOS DE ACESSO</p>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm mb-4">
                            {/* Input nativo para teste */}
                            <div className="px-4 py-3">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Seu e-mail"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full outline-none bg-transparent"
                                    disabled={loading}
                                />
                            </div>
                            <hr className="border-white-100 mx-full" />
                            <div className="px-4 py-3">
                                <input
                                    type="password"
                                    name="senha"
                                    placeholder="Sua senha"
                                    value={formData.senha}
                                    onChange={handleInputChange}
                                    className="w-full outline-none bg-transparent"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mb-6">
                            <button 
                                type="button"
                                className="text-green-primary text-sm font-medium" 
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
                                className="text-green-primary font-bold" 
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