export const CATEGORIA_PONTO_COLETA = {
  1: 'Restaurante industrial',
  2: 'Restaurante e lanchonete',
  3: 'Escola / Universidade',
  4: 'Hotel / Pousada',
  5: 'Empresa / Refeitório corporativo',
  6: 'Condomínio / Casa residencial',
} as const

export type CategoriaId = keyof typeof CATEGORIA_PONTO_COLETA

export const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_PONTO_COLETA).map(([value, label]) => ({
  value,
  label,
}))