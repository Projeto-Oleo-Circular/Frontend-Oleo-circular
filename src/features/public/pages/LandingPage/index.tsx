import { useNavigate } from "react-router-dom";

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white shadow-sm h-16 sm:h-20 flex-shrink-0">
                <img 
                    src="/assets/logo-horizontal.svg" 
                    alt="Logotipo do Óleo Circular" 
                    className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer" 
                    onClick={() => navigate("/")}
                />
                <div className="flex gap-2 sm:gap-3 md:gap-4">
                    <button 
                        className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 border-2 border-green-primary rounded-md text-green-primary font-bold text-xs sm:text-sm hover:bg-green-100 transition-all duration-200" 
                        onClick={() => navigate("/Login")}
                    >
                        Entrar
                    </button>
                    <button 
                        className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md bg-green-primary text-white-primary font-bold text-xs sm:text-sm hover:bg-green-hover transition-all duration-200" 
                        onClick={() => navigate("/Register")}
                    >
                        Criar Conta
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
                <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                    <img 
                        src="/assets/icons/ICON-DESENVOLVIMENTO.svg" 
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

export default LandingPage;