import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";

const partners = [
  "Prefeitura de BH",
  "SEMAD-MG",
  "UFMG",
  "Sindirepa",
  "Cooperativa Verde",
  "FIEMG",
  "IF BAIANO",
];

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderCadastro title="Sobre" onBack={() => navigate(-1)} />

      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-6 space-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src="/assets/logo-horizontal.svg"
            alt="Óleo Circular"
            className="h-20 w-auto mb-2"
          />
          <p className="text-xs text-black-200 font-medium mb-4">
            Plataforma de Coleta Solidária
          </p>
          <h2 className="text-lg font-bold text-green-primary">
            Versão 1.0.4
          </h2>
          <p className="text-sm font-semibold text-black-200 mt-4 leading-relaxed max-w-md">
            O <strong className="text-green-primary font-bold">Óleo Circular</strong> conecta estabelecimentos que geram óleo vegetal usado a mecoleteiros e recicladores, promovendo uma cadeia produtiva mais limpa e sustentável em Belo Horizonte e região.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white-500 tracking-wider uppercase mb-4">
            COMO FUNCIONA
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            
            <div className="bg-white rounded-2xl p-4 shadow-card2 border border-white-100 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <img src="/assets/icons/ponto-de-coleta.svg" alt="Cadastre" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-black-primary text-sm mb-1">Cadastre</h4>
              <p className="text-xs text-black-200 leading-snug">
                Registre seu estabelecimento como ponto de coleta.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-card2 border border-white-100 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <img src="/assets/icons/icon-caminhao.svg" alt="Coletamos" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-black-primary text-sm mb-1">Coletamos</h4>
              <p className="text-xs text-black-200 leading-snug">
                Parceiros recolhem o óleo no local agendado.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-card2 border border-white-100  flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <img src="/assets/icons/recycle.svg" alt="Reciclamos" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-black-primary text-sm mb-1">Reciclamos</h4>
              <p className="text-xs text-black-200 leading-snug">
                O óleo é transformado em biodiesel e sabão.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-card2 border border-white-100 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <img src="/assets/icons/icon-planta.svg" alt="Impactamos" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-black-primary text-sm mb-1">Impactamos</h4>
              <p className="text-xs text-black-200 leading-snug">
                Juntos geramos um planeta mais limpo e saudável.
              </p>
            </div>

          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white-500 tracking-wider uppercase mb-4">
            IMPACTO AMBIENTAL
          </h3>
          <div className="bg-green-100 rounded-2xl p-6 border border-white-100 text-center shadow-card2">
            <div className="grid grid-cols-2 gap-4 divide-x divide-green-200">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-black-primary">1L</span>
                <span className="text-xs text-black-200 mt-1">de óleo possui até</span>
                <span className="text-xl font-bold text-red-hover mt-1">1.000 L</span>
                <span className="text-xs text-black-200">de água</span>
              </div>
              <div className="flex flex-col items-center pl-4">
                <span className="text-3xl font-extrabold text-black-primary">100%</span>
                <span className="text-xs text-black-200 mt-1">pode ser transformado em</span>
                <span className="text-xl font-bold text-green-primary mt-1">Biodiesel</span>
                <span className="text-xs text-black-200">e sabão</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white-500 tracking-wider uppercase mb-4">
            PARCEIROS & APOIO
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {partners.map((partner) => (
              <span
                key={partner}
                className="px-4 py-2 bg-yellow-300 text-black-primary font-bold text-xs rounded-2xl"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-white-500">
            Saiba mais em{" "}
            <a
              href="https://oleocircular.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-primary font-bold hover:underline"
            >
              oleocircular.com.br
            </a>
          </p>
        </div>

        <footer className="text-center text-xs text-black-100">
          © 2026 HS Tecnologia. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
};

export default About;