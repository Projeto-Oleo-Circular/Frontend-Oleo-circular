import { useState } from 'react';
import Popup from '../../../../../components/ui/Popup';

interface FeedbackProps {
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function FeedbackIns({ onBack, step, totalSteps }: FeedbackProps) {
    const [showPopup, setShowPopup] = useState(false);

    const handleFinish = () => {
        // Enviar dados para a central...
        setShowPopup(true);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-center mb-6">
                    Passo {step} de {totalSteps}
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Revise suas informações e finalize o cadastro.
                </p>
                
                <div className="flex justify-between gap-4">
                    <button 
                        onClick={onBack}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleFinish}
                        className="flex-1 bg-green-primary text-white font-bold py-3 rounded-xl hover:bg-green-hover"
                    >
                        Finalizar Cadastro
                    </button>
                </div>
            </div>

            <Popup isOpen={showPopup} />
        </div>
    );
}

export default FeedbackIns;