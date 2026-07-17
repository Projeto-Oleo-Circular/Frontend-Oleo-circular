
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";

function StepProfile({ onSelectProfile, onBack }: {
  onSelectProfile: (profile: string) => void
  onBack: () => void
}) {

    return (
      <div className="flex flex-col h-screen">
         <HeaderCadastro title="Criar Conta" onBack={onBack}
            />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex md:w-1/2">
            <img src="src/assets/Parque-ecologico.jpeg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
          </aside>

          <h1>Bem-vindo(a), Milena!</h1>
          <h2>Para começar, identique o seu perfil de doador</h2>
        </div>
      </div>
    )
  }

export default StepProfile;