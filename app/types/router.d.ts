import type { Permission } from './rbac'

declare module '#app' {
  interface PageMeta {
    public?: boolean
    /** user needs at least one of these permissions to open the page */
    permission?: Permission | Permission[]
  }
}
export {}
