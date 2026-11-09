import type { AuthApi } from '../auth'
import type { AuthUser } from '~/types/auth'
import { delay, roles, uid, users } from './db'

const tokens = () => ({ accessToken: `dummy-access-${uid()}`, refreshToken: `dummy-refresh-${uid()}` })

/** Builds the session user (role + resolved permissions) the way the backend would. */
export function toAuthUser(u: { id: string; name: string; email: string; role: string; departmentId?: string | null }): AuthUser {
  const r = roles.find(x => x.key === u.role)
  return { id: u.id, name: u.name, email: u.email, role: u.role, roleName: r?.name ?? u.role, roleLevel: r?.level ?? 0, departmentId: u.departmentId ?? null, permissions: r?.permissions ?? [] }
}

// Demo logins (password for all: "password"):
//   admin@example.com · employee@example.com · manager@example.com · ceo@example.com
export const mockAuthApi: AuthApi = {
  async login(c) {
    await delay()
    const u = users.find(x => x.email.toLowerCase() === c.email.toLowerCase())
    if (!u || c.password !== 'password') throw new Error('Invalid email or password')
    if (u.status !== 'active') throw new Error('Account is inactive')
    return { tokens: tokens(), user: toAuthUser(u) }
  },
  async refresh() { await delay(200); return tokens() },
  async logout() { await delay(150) }
}
