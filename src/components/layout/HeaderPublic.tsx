import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, UserCheck } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderPublicProps {
    loading?: boolean;
}

function HeaderPublic({ loading = false }: HeaderPublicProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isAdminArea = location.pathname.startsWith('/admin');

    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-white-100 shadow-xs h-20 z-10">
            {/* Logo */}
            <img
                src="/assets/logo-horizontal.svg"
                alt="Logotipo do Óleo Circular"
                className="h-10 md:h-12 w-auto cursor-pointer"
                onClick={() => navigate('/')}
            />

            {/* Ações */}
            <div className="flex items-center gap-3 md:gap-4">

                {isAdminArea ? (
    <button
        type="button"
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-green-primary text-green-primary text-xs font-bold hover:bg-green-100 transition-colors cursor-pointer"
    >
        <UserCheck className="w-4 h-4 shrink-0" />
        <span>Ir para Área do Parceiro</span>
    </button>
) : (
    <button
        type="button"
        onClick={() => navigate('/admin/login')}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-orange-primary text-orange-primary text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer"
    >
        <Shield className="w-4 h-4 shrink-0" />
        <span>Ir para Área Administrativa</span>
    </button>
)}

                {/* Criar conta */}
                {!isAdminArea && (
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
                )}
            </div>
        </header>
    );
}

export default HeaderPublic;