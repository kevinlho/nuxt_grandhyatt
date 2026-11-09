import type { ProductRepository } from '../repositories/ProductRepository'
import type { ProductInput } from '../entities/Product'
import type { PageQuery } from '../entities/Pagination'

function validate(input: ProductInput) {
  if (!input.name.trim()) throw new Error('Name is required')
  if (!input.sku.trim()) throw new Error('SKU is required')
  if (input.price < 0) throw new Error('Price cannot be negative')
  if (input.stock < 0) throw new Error('Stock cannot be negative')
}

export class ProductUseCases {
  constructor(private repo: ProductRepository) {}
  list(q: PageQuery) { return this.repo.list(q) }
  get(id: string) { return this.repo.getById(id) }
  create(input: ProductInput) { validate(input); return this.repo.create(input) }
  update(id: string, input: ProductInput) { validate(input); return this.repo.update(id, input) }
  remove(id: string) { return this.repo.remove(id) }
}
