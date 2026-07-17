
interface VolumeSo {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function VolumeSo({ onNext, onBack, step, totalSteps }: VolumeSo) {
    return <h1>sobre</h1>;
}

export default VolumeSo;