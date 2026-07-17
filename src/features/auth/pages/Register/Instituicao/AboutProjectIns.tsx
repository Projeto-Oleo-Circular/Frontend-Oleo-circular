
interface AboutProjectIns {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function AboutProjectIns({ onNext, onBack, step, totalSteps }: AboutProjectIns) {
    return <h1>sobre</h1>;
}

export default AboutProjectIns;