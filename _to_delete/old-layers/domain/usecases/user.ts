import type { UserRepository } from '../repositories/UserRepository'
import type { UserInput } from '../entities/User'
import type { PageQuery } from '../entities/Pagination'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(input: UserInput) {
  if (!input.name.trim()) throw new Error('Name is required')
  if (!EMAIL_RE.test(input.email)) throw new Error('Invalid email')
}

export class UserUseCases {
  constructor(private repo: UserRepository) {}
  list(q: PageQuery) { return this.repo.list(q) }
  get(id: string) { return this.repo.getById(id) }
  create(input: UserInput) { validate(input); return this.repo.create(input) }
  update(id: string, input: UserInput) { validate(input); return this.repo.update(id, input) }
  remove(id: string) { return this.repo.remove(id) }
}
