
interface AboutProjectCt {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function AboutProjectCt({ onNext, onBack, step, totalSteps }: AboutProjectCt) {
    return <h1>sobre</h1>;
}

export default AboutProjectCt;