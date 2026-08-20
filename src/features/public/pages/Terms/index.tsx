import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderCadastro title="Termos de Uso" onBack={() => navigate(-1)} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-between">
        <div className="space-y-6 text-black-200">
          <div>
            <h1 className="text-xl font-bold text-black-primary mb-2">
              Termos e Condições
            </h1>
            <p className="text-sm text-black-200 leading-relaxed">
              Bem-vindo ao <strong className="text-green-primary font-bold">Óleo Circular</strong>. Ao utilizar nosso aplicativo, você concorda com os seguintes termos e condições de uso.
            </p>
          </div>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary">
              1. Aceitação
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              Ao acessar e utilizar o aplicativo, você concorda em cumprir e se sujeitar a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar o aplicativo.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary">
              2. Uso do Serviço
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              O aplicativo tem como objetivo mapear pontos de coleta de óleo vegetal e conectar geradores a recicladores. O usuário se compromete a fornecer informações verdadeiras e exatas ao cadastrar um ponto de coleta.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary">
              3. Responsabilidades
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              A equipe do <strong className="text-green-primary font-bold">Óleo Circular</strong> não se responsabiliza por eventuais conflitos entre as partes que realizam a coleta. Nosso papel é apenas conectar e mapear os pontos de forma digital.
            </p>
          </section>
        </div>

        <footer className="mt-12 text-center text-xs text-black-100">
          © 2026 HS Tecnologia. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
};

export default Terms;