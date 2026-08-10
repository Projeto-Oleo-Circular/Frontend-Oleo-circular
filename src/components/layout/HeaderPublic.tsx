import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

interface HeaderPublicProps {
    loading?: boolean;
}

function HeaderPublic({ loading = false }: HeaderPublicProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isLandingPage = location.pathname === '/';
    const isAdminArea = location.pathname.startsWith('/admin');

    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-white-100 shadow-xs h-20 z-10">
            <img
                src="/assets/logo-horizontal.svg"
                alt="Logotipo do Óleo Circular"
                className="h-10 md:h-12 w-auto cursor-pointer"
                onClick={() => navigate('/')}
            />

            <div className="flex items-center gap-3 md:gap-4">
                {isLandingPage ? (
                    <>
                        <Button
                            type="button"
                            onClick={() => navigate('/login')}
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            disabled={loading}
                        >
                            Entrar
                        </Button>

                        <Button
                            type="button"
                            onClick={() => navigate('/Register')}
                            variant="primary"
                            size="sm"
                            fullWidth={false}
                            className="px-4 md:px-6"
                            disabled={loading}
                        >
                            Criar Conta
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Se estiver no Admin, exibe apenas a opção para ir para o Parceiro */}
                        {isAdminArea ? (
                            <Button
                                type="button"
                                onClick={() => navigate('/login')}
                                variant="outline"
                                size="sm"
                                fullWidth={false}
                                disabled={loading}
                            >
                                Área do Parceiro
                            </Button>
                        ) : (
                            /* Se estiver no Parceiro, exibe apenas a opção para ir para o Admin */
                            <Button
                                type="button"
                                onClick={() => navigate('/admin/login')}
                                variant="terciary"
                                size="sm"
                                fullWidth={false}
                                disabled={loading}
                            >
                                Área Administrativa
                            </Button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}

export default HeaderPublic;