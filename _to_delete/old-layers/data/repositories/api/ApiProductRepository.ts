import type { AxiosInstance } from 'axios'
import type { ProductRepository } from '~/domain/repositories/ProductRepository'
import type { Product, ProductInput } from '~/domain/entities/Product'
import type { PageQuery, Paginated } from '~/domain/entities/Pagination'

export class ApiProductRepository implements ProductRepository {
  constructor(private http: AxiosInstance) {}
  async list(params: PageQuery) { return (await this.http.get<Paginated<Product>>('/products', { params })).data }
  async getById(id: string) { return (await this.http.get<Product>(`/products/${id}`)).data }
  async create(input: ProductInput) { return (await this.http.post<Product>('/products', input)).data }
  async update(id: string, input: ProductInput) { return (await this.http.put<Product>(`/products/${id}`, input)).data }
  async remove(id: string) { await this.http.delete(`/products/${id}`) }
}
