import type { Permission, PermissionGrant } from '~/types/rbac'

/** true if the grant list contains the permission (or '*'). Accepts one or several — any match wins. */
export function hasPermission(grants: PermissionGrant[] | undefined, need: Permission | Permission[]) {
  if (!grants?.length) return false
  if (grants.includes('*')) return true
  const list = Array.isArray(need) ? need : [need]
  return list.some(p => grants.includes(p))
}
