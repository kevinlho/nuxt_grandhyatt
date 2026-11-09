import type { UserRepository } from '~/domain/repositories/UserRepository'
import type { User, UserInput } from '~/domain/entities/User'
import type { PageQuery } from '~/domain/entities/Pagination'
import { delay, uid, users, paginate } from '~/data/datasources/dummy/dummyDb'

export class DummyUserRepository implements UserRepository {
  async list(q: PageQuery) { await delay(); return paginate(users, q, ['name', 'email', 'role']) }
  async getById(id: string) {
    await delay()
    const u = users.find(x => x.id === id)
    if (!u) throw new Error('User not found')
    return { ...u }
  }
  async create(input: UserInput) {
    await delay()
    if (users.some(u => u.email === input.email)) throw new Error('Email already exists')
    const u: User = { ...input, id: uid(), createdAt: new Date().toISOString() }
    users.unshift(u)
    return u
  }
  async update(id: string, input: UserInput) {
    await delay()
    const i = users.findIndex(x => x.id === id)
    if (i < 0) throw new Error('User not found')
    users[i] = { ...users[i], ...input }
    return users[i]
  }
  async remove(id: string) {
    await delay()
    const i = users.findIndex(x => x.id === id)
    if (i >= 0) users.splice(i, 1)
  }
}
