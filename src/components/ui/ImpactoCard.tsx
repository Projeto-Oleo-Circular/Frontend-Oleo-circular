import { useCallback, useEffect, useState } from "react";

import {
  Droplet,
  Fuel,
  FlaskConical,
  Cloud,
  Recycle,
  Zap,
} from "lucide-react";

import {
  impactoAmbientalService,
  type ImpactoAmbientalPonto,
} from "../../services/impactoAmbientalService";

interface ImpactoCardProps {
  pontoId: number;
  nomePonto?: string;
}

function ImpactoCard({
  pontoId,
  nomePonto,
}: ImpactoCardProps) {
  const [dados, setDados] =
    useState<ImpactoAmbientalPonto | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarImpacto = useCallback(async () => {
    if (!pontoId) return;

    try {
      setLoading(true);
      setErro(null);

      const resultado =
        await impactoAmbientalService.getMeuPonto(pontoId);

      setDados(resultado);
    } catch (error) {
      console.error(
        "Erro ao carregar impacto do ponto:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o impacto."
      );

      setDados(null);
    } finally {
      setLoading(false);
    }
  }, [pontoId]);

  useEffect(() => {
    carregarImpacto();
  }, [carregarImpacto]);

  const formatarNumero = (
    valor: number,
    casas = 2
  ) => {
    return valor.toLocaleString("pt-BR", {
      maximumFractionDigits: casas,
    });
  };

  if (loading) {
    return (
      <div className="bg-white-primary rounded-2xl shadow-card p-5 h-full">
        <div className="animate-pulse">
          <div className="h-5 bg-white-200 rounded w-40 mb-4" />

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-14 bg-white-100 rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-white-primary rounded-2xl shadow-card p-5 h-full">
        <h2 className="text-lg font-bold text-green-primary">
          Impacto Ambiental
        </h2>

        <p className="text-sm text-red-primary mt-3">
          {erro}
        </p>

        <button
          type="button"
          onClick={carregarImpacto}
          className="text-xs text-green-primary font-semibold underline mt-2"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="bg-white-primary rounded-2xl shadow-card p-5 h-full">
        <h2 className="text-lg font-bold text-green-primary">
          Impacto Ambiental
        </h2>

        <p className="text-sm text-white-500 mt-2">
          Nenhum dado ambiental disponível para este ponto.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white-primary rounded-2xl shadow-card p-5 h-full">

      {/* CABEÇALHO */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-green-primary">
          Impacto Ambiental
        </h2>

        <p className="text-xs text-white-500 mt-0.5">
          {nomePonto ||
            dados.nomePontoColeta ||
            `Ponto #${pontoId}`}
        </p>
      </div>

      {/* INDICADORES */}
      <div className="grid grid-cols-2 gap-3">

        {/* ÓLEO COLETADO */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
            <Droplet className="w-4 h-4 text-green-primary" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              Óleo coletado
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.volumeTotalColetado
              )}{" "}
              L
            </p>
          </div>
        </div>

        {/* BIODIESEL */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
            <Fuel className="w-4 h-4 text-yellow-700" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              Biodiesel estimado
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.biodieselEstimadoLitros
              )}{" "}
              L
            </p>
          </div>
        </div>

        {/* DIESEL EQUIVALENTE */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-blue-700" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              Diesel equivalente
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.dieselEquivalenteLitros
              )}{" "}
              L
            </p>
          </div>
        </div>

        {/* ENERGIA */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-orange-600" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              Energia gerada
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.energiaBiodieselMj
              )}{" "}
              MJ
            </p>
          </div>
        </div>

        {/* CO2 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-white-100 flex items-center justify-center">
            <Cloud className="w-4 h-4 text-white-700" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              CO₂ evitado
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.co2EvitadoKg
              )}{" "}
              kg
            </p>
          </div>
        </div>

        {/* RESÍDUO */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
            <Recycle className="w-4 h-4 text-purple-700" />
          </div>

          <div>
            <p className="text-[11px] text-white-500">
              Resíduo desviado
            </p>

            <p className="font-bold text-green-primary text-sm">
              {formatarNumero(
                dados.residuoDesviadoKg
              )}{" "}
              kg
            </p>
          </div>
        </div>

      </div>

      {/* RODAPÉ */}
      <div className="mt-4 pt-3 border-t border-white-100 flex items-center justify-between">
        <span className="text-lg text-green-500">
          Coletas concluídas
        </span>

        <span className="text-lg font-bold text-green-primary">
          {dados.totalColetas}
        </span>
      </div>

    </div>
  );
}

export default ImpactoCard;