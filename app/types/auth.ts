import type { PermissionGrant } from './rbac'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  /** role.name, for display */
  roleName?: string
  /** role.level in the approval hierarchy */
  roleLevel?: number
  /** resolved permissions of the role; '*' = all */
  permissions: PermissionGrant[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResult {
  tokens: AuthTokens
  user: AuthUser
}
