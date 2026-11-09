import type { Product, ProductInput } from '../entities/Product'
import type { PageQuery, Paginated } from '../entities/Pagination'

export interface ProductRepository {
  list(query: PageQuery): Promise<Paginated<Product>>
  getById(id: string): Promise<Product>
  create(input: ProductInput): Promise<Product>
  update(id: string, input: ProductInput): Promise<Product>
  remove(id: string): Promise<void>
}
