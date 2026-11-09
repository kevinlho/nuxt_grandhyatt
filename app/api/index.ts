import type { AxiosInstance } from 'axios'
import type { Product, ProductInput } from '~/types/product'
import type { Order, OrderStatusInput } from '~/types/order'
import type { User, UserInput } from '~/types/user'
import type { Role, RoleInput } from '~/types/rbac'
import type { Department, DepartmentInput } from '~/types/department'
import type { Asset, AssetInput } from '~/types/asset'
import type { DocumentType, DocumentTypeInput } from '~/types/document'
import type { WorkflowTemplate, WorkflowTemplateInput } from '~/types/workflow'
import { totalStock } from '~/types/product'
import { tokenStorage } from '~/utils/tokenStorage'
import { authApi } from './auth'
import { crudApi } from './crud'
import { workflowApi } from './workflow'
import { chatApi } from './chat'
import { documentApi } from './documents'
import { documentTypes, documents as docRows, mockDocumentApi } from './mock/documents'
import { mockChatApi } from './mock/chat'
import { mockAuthApi } from './mock/auth'
import { mockCrud } from './mock/crud'
import { mockWorkflowApi } from './mock/workflow'
import { assets, departments, orders, products, roles, users, workflowRequests, workflowTemplates } from './mock/db'

/** All backend calls in one place. Add a new resource = one line here. */
export function createApi(http: AxiosInstance, useDummy: boolean, chatApiUrl?: string) {
  if (useDummy) {
    const roleCrud = mockCrud<Role, RoleInput>(roles, {
      label: 'Role', searchFields: ['name', 'key'],
      unique: (rows, i, id) => rows.some(r => r.key === i.key && r.id !== id) ? 'Role key already exists' : undefined
    })
    return {
      auth: mockAuthApi,
      users: mockCrud<User, UserInput>(users, {
        label: 'User', searchFields: ['name', 'email', 'role'],
        unique: (rows, i, id) => rows.some(u => u.email === i.email && u.id !== id) ? 'Email already exists' : undefined
      }),
      departments: (() => {
        const c = mockCrud<Department, DepartmentInput>(departments, {
          label: 'Department', searchFields: ['name', 'code', 'description'],
          unique: (rows, i, id) => rows.some(d => d.code === i.code && d.id !== id) ? 'Department code already exists' : undefined
        })
        return {
          ...c,
          async remove(id: string) {
            const n = users.filter(u => u.departmentId === id).length
            if (n) throw new Error(`${n} user(s) still belong to this department — move them first`)
            return c.remove(id)
          }
        }
      })(),
      assets: mockCrud<Asset, AssetInput>(assets, {
        label: 'Asset', searchFields: ['tag', 'name', 'category', 'location', 'condition', 'status'],
        unique: (rows, i, id) => rows.some(a => a.tag === i.tag && a.id !== id) ? 'Asset tag already exists' : undefined,
        prepare: a => ({ ...a, createdBy: a.createdBy ?? tokenStorage.getUser()?.name })
      }),
      roles: {
        ...roleCrud,
        async update(id: string, input: RoleInput) {
          const r = roles.find(x => x.id === id)
          if (r?.isSystem && input.key !== r.key) throw new Error('System role key cannot change')
          return roleCrud.update(id, input)
        },
        async remove(id: string) {
          const r = roles.find(x => x.id === id)
          if (r?.isSystem) throw new Error('System role cannot be deleted')
          if (r && users.some(u => u.role === r.key)) throw new Error('Role is still assigned to users')
          if (r && workflowTemplates.some(t => t.steps.some(s => s.roleKey === r.key))) throw new Error('Role is used in an approval flow')
          return roleCrud.remove(id)
        }
      },
      products: mockCrud<Product, ProductInput>(products, {
        label: 'Product', searchFields: ['name', 'sku', 'slug', 'category', 'gender', 'origin'],
        unique: (rows, i, id) =>
          rows.some(p => p.sku === i.sku && p.id !== id) ? 'SKU already exists'
          : rows.some(p => p.slug === i.slug && p.id !== id) ? 'Slug already exists' : undefined,
        prepare: p => ({ ...p, stock: totalStock(p.variants) })
      }),
      // orders are created by the storefront; the CMS only lists them and changes status
      orders: mockCrud<Order, OrderStatusInput>(orders, {
        label: 'Order', searchFields: ['code', 'customerName', 'email', 'phone', 'city', 'status']
      }),
      workflowTemplates: (() => {
        const c = mockCrud<WorkflowTemplate, WorkflowTemplateInput>(workflowTemplates, { label: 'Approval flow', searchFields: ['name', 'description'] })
        return {
          ...c,
          async remove(id: string) {
            if (workflowRequests.some(r => r.templateId === id && r.status === 'pending')) throw new Error('Flow has pending requests — deactivate it instead')
            return c.remove(id)
          }
        }
      })(),
      workflows: mockWorkflowApi,
      chat: mockChatApi,
      documents: mockDocumentApi,
      documentTypes: (() => {
        const c = mockCrud<DocumentType, DocumentTypeInput>(documentTypes, {
          label: 'Document type', searchFields: ['name', 'key', 'description'],
          unique: (rows, i, id) =>
            rows.some(r => r.key === i.key && r.id !== id) ? 'Key already exists'
            : rows.some(r => r.name?.toLowerCase() === i.name?.toLowerCase() && r.id !== id) ? 'Name already exists' : undefined
        })
        return {
          ...c,
          async update(id: string, input: DocumentTypeInput) {
            const cur = documentTypes.find(x => x.id === id)
            if (cur && cur.key !== input.key && docRows.some(d => d.category === cur.key)) throw new Error('Key cannot change while documents use this type')
            return c.update(id, input)
          },
          async remove(id: string) {
            const cur = documentTypes.find(x => x.id === id)
            const n = cur ? docRows.filter(d => d.category === cur.key).length : 0
            if (n) throw new Error(`${n} document(s) use this type — move them or deactivate the type instead`)
            return c.remove(id)
          }
        }
      })()
    }
  }
  return {
    auth: authApi(http),
    users: crudApi<User, UserInput>(http, '/users'),
    departments: crudApi<Department, DepartmentInput>(http, '/departments'),
    assets: crudApi<Asset, AssetInput>(http, '/assets'),
    roles: crudApi<Role, RoleInput>(http, '/roles'),
    products: crudApi<Product, ProductInput>(http, '/products'),
    orders: crudApi<Order, OrderStatusInput>(http, '/orders'),
    workflowTemplates: crudApi<WorkflowTemplate, WorkflowTemplateInput>(http, '/workflow-templates'),
    workflows: workflowApi(http),
    chat: chatApi(http, chatApiUrl || undefined),
    documents: documentApi(http),
    documentTypes: crudApi<DocumentType, DocumentTypeInput>(http, '/document-types')
  }
}

export type Api = ReturnType<typeof createApi>
