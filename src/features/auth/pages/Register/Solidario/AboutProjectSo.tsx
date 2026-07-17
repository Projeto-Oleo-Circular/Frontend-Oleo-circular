
interface AboutProjectSo {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function AboutProjectSo({ onNext, onBack, step, totalSteps }: AboutProjectSo) {
    return <h1>sobre</h1>;
}

export default AboutProjectSo;