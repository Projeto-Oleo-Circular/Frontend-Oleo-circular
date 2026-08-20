import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderCadastro title="Política de Privacidade" onBack={() => navigate(-1)} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-between">
        <div className="space-y-6 text-black-200">
          <div>
            <h1 className="text-xl font-bold text-black-primary mb-2">
              Privacidade e Seus Dados
            </h1>
            <p className="text-sm text-black-200 leading-relaxed">
              No <strong className="text-green-primary font-bold">Óleo Circular</strong>, a sua privacidade é uma prioridade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.
            </p>
          </div>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary">
              1. Coleta de Informações
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              Coletamos os dados necessários para o funcionamento do app, como seu nome, e-mail e as informações dos pontos de coleta que você cadastrar (endereço e volume estimado de óleo).
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary">
              2. Uso dos Dados
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              Utilizamos suas informações para conectar seu estabelecimento a parceiros mecoleteiros, melhorar a experiência do usuário no aplicativo e enviar atualizações relevantes sobre a coleta.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-base font-bold text-black-primary ">
              3. Compartilhamento
            </h2>
            <p className="text-sm text-black-200 leading-relaxed">
              As informações dos seus pontos de coleta são públicas no mapa do aplicativo. Seus dados de contato só serão exibidos se você optar por fornecê-los ao criar o ponto de coleta. Não vendemos seus dados para terceiros.
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

export default Privacy;