import HeaderPublic from '../../../../components/layout/HeaderPublic';
import Input from '../../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import useToast from '../../../../hooks/useToast';
import { ChangeEvent, useState } from 'react';
import { authService } from '../../../../services/authService';
import Button from '../../../../components/ui/Button';

function ForgotPassword() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [fieldErrors, setFieldErrors] = useState({ email: '' });
    const [formData, setFormData] = useState({ email: '' });
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
        const errors = { email: '' };

        if (!formData.email) {
            errors.email = 'E-mail é obrigatório';
            hasError = true;
        } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
            errors.email = 'E-mail inválido';
            hasError = true;
        }

        setFieldErrors(errors);
        return !hasError;
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await authService.ForgotPassword(formData.email);

            addToast('E-mail de redefinição enviado com sucesso!', 'success');

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            console.error('Erro ao recuperar senha:', err);

            if (err.response?.status === 404) {
                addToast('E-mail não encontrado. Verifique e tente novamente', 'error');
            } else if (err.response?.data?.message) {
                addToast(err.response.data.message, 'error');
            } else {
                addToast('Erro ao enviar link de recuperação. Tente novamente', 'error');
            }
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
                        src="/assets/Imagem 2.jpg" 
                        alt="Projeto Óleo Circular" 
                        className="w-full h-full object-cover object-center" 
                    />
                </aside>

                <main className="flex flex-col items-center w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
                    <div className="flex flex-col items-center w-full max-w-sm mt-8 sm:mt-10 md:mt-12 mb-4 sm:mb-6">
                        <img 
                            src="/assets/logo-horizontal.svg" 
                            alt="Logo Óleo Circular" 
                            className="h-24 sm:h-28 md:h-32 w-auto" 
                        />
                        <p className="text-xs sm:text-sm text-black-100 font-medium mt-2 text-center px-2">
                            Plataforma de Coleta Solidária
                        </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="w-full max-w-sm">
                        <p className="text-xs font-extrabold text-black-100 tracking-widest mb-3">
                            RECUPERAR SENHA
                        </p>
                        <label className="block text-xs sm:text-sm font-medium text-white-400 mb-3 sm:mb-4">
                            Digite seu e-mail cadastrado para receber o link de recuperação
                        </label>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <Input
                                type="email"
                                name="email"
                                icon="email"
                                placeholder="Seu e-mail"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                                error={fieldErrors.email}
                                noBorder
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-6 sm:mt-8">
                            <Button
                                type="submit"
                                disabled={loading}
                                variant="primary"
                                className="cursor-pointer"
                            >
                                {loading ? 'Enviando...' : 'Enviar'}
                            </Button>

                            <Button
                                type="button"
                                onClick={() => navigate("/login")}
                                variant="secondary"
                                className="cursor-pointer"
                            >
                                Voltar
                            </Button>
                        </div>
                    </form>

                    <p className="mt-auto py-4 text-xs text-black-100">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
        </div>
    );
}

export default ForgotPassword;