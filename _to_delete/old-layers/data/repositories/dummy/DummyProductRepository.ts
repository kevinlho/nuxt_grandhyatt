import type { ProductRepository } from '~/domain/repositories/ProductRepository'
import type { Product, ProductInput } from '~/domain/entities/Product'
import type { PageQuery } from '~/domain/entities/Pagination'
import { delay, uid, products, paginate } from '~/data/datasources/dummy/dummyDb'

export class DummyProductRepository implements ProductRepository {
  async list(q: PageQuery) { await delay(); return paginate(products, q, ['name', 'sku', 'category']) }
  async getById(id: string) {
    await delay()
    const p = products.find(x => x.id === id)
    if (!p) throw new Error('Product not found')
    return { ...p }
  }
  async create(input: ProductInput) {
    await delay()
    if (products.some(p => p.sku === input.sku)) throw new Error('SKU already exists')
    const p: Product = { ...input, id: uid(), createdAt: new Date().toISOString() }
    products.unshift(p)
    return p
  }
  async update(id: string, input: ProductInput) {
    await delay()
    const i = products.findIndex(x => x.id === id)
    if (i < 0) throw new Error('Product not found')
    products[i] = { ...products[i], ...input }
    return products[i]
  }
  async remove(id: string) {
    await delay()
    const i = products.findIndex(x => x.id === id)
    if (i >= 0) products.splice(i, 1)
  }
}
