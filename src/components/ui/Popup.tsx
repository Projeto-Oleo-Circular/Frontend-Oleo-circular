import { useNavigate } from 'react-router-dom';

interface PopupProps {
    isOpen: boolean;
    onClose?: () => void;
}

function Popup({ isOpen, onClose }: PopupProps) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-center text-gray-800 mb-3">
                    Cadastro Enviado! ✅
                </h3>
                
                <p className="text-center text-gray-600 mb-2">
                    Seu cadastro foi enviado para a central de análise.
                </p>
                
                <p className="text-center text-green-600 font-semibold mb-4">
                    Você receberá um e-mail com as instruções de acesso.
                </p>

                <button 
                    onClick={() => navigate('/Login')}
                    className="w-full bg-green-primary text-white font-bold py-3 rounded-xl hover:bg-green-hover transition-all duration-200"
                >
                    Ir para o Login
                </button>
            </div>
        </div>
    );
}

export default Popup;