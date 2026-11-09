/**
 * RBAC contract.
 * A user has exactly one role (User.role = Role.key). A role grants a set of permission keys.
 * `level` ranks roles in the approval hierarchy (employee 1 → manager 2 → CEO 3 …);
 * roles outside the hierarchy (e.g. editor/viewer) can stay at level 0.
 */
export const PERMISSIONS = {
  'users.view': 'View users',
  'users.manage': 'Create / edit / delete users',
  'departments.view': 'View departments',
  'departments.manage': 'Create / edit / delete departments',
  'assets.view': 'View assets',
  'assets.create': 'Add assets',
  'assets.edit': 'Edit assets',
  'assets.deprecate': 'Mark assets deprecated / restore',
  'documents.view': 'Browse & download documents',
  'documents.upload': 'Upload documents',
  'documents.manage': 'Edit / archive any document, see all departments',
  'documents.types': 'Manage document types',
  'roles.view': 'View roles',
  'roles.manage': 'Create / edit / delete roles & permissions',
  'products.view': 'View products',
  'products.manage': 'Create / edit / delete products',
  'orders.view': 'View orders',
  'orders.manage': 'Change order status',
  'workflows.create': 'Submit workflow requests',
  'workflows.approve': 'Approve / reject requests at my level',
  'workflows.view_all': 'See every workflow request',
  'workflows.manage': 'Manage approval flows (templates)',
  'chatbot.use': 'Use the AI assistant'
} as const

export type Permission = keyof typeof PERMISSIONS
/** '*' = every permission (super admin) */
export type PermissionGrant = Permission | '*'

export const PERMISSION_GROUPS: { label: string; keys: Permission[] }[] = [
  { label: 'Users', keys: ['users.view', 'users.manage'] },
  { label: 'Departments', keys: ['departments.view', 'departments.manage'] },
  { label: 'Assets', keys: ['assets.view', 'assets.create', 'assets.edit', 'assets.deprecate'] },
  { label: 'Documents', keys: ['documents.view', 'documents.upload', 'documents.manage', 'documents.types'] },
  { label: 'Roles', keys: ['roles.view', 'roles.manage'] },
  { label: 'Products', keys: ['products.view', 'products.manage'] },
  { label: 'Orders', keys: ['orders.view', 'orders.manage'] },
  { label: 'AI Assistant', keys: ['chatbot.use'] },
  { label: 'Workflows', keys: ['workflows.create', 'workflows.approve', 'workflows.view_all', 'workflows.manage'] }
]

export interface Role {
  id: string
  key: string          // stable identifier stored on the user, e.g. 'manager'
  name: string         // display name, e.g. 'Manager'
  level: number        // approval hierarchy rank; higher = more senior
  permissions: PermissionGrant[]
  isSystem?: boolean   // cannot be deleted (admin)
  createdAt: string
}

export type RoleInput = Omit<Role, 'id' | 'createdAt' | 'isSystem'>
