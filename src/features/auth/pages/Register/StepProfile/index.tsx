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
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title:  'Institucionais',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 6,
    tags: [
      { label: 'Cozinha Industrial', icon: 'icon-CozinhaIndustrial.svg' },
      { label: 'Empresa / Indústria', icon: 'icon-empresa.svg' },
      { label: 'Escolas / Universidade', icon: 'icon-universidade.svg' },
      { label: 'Hospital / Unidade de Saúde', icon: 'icon-hospital.svg' },
      { label: 'Hotel / Pousada', icon: 'icon-hotel.svg' },
      { label: 'Restaurante / Bar', icon: 'icon-restaurante.svg' },
    ],
  },
  {
    id: 'comunitario',
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Comunitários',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 5,
    tags: [
      { label: 'Condomínio', icon: 'icon-condominio.svg' },
      { label: 'Unidade de Saúde', icon: 'icon-unidadeSaude.svg' },
      { label: 'Feira Livre', icon: 'icon-feira.svg' },
      { label: 'Evento Fechado', icon: 'icon-evento.svg' },
    ],
  },
  {
    id: 'solidario',
    icon:  'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Solidários',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 5,
    tags: [
      { label: 'Pessoa Física', icon: 'icon-profileFisica.svg' },
      { label: 'Doador Avulso', icon: 'icon-doadorAvulso.svg' },
      { label: 'Outros', icon: 'icon-outros.svg' },
    ],
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
                      className={`w-full text-left rounded-md border-2 p-4 transition-all duration-200 bg-green-100 shadow-card ${
                        selected === profile.id
                          ? 'border-2 border-green-primary'
                          : 'border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img src={`src/assets/icons/${profile.icon}`} alt="" className="w-5 h-5" />
                        <p className="font-bold text-base">
                          <span className="text-black-primary">{profile.label}</span>
                          <span className="text-green-primary">{profile.title}</span>
                        </p>
                      </div>

                      <p className="text-xs text-black-100 mb-3">{profile.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {profile.tags.map(tag => (
                          <span
                            key={tag.label}
                            className="flex item-center gap-1 text-xs bg-[rgba(156,163,175,0.3)]  text-black-200 px-2 py-1 rounded-md border border-white-200"
                          >
                            <img src={`src/assets/icons/${tag.icon}`} alt="" className="w-3 h-3"/>
                            {tag.label}
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
                        : 'bg-white-300 text-black-200 cursor-not-allowed'
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