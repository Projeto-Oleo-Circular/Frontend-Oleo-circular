export interface EstabelecimentoTag {
  label: string;
  icon: string;
  categoriaId: number;
}

export interface PerfilParceiro {
  id: 'institucional' | 'comunitario' | 'solidario';
  icon: string;
  label: string;
  title: string;
  description: string;
  totalSteps: number;
  tags: EstabelecimentoTag[];
}

export const PERFIS_PARCEIRO: PerfilParceiro[] = [
  {
    id: 'institucional',
    icon: 'icon-parceiros.svg',
    label: 'Parceiros',
    title: 'Institucionais',
    description: 'Organizações com alta capacidade de doação.',
    totalSteps: 6,
    tags: [
      { label: 'Cozinha Industrial', icon: 'icon-CozinhaIndustrial.svg', categoriaId: 1 },
      { label: 'Empresa / Indústria', icon: 'icon-empresa.svg', categoriaId: 2 },
      { label: 'Escola / Universidade', icon: 'icon-universidade.svg', categoriaId: 3 },
      { label: 'Hotel / Pousada', icon: 'icon-hotel.svg', categoriaId: 4 },
      { label: 'Restaurante / Bar', icon: 'icon-restaurante.svg', categoriaId: 5 },
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
      { label: 'Condomínio', icon: 'icon-condominio.svg', categoriaId: 6 },
      { label: 'Feira Livre / Eventos', icon: 'icon-feira.svg', categoriaId: 7 },
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
      { label: 'Doador Avulso', icon: 'icon-doadorAvulso.svg', categoriaId: 8 },
    ],
  },
];

export function getCategoriaIdPorLabel(label: string): number | null {
  for (const perfil of PERFIS_PARCEIRO) {
    const tag = perfil.tags.find((t) => t.label === label);
    if (tag) return tag.categoriaId;
  }
  return null;
}