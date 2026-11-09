import type { User } from '~/domain/entities/User'
import type { Product } from '~/domain/entities/Product'
import type { PageQuery, Paginated } from '~/domain/entities/Pagination'

export const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))
export const uid = () => Math.random().toString(36).slice(2, 10)

const roles = ['admin', 'editor', 'viewer'] as const
const firstNames = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kartika', 'Lukas']

export const users: User[] = Array.from({ length: 24 }, (_, i) => {
  const n = firstNames[i % firstNames.length]
  return {
    id: uid(),
    name: `${n} ${String.fromCharCode(65 + (i % 26))}.`,
    email: `${n.toLowerCase()}${i + 1}@example.com`,
    role: roles[i % 3],
    status: i % 5 === 0 ? 'inactive' : 'active',
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString()
  }
})

const categories = ['Electronics', 'Apparel', 'Home', 'Beauty', 'Sports']
export const products: Product[] = Array.from({ length: 36 }, (_, i) => ({
  id: uid(),
  name: `Product ${i + 1}`,
  sku: `SKU-${String(1000 + i)}`,
  category: categories[i % categories.length],
  price: Math.round((50000 + i * 12500) / 1000) * 1000,
  stock: (i * 7) % 120,
  isActive: i % 6 !== 0,
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
}))

export function paginate<T>(rows: T[], q: PageQuery, searchFields: (keyof T)[]): Paginated<T> {
  const s = q.search?.trim().toLowerCase()
  const filtered = s
    ? rows.filter(r => searchFields.some(f => String(r[f]).toLowerCase().includes(s)))
    : rows
  const start = (q.page - 1) * q.pageSize
  return { items: filtered.slice(start, start + q.pageSize), total: filtered.length, page: q.page, pageSize: q.pageSize }
}
