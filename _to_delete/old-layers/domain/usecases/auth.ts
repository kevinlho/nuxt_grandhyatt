import type { AuthRepository } from '../repositories/AuthRepository'
import type { LoginCredentials } from '../entities/Auth'

export class LoginUseCase {
  constructor(private repo: AuthRepository) {}
  execute(c: LoginCredentials) {
    if (!c.email || !c.password) throw new Error('Email and password are required')
    return this.repo.login(c)
  }
}

export class LogoutUseCase {
  constructor(private repo: AuthRepository) {}
  execute() { return this.repo.logout() }
}
