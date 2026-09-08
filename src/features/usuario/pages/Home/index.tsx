import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Button from "../../../../components/ui/Button";
import HeaderApp from "../../../../components/layout/HeaderApp";
import PontosColetaCard from "../../../../components/ui/PontosColetaCard";
import BombonaCard from "../../../../components/ui/BombonaCard";
import ImpactoCard from "../../../../components/ui/ImpactoCard";

import { authService } from "../../../../services/authService";
import {
  pontosColetaService,
  type PontoColeta,
} from "../../../../services/pontosColetaService";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // ======================================================
  // USUÁRIO
  // ======================================================

  const [userName, setUserName] = useState("Usuário");

  // ======================================================
  // PONTOS
  // ======================================================

  const [pontos, setPontos] = useState<PontoColeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingPontos, setLoadingPontos] = useState(true);

  // ======================================================
  // CARREGAR USUÁRIO
  // ======================================================

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const userData = await authService.getUserData();

        if (userData?.razaoSocial || userData?.nome) {
          const nomeCompleto =
            userData.razaoSocial ||
            userData.nome ||
            "Usuário";

          const primeiroNome =
            nomeCompleto.split(" ")[0];

          setUserName(primeiroNome);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar dados do usuário:",
          error
        );
      }
    };

    carregarDadosUsuario();
  }, []);

  // ======================================================
  // CARREGAR PONTOS DO PARCEIRO
  // ======================================================

  useEffect(() => {
    const carregarPontos = async () => {
      try {
        setLoadingPontos(true);

        const data =
          await pontosColetaService.listarMeusPontos();

        setPontos(data);

        // Se voltou da edição de um ponto,
        // mantém esse ponto selecionado.
        const updatedPontoId =
          location.state?.updatedPontoId;

        if (updatedPontoId) {
          const index = data.findIndex(
            (ponto) =>
              Number(ponto.id) ===
              Number(updatedPontoId)
          );

          if (index !== -1) {
            setCurrentIndex(index);
          }
        }
      } catch (error) {
        console.error(
          "Erro ao carregar pontos:",
          error
        );

        setPontos([]);
        setCurrentIndex(0);
      } finally {
        setLoadingPontos(false);
      }
    };

    carregarPontos();
  }, [location.state]);

  // ======================================================
  // PONTO ATUAL
  // ======================================================

  const pontoAtual = pontos[currentIndex];

  // ======================================================
  // NAVEGAÇÃO ENTRE PONTOS
  // ======================================================

  const handleAnterior = () => {
    setCurrentIndex((prev) =>
      Math.max(prev - 1, 0)
    );
  };

  const handleProximo = () => {
    setCurrentIndex((prev) =>
      Math.min(
        prev + 1,
        pontos.length - 1
      )
    );
  };

  // ======================================================
  // SOLICITAR COLETA
  // ======================================================

  const handleSolicitarColeta = () => {
    if (!pontoAtual) return;

    navigate("/report-barrel", {
      state: {
        pontoId: pontoAtual.id,
    },
    });
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-background">

      {/* HEADER */}
      <HeaderApp userName={userName} />

      <main className="flex-1 overflow-y-auto">

        {/* ================================================= */}
        {/* CABEÇALHO VERDE */}
        {/* ================================================= */}

        <div className="bg-green-primary text-white-primary pt-6 pb-20 px-6 sm:px-8 rounded-b-[2rem] sm:rounded-b-[3rem] w-full">

          <div className="flex justify-between items-center max-w-5xl mx-auto">

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white-primary">
                Olá, {userName}!
              </h1>

              <p className="text-sm sm:text-base text-white-primary opacity-90 mt-1">
                Seja bem-vindo(a)!
              </p>
            </div>

          </div>

        </div>

<div className="max-w-5xl mx-auto px-6 sm:px-8 -mt-12 pb-28">

    {/* ================================================= */}
    {/* 1ª LINHA - PONTO DE COLETA */}
    {/* ================================================= */}

    <PontosColetaCard
        pontos={pontos}
        currentIndex={currentIndex}
        onAnterior={handleAnterior}
        onProximo={handleProximo}
        loading={loadingPontos}
    />

    {/* ================================================= */}
    {/* 2ª LINHA - CAPACIDADE DE GERAÇÃO */}
    {/* ================================================= */}

    <div className="mt-4">
        <BombonaCard
            ponto={pontoAtual}
            loading={loadingPontos}
        />
    </div>

    {/* ================================================= */}
    {/* 3ª LINHA - IMPACTO AMBIENTAL */}
    {/* ================================================= */}

    <div className="mt-4">

        {pontoAtual ? (
            <ImpactoCard
                key={pontoAtual.id}
                pontoId={Number(pontoAtual.id)}
                nomePonto={
                    pontoAtual.nomePontoColeta ||
                    pontoAtual.categoria
                }
            />
        ) : !loadingPontos ? (
            <div className="
                bg-white-primary
                rounded-2xl
                shadow-card
                p-5
            ">
                <h2 className="
                    text-lg
                    font-bold
                    text-green-primary
                ">
                    Impacto Ambiental
                </h2>

                <p className="
                    text-sm
                    text-white-500
                    mt-2
                ">
                    Cadastre um ponto de coleta para
                    visualizar os indicadores ambientais.
                </p>
            </div>
        ) : null}

    </div>

    {/* ================================================= */}
    {/* SOLICITAR COLETA */}
    {/* ================================================= */}

    {pontoAtual && (
        <Button
            onClick={handleSolicitarColeta}
            className="w-full mt-4"
        >
            Solicitar coleta
        </Button>
    )}

</div>

      </main>

      {/* ================================================= */}
      {/* BOTÃO FLUTUANTE - NOVO PONTO */}
      {/* ================================================= */}

      <button
        onClick={() =>
          navigate("/register-point")
        }
        className="
          fixed
          bottom-20
          right-6
          sm:bottom-24
          sm:right-10
          w-14
          h-14
          bg-[#31B0A5]
          hover:bg-[#289188]
          text-white
          rounded-full
          flex
          items-center
          justify-center
          shadow-xl
          transition-all
          duration-200
          hover:scale-105
          active:scale-95
          z-50
          cursor-pointer
        "
        aria-label="Adicionar novo ponto de coleta"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

    </div>
  );
}

export default Home;