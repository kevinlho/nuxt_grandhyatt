export interface Department {
  id: string
  code: string          // short unique code, e.g. 'FIN'
  name: string
  description: string
  headUserId?: string   // department head (optional)
  createdAt: string
}

export type DepartmentInput = Omit<Department, 'id' | 'createdAt'>
