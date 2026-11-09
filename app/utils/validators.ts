import type { ProductInput } from '~/types/product'
import type { UserInput } from '~/types/user'

// Quick client-side checks for nicer UX. The Go backend is still the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function validateUser(i: UserInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!EMAIL_RE.test(i.email)) return 'Invalid email'
}

export function validateProduct(i: ProductInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!SLUG_RE.test(i.slug)) return 'Slug must be lowercase letters, numbers and dashes'
  if (!i.sku.trim()) return 'SKU is required'
  if (i.price < 0) return 'Price cannot be negative'
  if (!i.origin.trim()) return 'Origin is required'
  if (i.colors.some(c => !HEX_RE.test(c))) return 'Colors must be hex values like #5b3a22'
  if (!i.variants.length) return 'Add at least one size'
  if (i.variants.some(v => !v.size.trim())) return 'Every variant needs a size'
  if (new Set(i.variants.map(v => v.size)).size !== i.variants.length) return 'Sizes must be unique'
  if (i.variants.some(v => v.stock < 0)) return 'Stock cannot be negative'
}

export function validateDepartment(i: import('~/types/department').DepartmentInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!/^[A-Z0-9_-]{2,10}$/.test(i.code)) return 'Code must be 2–10 uppercase letters/numbers'
}

export function validateAsset(i: import('~/types/asset').AssetInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!/^[A-Z0-9-]{3,20}$/.test(i.tag)) return 'Asset tag must be 3–20 uppercase letters, numbers or dashes'
  if (!i.location.trim()) return 'Location is required'
  if (i.value != null && i.value < 0) return 'Value cannot be negative'
}

export function validateRole(i: import('~/types/rbac').RoleInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!/^[a-z][a-z0-9_]*$/.test(i.key)) return 'Key must be lowercase letters, numbers or _'
  if (!Number.isInteger(i.level) || i.level < 0) return 'Level must be a whole number ≥ 0'
}

export function validateWorkflowTemplate(i: import('~/types/workflow').WorkflowTemplateInput) {
  if (!i.name.trim()) return 'Name is required'
  if (!i.steps.length) return 'Add at least one approval step'
  if (i.steps.some(s => !s.roleKey)) return 'Every step needs a role'
  if (new Set(i.steps.map(s => s.roleKey)).size !== i.steps.length) return 'A role can appear only once in a flow'
}

export function validateWorkflowRequest(i: import('~/types/workflow').WorkflowRequestInput) {
  if (!i.templateId) return 'Choose a workflow type'
  if (!i.title.trim()) return 'Title is required'
  if (i.amount != null && i.amount < 0) return 'Amount cannot be negative'
}
