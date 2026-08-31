export const CATEGORIA_PONTO_COLETA = { 
  1: 'Cozinha Industrial',
  2: 'Empresa / Indústria',
  3: 'Escola / Universidade',
  4: 'Hotel / Pousada',
  5: 'Restaurante / Bar',
  6: 'Condomínio',
  7: 'Feira Livre / Eventos',
  8: 'Doador Avulso'
} as const

export type CategoriaId = keyof typeof CATEGORIA_PONTO_COLETA

export const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_PONTO_COLETA).map(([value, label]) => ({
  value,
  label,
}))