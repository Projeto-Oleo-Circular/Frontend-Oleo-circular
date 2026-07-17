
interface InfoSo {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function InfoSo({ onNext, onBack, step, totalSteps }: InfoSo) {
    return <h1>sobre</h1>;
}

export default InfoSo;