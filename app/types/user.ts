/** Role.key — roles are managed in /roles, so this is an open string. */
export type UserRole = string
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  /** Department.id — null/undefined = unassigned */
  departmentId?: string | null
  createdAt: string
}

export type UserInput = Omit<User, 'id' | 'createdAt'>
