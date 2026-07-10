import { useNavigate } from "react-router-dom";

function LandingPage() {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate ("/Register");
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white shadow-sm h-20">
                <img src="/src/assets/logo-OleoCircular.png" alt="Logotipo do Óoleo Circular" className="h-10 md:h-12 w-auto" />
                <div className="flex gap-3 md:gap-4">
                    <button className="px-4 md:px-6 py-2 border-2 border-green-primary rounded-md text-green-primary font-bold text-sm hover:bg-green-100 transition-all duration-200" onClick={() => navigate("/Login")}>
                        Entrar
                    </button>
                    <button className="px-4 md:px-6 py-2 rounded-md bg-green-primary text-white-primary font-bold text-sm hover:bg-green-hover transition-all duration-200" onClick={() => navigate("/Register")}>
                        Criar Conta
                    </button>
                </div>
            </header>
        </div>
    )
}

export default LandingPage;