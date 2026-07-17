
interface ComunicacaoIns {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function ComunicacaoIns({ onNext, onBack, step, totalSteps }: ComunicacaoIns) {
    return <h1>sobre</h1>;
}

export default ComunicacaoIns;