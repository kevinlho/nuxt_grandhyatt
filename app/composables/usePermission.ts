import type { Permission } from '~/types/rbac'

/**
 * UI-side RBAC checks. Only hides what the user can't use —
 * the backend must still enforce every permission.
 */
export function usePermission() {
  const { user } = useAuth()
  const can = (p: Permission | Permission[]) => hasPermission(user.value?.permissions, p)
  const isRole = (key: string) => user.value?.role === key
  return { can, isRole, user }
}
