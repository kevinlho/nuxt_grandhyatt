import type { AuthTokens, LoginCredentials, LoginResult } from '../entities/Auth'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResult>
  refresh(refreshToken: string): Promise<AuthTokens>
  logout(): Promise<void>
}
