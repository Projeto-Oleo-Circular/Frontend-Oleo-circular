interface ImpactoCardProps {
    oleoDestinadoLitros: number;
    co2EvitadoKg: number;
    periodoLabel: string;
}

function ImpactoCard({ oleoDestinadoLitros, co2EvitadoKg, periodoLabel }: ImpactoCardProps) {
    return (
        <div className="bg-white-primary rounded-2xl shadow-card p-5">
            <h2 className="text-lg font-bold text-green-primary mb-3">Impacto Gerado</h2>

            <div className="flex justify-between">
                <div>
                    <p className="text-sm black-primary">Óleo destinado</p>
                    <p className="font-bold text-green-primary text-lg">{oleoDestinadoLitros} L</p>
                    <p className="text-xs text-black-primary">{periodoLabel}</p>
                </div>

                <div>
                    <p className="text-sm text-black-primary">CO2 evitado</p>
                    <p className="font-bold text-green-primary text-lg">{co2EvitadoKg} kg</p>
                    <p className="text-xs text-black-primary">{periodoLabel}</p>
                </div>
            </div>
        </div>
    );
}

export default ImpactoCard;
