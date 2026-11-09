export interface PageQuery {
  page: number
  pageSize: number
  search?: string
  /** extra equality filters sent as query params, e.g. departmentId ('none' = unassigned) */
  [filter: string]: string | number | undefined
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
