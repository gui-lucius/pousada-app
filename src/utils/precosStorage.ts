// utils/precosStorage.ts

export type ItemPreco = { nome: string; preco: number; detalhes?: string }

export type CategoriaPreco = {
  nome: string
  tipo: 'hospedagem' | 'produto' | 'servico' | 'jantar' | 'outros'
  itens: ItemPreco[]
}

const CHAVE = 'pousada_precos'

export function obterCategorias(): CategoriaPreco[] {
  if (typeof window === 'undefined') return []
  const json = localStorage.getItem(CHAVE)
  return json ? JSON.parse(json) : []
}

export function salvarCategorias(categorias: CategoriaPreco[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAVE, JSON.stringify(categorias))
}
