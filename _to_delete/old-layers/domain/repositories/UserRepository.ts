import type { User, UserInput } from '../entities/User'
import type { PageQuery, Paginated } from '../entities/Pagination'

export interface UserRepository {
  list(query: PageQuery): Promise<Paginated<User>>
  getById(id: string): Promise<User>
  create(input: UserInput): Promise<User>
  update(id: string, input: UserInput): Promise<User>
  remove(id: string): Promise<void>
}
