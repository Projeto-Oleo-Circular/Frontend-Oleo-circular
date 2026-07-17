
interface InfoIns {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function InfoIns({ onNext, onBack, step, totalSteps }: InfoIns) {
    return <h1>sobre</h1>;
}

export default InfoIns;