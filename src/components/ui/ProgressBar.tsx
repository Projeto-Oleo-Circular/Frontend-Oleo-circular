interface Props {
    step: number
    totalSteps: number
}

function ProgressBar({ step, totalSteps }: Props) {
    const progressPercent = totalSteps > 0 ? (step / totalSteps) * 100 : 0

    return (
        <div className="w-full mb-5">
            <div className="relative w-full bg-white-200 rounded-full h-2">
                <div className="bg-green-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}
            />
        </div>
        <p className="text-xs text-black-100 mt-1 text-center">Passo {step} {totalSteps > 0 && ` de ${totalSteps}`}</p>
    </div>
  )
}

export default ProgressBar;