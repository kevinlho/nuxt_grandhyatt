export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResult {
  tokens: AuthTokens
  user: AuthUser
}
