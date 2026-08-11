import { useState } from 'react';
import HeaderCadastro from '../../../../../components/layout/HeaderCadastro';
import ProgressBar from '../../../../../components/ui/ProgressBar';
import Button from '../../../../../components/ui/Button';

interface Props {
  onSelectProfile: (profile: string) => void;
  onBack: () => void;
  step: number;
  userName?: string;
}

const profiles = [
  {
    id: 'institucional',
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Institucionais',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 6,
    tags: [
      { label: 'Cozinha Industrial', icon: 'icon-CozinhaIndustrial.svg' },
      { label: 'Empresa / Indústria', icon: 'icon-empresa.svg' },
      { label: 'Escolas / Universidade', icon: 'icon-universidade.svg' },
      { label: 'Hotel / Pousada', icon: 'icon-hotel.svg' },
      { label: 'Restaurante / Bar', icon: 'icon-restaurante.svg' },
    ],
  },
  {
    id: 'comunitario',
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Comunitários',
    description: 'Locais com geração compartilhada entre várias pessoas.',
    totalSteps: 5,
    tags: [
      { label: 'Condomínio', icon: 'icon-condominio.svg' },
      { label: 'Feira Livre / Eventos', icon: 'icon-feira.svg' },
    ],
  },
  {
    id: 'solidario',
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Solidários',
    description: 'Pessoas e iniciativas que colaboram com pequenas quantidades.',
    totalSteps: 5,
    tags: [
      { label: 'Doador Avulso', icon: 'icon-doadorAvulso.svg' },
    ],
  },
];

function StepProfile({ 
  onSelectProfile, 
  onBack, 
  step, 
  userName = 'Usuário' 
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const selectedProfile = profiles.find(p => p.id === selected);
  const totalSteps = selectedProfile?.totalSteps || 0;

  const handleSelectProfile = (profileId: string) => {
    setSelected(profileId);
    setError('');
  };

  const handleContinue = () => {
    if (selected) {
      onSelectProfile(selected);
    } else {
      setError('Selecione um perfil para continuar');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <HeaderCadastro title="Criar Conta" onBack={onBack} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex md:w-1/2 relative">
          <img 
            src="/assets/Imagem 2.jpg" 
            alt="Projeto Óleo Circular" 
            className="w-full h-full object-cover object-center" 
          />
        </aside>

        <main className="flex flex-col w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
          <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-green-primary">
              Bem-vindo(a), {userName}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-white-500">
              Para começar, selecione o seu perfil de doador
            </p>
          </div>

          <ProgressBar step={step} totalSteps={totalSteps} />

          <div className="flex flex-col gap-3 sm:gap-4 mt-4 mb-6">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className={`w-full text-left rounded-md border-2 p-3 sm:p-4 transition-all duration-200 bg-green-100 shadow-card hover:shadow-md ${
                  selected === profile.id
                    ? 'border-2 border-green-primary ring-2 ring-green-200'
                    : 'border-2 border-transparent hover:border-green-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <img 
                    src={`/assets/icons/${profile.icon}`} 
                    alt={profile.title} 
                    className="w-4 sm:w-5 h-4 sm:h-5" 
                  />
                  <p className="font-bold text-sm sm:text-base">
                    <span className="text-black-primary">{profile.label} </span>
                    <span className="text-green-primary">{profile.title}</span>
                  </p>
                </div>

                <p className="text-xs text-black-100 mb-2 sm:mb-3">{profile.description}</p>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className="flex items-center gap-1 text-[10px] sm:text-xs bg-[rgba(156,163,175,0.3)] text-black-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-white-200"
                    >
                      <img 
                        src={`/assets/icons/${tag.icon}`} 
                        alt={tag.label} 
                        className="w-2 sm:w-3 h-2 sm:h-3" 
                      />
                      {tag.label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-xs sm:text-sm font-medium mb-2">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleContinue}
            disabled={!selected}
            variant="primary"
            fullWidth
          >
            Avançar
          </Button>

          <div className="flex justify-center py-4 mt-2">
            <p className="text-xs text-black-100">
              © 2026 HS Tecnologia. Todos os direitos reservados.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StepProfile;