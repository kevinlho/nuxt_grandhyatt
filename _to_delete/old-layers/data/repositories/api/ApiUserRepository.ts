import type { AxiosInstance } from 'axios'
import type { UserRepository } from '~/domain/repositories/UserRepository'
import type { User, UserInput } from '~/domain/entities/User'
import type { PageQuery, Paginated } from '~/domain/entities/Pagination'

export class ApiUserRepository implements UserRepository {
  constructor(private http: AxiosInstance) {}
  async list(params: PageQuery) { return (await this.http.get<Paginated<User>>('/users', { params })).data }
  async getById(id: string) { return (await this.http.get<User>(`/users/${id}`)).data }
  async create(input: UserInput) { return (await this.http.post<User>('/users', input)).data }
  async update(id: string, input: UserInput) { return (await this.http.put<User>(`/users/${id}`, input)).data }
  async remove(id: string) { await this.http.delete(`/users/${id}`) }
}
