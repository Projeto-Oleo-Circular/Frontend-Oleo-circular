import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';


interface HeaderPublicProps {
    loading?: boolean
}

function HeaderPublic({ loading = false }: HeaderPublicProps) {
    const navigate = useNavigate();

    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-white-100 shadow-xs h-20 z-10">
            <img src="/src/assets/logo-horizontal.svg" alt="Logotipo do Óleo Circular" className="h-10 md:h-12 w-auto cursor-pointer" onClick={() => navigate('/')} />
            <div className="flex gap-3 md:gap-4">
                <Button 
                    type="button"
                    onClick={() => navigate("/Login")}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    className="px-4 md:px-6">
                    Entrar
                </Button>
                <Button 
                    type="button"
                    onClick={() => navigate("/Register")}
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    className="px-4 md:px-6">
                    Criar Conta
                </Button>
            </div>
        </header>
    )
}

export default HeaderPublic;