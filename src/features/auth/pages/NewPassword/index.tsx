import HeaderPublic from '../../../../components/layout/HeaderPublic';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useToast from '../../../../hooks/useToast';
import { ChangeEvent, useState, FormEvent } from 'react';
import { authService } from '../../../../services/authService';

function NewPassword() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    
    // Captura o token enviado na URL (ex: https://typper.shop/redefinir-senha?token=879011...)
    const token = searchParams.get('token') || '';

    const [formData, setFormData] = useState({
        novaSenha: '',
        confirmarSenha: '',
    });
    
    const [fieldErrors, setFieldErrors] = useState({
        novaSenha: '',
        confirmarSenha: '',
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        let hasError = false;
        const errors = { novaSenha: '', confirmarSenha: '' };

        if (!token) {
            addToast('Token de redefinição ausente na URL.', 'error');
            return false;
        }

        if (!formData.novaSenha) {
            errors.novaSenha = 'A nova senha é obrigatória';
            hasError = true;
        } else if (formData.novaSenha.length < 6) {
            errors.novaSenha = 'A senha deve ter pelo menos 6 caracteres';
            hasError = true;
        }

        if (!formData.confirmarSenha) {
            errors.confirmarSenha = 'Confirme sua nova senha';
            hasError = true;
        } else if (formData.novaSenha !== formData.confirmarSenha) {
            errors.confirmarSenha = 'As senhas não coincidem';
            hasError = true;
        }

        setFieldErrors(errors);
        return !hasError;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Envia o corpo exato exigido pela API
            await authService.resetPassword({
                token,
                novaSenha: formData.novaSenha,
                confirmarSenha: formData.confirmarSenha,
            });

            addToast('Senha redefinida com sucesso!', 'success');

            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (err: any) {
            console.error('Erro ao redefinir senha:', err);
            const mensagem = err.response?.data?.message || 'Token inválido, expirado ou dados incorretos.';
            addToast(mensagem, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderPublic />

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex md:w-1/2 relative">
                    <img 
                        src="/assets/Parque-ecologico.jpeg" 
                        alt="Projeto Óleo Circular" 
                        className="w-full h-full object-cover object-center" 
                    />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto relative">
                    <div className="flex flex-col items-center w-full max-w-sm mt-8 sm:mt-10 md:mt-12 mb-4">
                        <img 
                            src="/assets/LogoVertical.png" 
                            alt="Logo do Óleo Circular" 
                            className="h-24 sm:h-28 md:h-32 w-auto" 
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-sm">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest mb-2">NOVA SENHA</p>
                        <label className="block text-sm font-medium text-white-400 mb-4">
                            Digite sua nova senha
                        </label>

                        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                            <Input 
                                type="password" 
                                name="novaSenha"
                                icon="cadeado" 
                                placeholder="Sua nova senha" 
                                value={formData.novaSenha}
                                onChange={handleInputChange}
                                error={fieldErrors.novaSenha}
                                disabled={loading}
                                noBorder 
                            />
                            <hr className="border-white-100" />
                            <Input 
                                type="password" 
                                name="confirmarSenha"
                                icon="cadeado" 
                                placeholder="Confirme sua nova senha" 
                                value={formData.confirmarSenha}
                                onChange={handleInputChange}
                                error={fieldErrors.confirmarSenha}
                                disabled={loading}
                                noBorder 
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={loading}
                                className="cursor-pointer"
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </Button>

                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={() => navigate("/Forgot-Password")}
                                disabled={loading}
                                className="cursor-pointer"
                            >
                                Voltar
                            </Button>
                        </div>
                    </form>

                    <p className="mt-auto py-6 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    );
}

export default NewPassword;