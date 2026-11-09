import type { User } from '~/types/user'
import type { Role } from '~/types/rbac'
import type { Department } from '~/types/department'
import type { Asset } from '~/types/asset'
import type { WorkflowRequest, WorkflowTemplate } from '~/types/workflow'
import type { Product } from '~/types/product'
import type { Order } from '~/types/order'
import { batikOrders, batikProducts } from './batik'
import type { PageQuery, Paginated } from '~/types/pagination'

export const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))
export const uid = () => Math.random().toString(36).slice(2, 10)

const day = 86400000
const ago = (d: number) => new Date(Date.now() - d * day).toISOString()

export const departments: Department[] = [
  { id: 'd-exec', code: 'EXEC', name: 'Executive Office', description: 'Leadership and strategy.', headUserId: '2', createdAt: ago(90) },
  { id: 'd-fo', code: 'FO', name: 'Front Office', description: 'Reception, concierge and guest relations.', headUserId: '3', createdAt: ago(90) },
  { id: 'd-fnb', code: 'FNB', name: 'Food & Beverage', description: 'Restaurants, bars and banquets.', createdAt: ago(90) },
  { id: 'd-hk', code: 'HK', name: 'Housekeeping', description: 'Rooms and public areas.', createdAt: ago(90) },
  { id: 'd-fin', code: 'FIN', name: 'Finance', description: 'Accounting and purchasing.', createdAt: ago(90) },
  { id: 'd-it', code: 'IT', name: 'IT', description: 'Systems and the CMS.', headUserId: '1', createdAt: ago(90) }
]

export const roles: Role[] = [
  { id: uid(), key: 'admin', name: 'Administrator', level: 99, permissions: ['*'], isSystem: true, createdAt: ago(60) },
  { id: uid(), key: 'ceo', name: 'CEO', level: 3, createdAt: ago(60), permissions: [
    'users.view', 'departments.view', 'assets.view', 'roles.view', 'products.view', 'orders.view',
    'workflows.create', 'workflows.approve', 'workflows.view_all', 'chatbot.use',
    'documents.view', 'documents.upload', 'documents.manage'] },
  { id: uid(), key: 'manager', name: 'Manager', level: 2, createdAt: ago(60), permissions: [
    'users.view', 'departments.view', 'assets.view', 'assets.create', 'assets.edit', 'assets.deprecate', 'products.view', 'products.manage', 'orders.view', 'orders.manage',
    'workflows.create', 'workflows.approve', 'chatbot.use',
    'documents.view', 'documents.upload', 'documents.manage', 'documents.types'] },
  { id: uid(), key: 'employee', name: 'Employee', level: 1, createdAt: ago(60), permissions: [
    'assets.view', 'products.view', 'orders.view', 'workflows.create', 'chatbot.use',
    'documents.view', 'documents.upload'] },
  { id: uid(), key: 'editor', name: 'Editor', level: 0, createdAt: ago(60), permissions: [
    'assets.view', 'assets.create', 'assets.edit', 'products.view', 'products.manage', 'orders.view', 'orders.manage', 'chatbot.use',
    'documents.view', 'documents.upload'] },
  { id: uid(), key: 'viewer', name: 'Viewer', level: 0, createdAt: ago(60), permissions: [
    'products.view', 'orders.view', 'documents.view'] }
]

const seedRoles = ['employee', 'manager', 'editor', 'viewer', 'employee'] as const
const firstNames = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kartika', 'Lukas']

// fixed demo accounts (password: "password") — see mock/auth.ts
const demo: User[] = [
  { id: '1', name: 'Admin', email: 'admin@example.com', role: 'admin', departmentId: 'd-it', status: 'active', createdAt: ago(60) },
  { id: '2', name: 'Bambang (CEO)', email: 'ceo@example.com', role: 'ceo', departmentId: 'd-exec', status: 'active', createdAt: ago(59) },
  { id: '3', name: 'Maria (Manager)', email: 'manager@example.com', role: 'manager', departmentId: 'd-fo', status: 'active', createdAt: ago(58) },
  { id: '4', name: 'Eko (Employee)', email: 'employee@example.com', role: 'employee', departmentId: 'd-fo', status: 'active', createdAt: ago(57) }
]

export const users: User[] = [...demo, ...Array.from({ length: 20 }, (_, i): User => {
  const n = firstNames[i % firstNames.length]!
  return {
    id: uid(),
    name: `${n} ${String.fromCharCode(65 + (i % 26))}.`,
    email: `${n.toLowerCase()}${i + 1}@example.com`,
    role: seedRoles[i % seedRoles.length]!,
    departmentId: i % 7 === 6 ? null : departments[1 + (i % 5)]!.id,
    status: i % 5 === 0 ? 'inactive' : 'active',
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString()
  }
})]

export const products: Product[] = batikProducts(uid)
export const orders: Order[] = batikOrders(uid, products)

export const assets: Asset[] = ([
  ['GH-IT-0001', 'Front desk PC #1', 'IT Equipment', 'd-fo', 'Lobby, front desk', 'good', '2024-03-12', 14500000],
  ['GH-IT-0002', 'Receipt printer', 'IT Equipment', 'd-fo', 'Lobby, front desk', 'fair', '2022-08-01', 3200000],
  ['GH-IT-0003', 'Core network switch', 'IT Equipment', 'd-it', 'Server room B1', 'good', '2023-01-20', 48000000],
  ['GH-KT-0001', 'Combi oven Rational', 'Kitchen', 'd-fnb', 'Main kitchen', 'good', '2021-11-05', 210000000],
  ['GH-KT-0002', 'Espresso machine', 'Kitchen', 'd-fnb', 'Lobby lounge', 'damaged', '2019-06-14', 65000000],
  ['GH-FN-0001', 'Ballroom banquet chairs (200)', 'Furniture', 'd-fnb', 'Grand Ballroom store', 'good', '2023-09-01', 120000000],
  ['GH-LN-0001', 'Ivory table cloths (150)', 'Linen', 'd-hk', 'Linen room', 'fair', '2022-02-10', 22500000],
  ['GH-AV-0001', 'Projector 8000 lm', 'Audio Visual', 'd-fnb', 'Ballroom control room', 'new', '2026-08-18', 38000000],
  ['GH-VH-0001', 'Airport shuttle Alphard', 'Vehicle', 'd-fo', 'Basement parking', 'good', '2024-01-30', 1350000000],
  ['GH-FN-0002', 'Executive desk', 'Furniture', 'd-exec', 'GM office', 'good', '2020-05-01', 18000000],
  ['GH-IT-0000', 'Old reservation server', 'IT Equipment', 'd-it', 'Server room B1', 'damaged', '2015-04-02', 95000000]
] as const).map(([tag, name, category, departmentId, location, condition, purchaseDate, value], i) => ({
  id: uid(), tag, name, category, departmentId, location, condition, purchaseDate, value,
  notes: '', createdBy: 'Admin', createdAt: ago(40 - i * 3),
  ...(tag === 'GH-IT-0000'
    ? { status: 'deprecated' as const, deprecatedAt: ago(20), deprecatedReason: 'Replaced by cloud PMS' }
    : { status: 'active' as const, deprecatedAt: null, deprecatedReason: null })
}))

export const workflowTemplates: WorkflowTemplate[] = [
  { id: uid(), name: 'Purchase Request', description: 'Buying goods or services for the hotel.', isActive: true, createdAt: ago(30),
    steps: [{ roleKey: 'manager', label: 'Department review' }, { roleKey: 'ceo', label: 'Final approval' }] },
  { id: uid(), name: 'Leave Request', description: 'Annual or special leave.', isActive: true, createdAt: ago(30),
    steps: [{ roleKey: 'manager', label: 'Line manager' }] },
  { id: uid(), name: 'Content Publication', description: 'Publishing new promotional content.', isActive: true, createdAt: ago(30),
    steps: [{ roleKey: 'manager' }, { roleKey: 'ceo' }] }
]

/** filled by mock/workflow.ts on first use (needs the rules there) */
export const workflowRequests: WorkflowRequest[] = []

export function paginate<T>(rows: T[], q: PageQuery, searchFields: (keyof T)[]): Paginated<T> {
  const s = q.search?.trim().toLowerCase()
  let filtered = s
    ? rows.filter(r => searchFields.some(f => String(r[f]).toLowerCase().includes(s)))
    : rows
  // equality filters for any other non-empty param ('none' matches empty)
  for (const [k, v] of Object.entries(q)) {
    if (['page', 'pageSize', 'search'].includes(k) || v === '' || v == null) continue
    filtered = filtered.filter(r => {
      const x = (r as Record<string, unknown>)[k]
      return v === 'none' ? x == null || x === '' : String(x) === String(v)
    })
  }
  const start = (q.page - 1) * q.pageSize
  return { items: filtered.slice(start, start + q.pageSize), total: filtered.length, page: q.page, pageSize: q.pageSize }
}
