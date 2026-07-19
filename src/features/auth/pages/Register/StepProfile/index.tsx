import { useState } from 'react';
import HeaderCadastro from '../../../../../components/layout/HeaderCadastro';
import ProgressBar from '../../../../../components/ui/ProgressBar';

interface Props {
  onSelectProfile: (profile: string) => void
  onBack: () => void
  step: number
  userName?: string
}
const profiles = [
  {
    id: 'institucional',
    title: 'Parceiros Institucionais',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 6,
    tags: ['Cozinha Industrial', 'Empresa / Indústria', 'Escolas / Universidade', 'Hospital / Unidade de Saúde', 'Hotel / Pousada', 'Restaurante / Bar'],
  },
  {
    id: 'comunitario',
    title: 'Parceiros Comunitários',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 5,
    tags: ['Condomínio', 'Unidade de Saúde', 'Feira Livre', 'Evento Fechado'],
  },
  {
    id: 'solidario',
    title: 'Parceiros Solidários',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 5,
    tags: ['Pessoa Física', 'Doador Avulso', 'Outros'],
  },
]

function StepProfile({ onSelectProfile, onBack, step, userName = 'Milena' }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const totalSteps = selected ? profiles.find(p => p.id === selected) ?.totalSteps || 5 : 0;

  const handleSelectProfile = (profileId: string) => {
    setSelected(profileId)
  }
  
  const handleContinue = () => {
    if(selected) {
      onSelectProfile(selected)
    }
  }

    return (
        <div className="flex flex-col h-screen bg-background">
            <HeaderCadastro title="Criar Conta" onBack={onBack} />

            <main className="flex flex-col flex-1 px-5 pb-8 overflow-y-auto">
                <div className="pt-6 pb-3">
                  <h1 className="text-xl md:text-2xl font-bold text-green-primary">Bem-vindo(a), {userName}!</h1>
                  <p className="text-sm md:text-base font-medium text-white-500">
                    Para começar, selecione o seu perfil de doador
                  </p>
                </div>

                <ProgressBar step={step} totalSteps={totalSteps} />

                <div className="flex flex-col gap-4 mb-8">
                  {profiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile.id)}
                      className={`w-full text-left rounded-md border-2 p-4 transition-all duration-200 ${
                        selected === profile.id
                          ? 'border-green-primary bg-green-100'
                          : 'border-white-100 bg-white'
                      }`}
                    >
                      <p className={`font-bold text-base mb-1 ${
                        selected === profile.id ? 'text-green-primary' : 'text-black-primary'
                      }`}>
                        {profile.title}
                      </p>
                      <p className="text-xs text-black-100 mb-3">{profile.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-white-100 text-black-200 px-2 py-1 rounded-md border border-white-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!selected}
                    onClick={handleContinue}
                    className={`w-full font-bold py-3 rounded-xl transition-all duration-200 ${
                      selected
                        ? 'bg-green-primary text-white-primary hover:bg-green-hover'
                        : 'bg-white-300 text-white-400 cursor-not-allowed'
                    }`}
                  >
                    Avançar
                  </button>

                    <p className="text-center text-xs text-black-100 mt-6">
                        © 2026 HS Tecnologia. Todos os direitos reservados.
                    </p>
                </main>
            </div>
    )
}

export default StepProfile;