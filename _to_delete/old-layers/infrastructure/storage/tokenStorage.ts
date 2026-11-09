import type { AuthTokens, AuthUser } from '~/domain/entities/Auth'

const ACCESS = 'cms.accessToken'
const REFRESH = 'cms.refreshToken'
const USER = 'cms.user'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS),
  getRefreshToken: () => localStorage.getItem(REFRESH),
  setTokens(t: AuthTokens) {
    localStorage.setItem(ACCESS, t.accessToken)
    localStorage.setItem(REFRESH, t.refreshToken)
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (u: AuthUser) => localStorage.setItem(USER, JSON.stringify(u)),
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(USER)
  }
}
