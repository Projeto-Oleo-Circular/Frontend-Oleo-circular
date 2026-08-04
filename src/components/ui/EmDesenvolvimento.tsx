import { ReactNode } from "react";

interface EmDesenvolvimentoProps {
    title?: string;
    message?: string;
    children?: ReactNode;
}

function EmDesenvolvimento({ 
    title = "Em breve", 
    message = "Esta funcionalidade está em desenvolvimento",
    children 
}: EmDesenvolvimentoProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <img 
                src="/assets/icons/ICON-DESENVOLVIMENTO.svg" 
                alt="Tela em desenvolvimento" 
                className="w-full max-w-xs sm:max-w-sm md:max-w-md h-auto"
            />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-primary mt-4">
                {title}
            </h2>
            <p className="text-white-600 mt-2 text-center max-w-md">
                {message}
            </p>
            {children}
        </div>
    );
}

export default EmDesenvolvimento;