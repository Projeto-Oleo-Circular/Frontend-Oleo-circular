// src/constants/categorias.ts
export const CATEGORIA_PONTO_COLETA = {
  1: 'Restaurante industrial',
  2: 'Restaurante e lanchonete',
  3: 'Escola / Universidade',
  4: 'Hospital / Unidade de saúde',
  5: 'Hotel / Pousada',
  6: 'Empresa / Refeitório corporativo',
  7: 'Condomínio / Casa residencial',
} as const

export type CategoriaId = keyof typeof CATEGORIA_PONTO_COLETA

// Opções para dropdown (formato padrão)
export const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_PONTO_COLETA).map(([value, label]) => ({
  value, // string para compatibilidade com o Dropdown
  label,
}))