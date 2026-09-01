export interface CategoriaCor {
  bg: string;
  text: string;
  badgeBg: string;
}

export const CATEGORIA_CORES: Record<number, CategoriaCor> = {
  1: { bg: "bg-violet-200", text: "text-violet-primary", badgeBg: "bg-violet-primary" },
  2: { bg: "bg-white-hover", text: "text-black-primary", badgeBg: "bg-white-500" },
  3: { bg: "bg-blue-200", text: "text-blue-primary", badgeBg: "bg-[#4F90DB]" },
  4: { bg: "bg-teal-200", text: "text-teal-400", badgeBg: "bg-teal-300" },
  5: { bg: "bg-orange-100", text: "text-orange-primary", badgeBg: "bg-orange-300" },
  6: { bg: "bg-green-100", text: "text-green-primary", badgeBg: "bg-green-300" },
  7: { bg: "bg-yellow-100", text: "text-yellow-primary", badgeBg: "bg-yellow-500" },
  8: { bg: "bg-red-100", text: "text-red-primary", badgeBg: "bg-red-200" },
};

export const CATEGORIA_COR_PADRAO: CategoriaCor = {
  bg: "bg-white-200",
  text: "text-black-primary",
  badgeBg: "bg-white-400",
};

export function getCategoriaCor(categoriaId: number): CategoriaCor {
  return CATEGORIA_CORES[categoriaId] || CATEGORIA_COR_PADRAO;
}