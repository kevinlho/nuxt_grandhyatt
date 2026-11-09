import type { AuthRepository } from '~/domain/repositories/AuthRepository'
import type { LoginCredentials, LoginResult, AuthTokens } from '~/domain/entities/Auth'
import { delay, uid } from '~/data/datasources/dummy/dummyDb'

// Demo login: admin@example.com / password
export class DummyAuthRepository implements AuthRepository {
  async login(c: LoginCredentials): Promise<LoginResult> {
    await delay()
    if (c.email !== 'admin@example.com' || c.password !== 'password') {
      throw new Error('Invalid email or password')
    }
    return {
      tokens: { accessToken: `dummy-access-${uid()}`, refreshToken: `dummy-refresh-${uid()}` },
      user: { id: '1', name: 'Admin', email: c.email, role: 'admin' }
    }
  }
  async refresh(): Promise<AuthTokens> {
    await delay(200)
    return { accessToken: `dummy-access-${uid()}`, refreshToken: `dummy-refresh-${uid()}` }
  }
  async logout() { await delay(150) }
}
