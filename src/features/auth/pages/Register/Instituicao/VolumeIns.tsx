
interface VolumeIns {
    onNext: () => void;
    onBack: () => void;
    step: number;
    totalSteps: number;
}

function VolumeIns({ onNext, onBack, step, totalSteps }: VolumeIns) {
    return <h1>sobre</h1>;
}

export default VolumeIns;