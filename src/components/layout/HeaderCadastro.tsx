
function HeaderCadastro({ title, onBack } : {
    title: String
    onBack: () => void
}) {
    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-white-100 shadow-xs h-20 z-10">
            <button 
                onClick={() => {
                    console.log('🔙 HeaderCadastro: onBack chamado');
                    onBack();
                }} 
                className="text-green-primary font-regular text-base md:text-lg cursor-pointer flex items-center gap-1"
            >
                <img src="/src/assets/icons/arrow.svg" alt="Seta de voltar" className="h-4 w-4" />
                Voltar
            </button>
            <h1 className="text-black-primary font-bold text-lg md:text-xl flex-1 text-center" >
                {title}
            </h1>
        </header>
    )
}

export default HeaderCadastro;