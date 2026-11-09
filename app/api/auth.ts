import type { AxiosInstance } from 'axios'
import type { AuthTokens, LoginCredentials, LoginResult } from '~/types/auth'

export const authApi = (http: AxiosInstance) => ({
  login: async (c: LoginCredentials) => (await http.post<LoginResult>('/auth/login', c, { skipAuth: true })).data,
  refresh: async (refreshToken: string) => (await http.post<AuthTokens>('/auth/refresh', { refreshToken }, { skipAuth: true })).data,
  logout: async () => { await http.post('/auth/logout') }
})

export type AuthApi = ReturnType<typeof authApi>
