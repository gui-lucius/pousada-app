import { db } from './db'

export async function inicializarDados() {
  const categoriasExistem = (await db.categorias.count()) > 0
  const itensExistem = (await db.itens.count()) > 0

  if (!categoriasExistem) {
    await db.categorias.bulkAdd([
      { id: 'bebidas', nome: 'Bebidas', emoji: '🍹' },
      { id: 'restaurante', nome: 'Restaurante', emoji: '🍽️' },
      { id: 'kg', nome: 'Produtos por KG', emoji: '⚖️' },
      { id: 'servicos', nome: 'Serviços', emoji: '🛠️' },
      { id: 'doces', nome: 'Doces e Salgados', emoji: '🍬' },
      { id: 'lasanhas', nome: 'Lasanhas', emoji: '🍝' },
      { id: 'calzones', nome: 'Calzones', emoji: '🥟' },
      { id: 'porcoes', nome: 'Porções', emoji: '🍟' },
      { id: 'sopas', nome: 'Sopas', emoji: '🥣' },
      { id: 'jantar', nome: 'Jantar da Casa', emoji: '🏠' }
    ])
  }

  if (!itensExistem) {
    await db.itens.bulkAdd([
      { id: 1, nome: 'Coca-Cola', preco: 6, categoriaId: 'bebidas' },
      { id: 2, nome: 'Água Mineral', preco: 3, categoriaId: 'bebidas' },
      { id: 3, nome: 'Espaguete Bolonhesa', preco: 22, categoriaId: 'jantar' },
      { id: 4, nome: 'Pastel de Queijo', preco: 8, categoriaId: 'doces' },
      { id: 5, nome: 'Calzone de Frango', preco: 16, categoriaId: 'calzones' },
      { id: 6, nome: 'Lasanha de Carne', preco: 25, categoriaId: 'lasanhas' }
    ])
  }
}
