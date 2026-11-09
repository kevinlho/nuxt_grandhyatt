import type { AxiosInstance } from 'axios'
import type { AuthRepository } from '~/domain/repositories/AuthRepository'
import type { AuthTokens, LoginCredentials, LoginResult } from '~/domain/entities/Auth'

export class ApiAuthRepository implements AuthRepository {
  constructor(private http: AxiosInstance) {}
  async login(c: LoginCredentials) {
    const { data } = await this.http.post<LoginResult>('/auth/login', c, { skipAuth: true })
    return data
  }
  async refresh(refreshToken: string) {
    const { data } = await this.http.post<AuthTokens>('/auth/refresh', { refreshToken }, { skipAuth: true })
    return data
  }
  async logout() { await this.http.post('/auth/logout') }
}
