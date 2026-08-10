import HeaderPublic from "../../../../components/layout/HeaderPublic";

function LandingPage() {

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <HeaderPublic />

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