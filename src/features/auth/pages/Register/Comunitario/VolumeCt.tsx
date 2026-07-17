
interface VolumeCt {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function VolumeCt({ onNext, onBack, step, totalSteps }: VolumeCt) {
    return <h1>sobre</h1>;
}

export default VolumeCt;