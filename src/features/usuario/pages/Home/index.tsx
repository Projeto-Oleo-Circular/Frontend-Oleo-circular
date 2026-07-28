import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/Button";
import { useState } from "react";
import { authService } from "../../../../services/authService";

function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false)

    const handleLogout = () => {
        setLoading(true)
        authService.logout();
        setTimeout(() => {
            setLoading(false)
            navigate("/login")
        }, 500)
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white shadow-sm h-16 sm:h-20 flex-shrink-0">
                <img 
                    src="/src/assets/logo-horizontal.svg" 
                    alt="Logotipo do Óleo Circular" 
                    className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer" 
                    onClick={() => navigate("/")}
                />
                <div className="flex">
                    <Button
                        type="button"
                        onClick={handleLogout}
                        disabled={loading}
                        variant="danger"
                    >
                        {loading ? 'Saindo...' : 'Sair'}
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
                <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                    <img 
                        src="/src/assets/icons/ICON-DESENVOLVIMENTO.svg" 
                        alt="Tela em desenvolvimento" 
                        className="w-full h-auto max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] object-contain mx-auto"
                    />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-primary mt-2 sm:mt-3 md:mt-4">
                        Em breve
                    </h2>
                </div>
            </main>
        </div>
    )
}

export default Home