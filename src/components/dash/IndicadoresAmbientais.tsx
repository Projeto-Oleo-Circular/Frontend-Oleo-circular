import { useEffect, useState, useCallback } from "react";

import {
  Droplet,
  FlaskConical,
  Fuel,
  Cloud,
  Recycle,
} from "lucide-react";

import {
  impactoAmbientalService,
  ImpactoAmbientalBase,
} from "../../services/impactoAmbientalService";

// ======================================================
// TIPOS DE VISUALIZAÇÃO
// ======================================================

type TipoImpacto =
  | "admin-geral"
  | "admin-parceiro"
  | "admin-ponto"
  | "parceiro-geral"
  | "parceiro-ponto";

type VarianteIndicadores = "dashboard" | "modal";

interface IndicadoresAmbientaisProps {
  tipo: TipoImpacto;

  parceiroId?: number;
  pontoId?: number;

  titulo?: string;

  variant?: VarianteIndicadores;
}

// ======================================================
// COMPONENTE
// ======================================================

export function IndicadoresAmbientais({
  tipo,
  parceiroId,
  pontoId,
  titulo = "Impacto Gerado",
  variant = "dashboard",
}: IndicadoresAmbientaisProps) {
  const [dados, setDados] =
    useState<ImpactoAmbientalBase | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  // ======================================================
  // BUSCAR IMPACTO
  // ======================================================

  const fetchImpacto = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      let resultado: ImpactoAmbientalBase;

      switch (tipo) {

        // ==============================================
        // ADMIN - GERAL
        // ==============================================

        case "admin-geral":
          resultado =
            await impactoAmbientalService.getGeralAdmin();

          break;

        // ==============================================
        // ADMIN - PARCEIRO
        // ==============================================

        case "admin-parceiro":
          if (!parceiroId) {
            throw new Error(
              "ID do parceiro não informado"
            );
          }

          resultado =
            await impactoAmbientalService.getParceiroAdmin(
              parceiroId
            );

          break;

        // ==============================================
        // ADMIN - PONTO
        // ==============================================

        case "admin-ponto":
          if (!pontoId) {
            throw new Error(
              "ID do ponto não informado"
            );
          }

          resultado =
            await impactoAmbientalService.getPontoAdmin(
              pontoId
            );

          break;

        // ==============================================
        // PARCEIRO - GERAL
        // ==============================================

        case "parceiro-geral":
          resultado =
            await impactoAmbientalService.getMeuImpacto();

          break;

        // ==============================================
        // PARCEIRO - PONTO
        // ==============================================

        case "parceiro-ponto":
          if (!pontoId) {
            throw new Error(
              "ID do ponto não informado"
            );
          }

          resultado =
            await impactoAmbientalService.getMeuPonto(
              pontoId
            );

          break;

        default:
          throw new Error(
            "Tipo de impacto inválido"
          );
      }

      setDados(resultado);

    } catch (error) {
      console.error(
        "Erro ao carregar impacto ambiental:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar impacto ambiental"
      );

    } finally {
      setLoading(false);
    }

  }, [tipo, parceiroId, pontoId]);

  // ======================================================
  // CARREGAR
  // ======================================================

  useEffect(() => {
    fetchImpacto();
  }, [fetchImpacto]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-white-200 p-6 text-center">

        <div className="
          w-8
          h-8
          border-4
          border-green-primary
          border-t-transparent
          rounded-full
          animate-spin
          mx-auto
          mb-2
        " />

        <p className="text-white-500 text-sm">
          Carregando impacto gerado...
        </p>

      </div>
    );
  }

  // ======================================================
  // ERRO
  // ======================================================

  if (erro) {
    return (
      <div className="
        bg-red-50
        rounded-xl
        p-4
        text-center
        text-red-600
        text-sm
        border
        border-red-200
      ">

        {erro}

        <button
          onClick={fetchImpacto}
          className="
            ml-2
            text-green-primary
            underline
            font-medium
            hover:text-green-700
          "
        >
          Tentar novamente
        </button>

      </div>
    );
  }

  // ======================================================
  // SEM DADOS
  // ======================================================

  if (!dados) {
    return (
      <div className="
        bg-white
        rounded-xl
        shadow-sm
        border
        border-white-200
        p-6
        text-center
        text-white-500
      ">
        Nenhum dado disponível.
      </div>
    );
  }

  // ======================================================
  // VERIFICA SE EXISTE IMPACTO
  // ======================================================

  const temDados =
    dados.volumeTotalColetado > 0 ||
    dados.biodieselEstimadoLitros > 0 ||
    dados.co2EvitadoKg > 0 ||
    dados.residuoDesviadoKg > 0;

  if (!temDados) {
    return (
      <div className="
        bg-white
        rounded-xl
        shadow-sm
        border
        border-white-200
        p-6
        text-center
        text-white-500
      ">
        Ainda não existem coletas concluídas
        para calcular o impacto ambiental.
      </div>
    );
  }

  // ======================================================
  // CONVERSÕES
  // ======================================================

  // Backend retorna KG.
  // Interface antiga mostrava toneladas.
  const co2Toneladas =
    dados.co2EvitadoKg / 1000;

  const residuoToneladas =
    dados.residuoDesviadoKg / 1000;
const isModal = variant === "modal";
  // ======================================================
  // COMPONENTE
  // ======================================================

return (
  <div
    className={`
      bg-white
      rounded-xl
      border
      border-white-200
      ${
        isModal
          ? "p-3 shadow-none"
          : "p-6 shadow-sm"
      }
    `}
  >
    {/* CABEÇALHO */}
    <div
      className={`
        flex
        items-center
        justify-between
        gap-3
        ${isModal ? "mb-3" : "mb-6"}
      `}
    >
      <h2
        className={`
          font-bold
          text-black-primary
          ${isModal ? "text-sm" : "text-xl"}
        `}
      >
        {titulo}
      </h2>

      <span
        className={`
          text-white-400
          text-right
          ${isModal ? "text-[9px]" : "text-xs"}
        `}
      >
        Calculado pelas coletas concluídas
      </span>
    </div>

    {/* INDICADORES */}
    <div
      className={
        isModal
          ? "grid grid-cols-2 gap-2"
          : "grid grid-cols-5 gap-4"
      }
    >
      {/* OGR COLETADO */}
      <div
        className={`
          flex
          items-center
          bg-white-50
          rounded-lg
          border
          border-white-100
          ${
            isModal
              ? "gap-2 p-2"
              : "flex-col text-center p-3"
          }
        `}
      >
        <div
          className={`
            shrink-0
            rounded-full
            bg-green-100
            flex
            items-center
            justify-center
            ${
              isModal
                ? "w-8 h-8"
                : "w-12 h-12 mb-2"
            }
          `}
        >
          <Droplet
            className={
              isModal
                ? "w-4 h-4 text-green-700"
                : "w-6 h-6 text-green-700"
            }
          />
        </div>

        <div className={isModal ? "min-w-0" : ""}>
          <p
            className={`
              font-bold
              text-black-primary
              ${
                isModal
                  ? "text-sm leading-tight"
                  : "text-xl"
              }
            `}
          >
            {dados.volumeTotalColetado.toLocaleString(
              "pt-BR",
              {
                maximumFractionDigits: 2,
              }
            )}
          </p>

          <p
            className={
              isModal
                ? "text-[10px] text-white-600 leading-tight"
                : "text-xs text-white-600 font-medium"
            }
          >
            OGR coletado (L)
          </p>
        </div>
      </div>

      {/* BIODIESEL */}
      <div
        className={`
          flex
          items-center
          bg-white-50
          rounded-lg
          border
          border-white-100
          ${
            isModal
              ? "gap-2 p-2"
              : "flex-col text-center p-3"
          }
        `}
      >
        <div
          className={`
            shrink-0
            rounded-full
            bg-yellow-100
            flex
            items-center
            justify-center
            ${
              isModal
                ? "w-8 h-8"
                : "w-12 h-12 mb-2"
            }
          `}
        >
          <Fuel
            className={
              isModal
                ? "w-4 h-4 text-yellow-700"
                : "w-6 h-6 text-yellow-700"
            }
          />
        </div>

        <div className={isModal ? "min-w-0" : ""}>
          <p
            className={`
              font-bold
              text-black-primary
              ${
                isModal
                  ? "text-sm leading-tight"
                  : "text-xl"
              }
            `}
          >
            {dados.biodieselEstimadoLitros.toLocaleString(
              "pt-BR",
              {
                maximumFractionDigits: 2,
              }
            )}
          </p>

          <p
            className={
              isModal
                ? "text-[10px] text-white-600 leading-tight"
                : "text-xs text-white-600 font-medium"
            }
          >
            Biodiesel estimado (L)
          </p>
        </div>
      </div>

      {/* DIESEL EQUIVALENTE */}
      <div
        className={`
          flex
          items-center
          bg-white-50
          rounded-lg
          border
          border-white-100
          ${
            isModal
              ? "gap-2 p-2"
              : "flex-col text-center p-3"
          }
        `}
      >
        <div
          className={`
            shrink-0
            rounded-full
            bg-blue-100
            flex
            items-center
            justify-center
            ${
              isModal
                ? "w-8 h-8"
                : "w-12 h-12 mb-2"
            }
          `}
        >
          <FlaskConical
            className={
              isModal
                ? "w-4 h-4 text-blue-700"
                : "w-6 h-6 text-blue-700"
            }
          />
        </div>

        <div className={isModal ? "min-w-0" : ""}>
          <p
            className={`
              font-bold
              text-black-primary
              ${
                isModal
                  ? "text-sm leading-tight"
                  : "text-xl"
              }
            `}
          >
            {dados.dieselEquivalenteLitros.toLocaleString(
              "pt-BR",
              {
                maximumFractionDigits: 2,
              }
            )}
          </p>

          <p
            className={
              isModal
                ? "text-[10px] text-white-600 leading-tight"
                : "text-xs text-white-600 font-medium"
            }
          >
            Diesel equivalente (L)
          </p>
        </div>
      </div>

      {/* CO2 EVITADO */}
      <div
        className={`
          flex
          items-center
          bg-white-50
          rounded-lg
          border
          border-white-100
          ${
            isModal
              ? "gap-2 p-2"
              : "flex-col text-center p-3"
          }
        `}
      >
        <div
          className={`
            shrink-0
            rounded-full
            bg-white-100
            flex
            items-center
            justify-center
            ${
              isModal
                ? "w-8 h-8"
                : "w-12 h-12 mb-2"
            }
          `}
        >
          <Cloud
            className={
              isModal
                ? "w-4 h-4 text-white-700"
                : "w-6 h-6 text-white-700"
            }
          />
        </div>

        <div className={isModal ? "min-w-0" : ""}>
          <p
            className={`
              font-bold
              text-black-primary
              ${
                isModal
                  ? "text-sm leading-tight"
                  : "text-xl"
              }
            `}
          >
            {co2Toneladas.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 3,
            })}
          </p>

          <p
            className={
              isModal
                ? "text-[10px] text-white-600 leading-tight"
                : "text-xs text-white-600 font-medium"
            }
          >
            CO₂ evitado (t)
          </p>
        </div>
      </div>

      {/* RESÍDUO DESVIADO */}
      <div
        className={`
          flex
          items-center
          bg-white-50
          rounded-lg
          border
          border-white-100

          ${
            isModal
              ? "col-span-2 justify-center gap-2 p-2"
              : "flex-col text-center p-3"
          }
        `}
      >
        <div
          className={`
            shrink-0
            rounded-full
            bg-purple-100
            flex
            items-center
            justify-center
            ${
              isModal
                ? "w-8 h-8"
                : "w-12 h-12 mb-2"
            }
          `}
        >
          <Recycle
            className={
              isModal
                ? "w-4 h-4 text-purple-700"
                : "w-6 h-6 text-purple-700"
            }
          />
        </div>

        <div>
          <p
            className={`
              font-bold
              text-black-primary
              ${
                isModal
                  ? "text-sm leading-tight"
                  : "text-xl"
              }
            `}
          >
            {residuoToneladas.toLocaleString(
              "pt-BR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              }
            )}
          </p>

          <p
            className={
              isModal
                ? "text-[10px] text-white-600 leading-tight"
                : "text-xs text-white-600 font-medium"
            }
          >
            Resíduo desviado (t)
          </p>
        </div>
      </div>
    </div>
  </div>
);}