
interface InfoCt {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function InfoCt({ onNext, onBack, step, totalSteps }: InfoCt) {
    return <h1>sobre</h1>;
}

export default InfoCt;