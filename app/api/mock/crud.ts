import type { CrudApi } from '../crud'
import type { PageQuery } from '~/types/pagination'
import { delay, uid, paginate } from './db'

interface Options<T> {
  label: string
  searchFields: (keyof T)[]
  /** returns an error message if the input clashes with an existing row */
  unique?: (rows: T[], input: Partial<T>, id?: string) => string | undefined
  /** derive computed fields (e.g. product stock) before saving */
  prepare?: (row: T) => T
}

/** In-memory CRUD with the same shape as crudApi — used when NUXT_PUBLIC_USE_DUMMY=true. */
export function mockCrud<T extends { id: string; createdAt: string }, I>(rows: T[], o: Options<T>): CrudApi<T, I> {
  const find = (id: string) => {
    const i = rows.findIndex(x => x.id === id)
    if (i < 0) throw new Error(`${o.label} not found`)
    return i
  }
  return {
    async list(q: PageQuery) { await delay(); return paginate(rows, q, o.searchFields) },
    async get(id) { await delay(); return { ...rows[find(id)] } as T },
    async create(input) {
      await delay()
      const err = o.unique?.(rows, input as Partial<T>)
      if (err) throw new Error(err)
      let row = { ...input, id: uid(), createdAt: new Date().toISOString() } as unknown as T
      if (o.prepare) row = o.prepare(row)
      rows.unshift(row)
      return row
    },
    async update(id, input) {
      await delay()
      const i = find(id)
      const err = o.unique?.(rows, input as Partial<T>, id)
      if (err) throw new Error(err)
      rows[i] = { ...rows[i], ...input } as unknown as T
      if (o.prepare) rows[i] = o.prepare(rows[i]!)
      return rows[i]
    },
    async remove(id) { await delay(); const i = rows.findIndex(x => x.id === id); if (i >= 0) rows.splice(i, 1) }
  }
}
