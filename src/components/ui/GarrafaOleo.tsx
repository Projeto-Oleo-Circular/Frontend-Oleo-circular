interface GarrafaOleoProps {
    nivel: number;
    volume: number;
    capacidade: number;
}

function GarrafaOleo({
    nivel,
    volume,
    capacidade,
}: GarrafaOleoProps) {
    const nivelSeguro = Math.min(
        Math.max(nivel, 0),
        100
    );

    const formatarLitros = (valor: number) =>
        valor.toLocaleString("pt-BR", {
            maximumFractionDigits: 2,
        });

    return (
        <div className="flex flex-col items-center">

{/* GARRAFA */}
<div className="pet-bottle">

    {/* TAMPA */}
    <div className="pet-cap" />

    {/* ANEL DA TAMPA */}
    <div className="pet-cap-ring" />

    {/* GARGALO */}
    <div className="pet-neck" />

    {/* CORPO COM CONTORNO ÚNICO */}
    <div className="pet-body">

        {/* ÓLEO */}
        <div
            className="pet-oil"
            style={{
                height: `${nivelSeguro}%`,
            }}
        >
            <div className="pet-oil-wave" />
        </div>

        {/* REFLEXO */}
        <div className="pet-reflection" />

        {/* LINHAS DA PET */}
        <div className="pet-line pet-line-1" />
        <div className="pet-line pet-line-2" />
        <div className="pet-line pet-line-3" />

        {/* RÓTULO */}
        <div className="pet-label">
            <div className="pet-label-decoration" />
            <img 
                src="/assets/logo-horizontal.svg" 
                alt="Óleo Circular" 
                className="pet-logo"
            />
        </div>

        {/* PERCENTUAL */}
        <div className="pet-percentage">
            {nivelSeguro}%
        </div>

    </div>

    {/* BASE */}
    <div className="pet-base" />

</div>

            {/* INFORMAÇÕES */}
            <div className="text-center mt-4">

                <p className="text-sm text-white-500">
                    Volume estimado para coleta
                </p>

                <p className="text-2xl font-bold text-green-primary">
                    {formatarLitros(volume)} L
                </p>

                <p className="text-xs text-white-500 mt-1">
                    de {formatarLitros(capacidade)} L
                </p>

            </div>

        </div>
    );
}

export default GarrafaOleo;