import type { AuthUser } from '~/types/auth'
import type { WorkflowRequest } from '~/types/workflow'

/** The step currently waiting for a decision, if any. */
export const currentStepOf = (r: WorkflowRequest) => (r.currentStep >= 0 ? r.steps[r.currentStep] : undefined)

/**
 * Can this user approve/reject the request right now?
 * Holder of the current step's role + workflows.approve, and not the requester themselves.
 * A super admin ('*') may decide any step (override).
 */
export function canDecide(r: WorkflowRequest, u: AuthUser | null | undefined) {
  if (!u || r.status !== 'pending') return false
  const step = currentStepOf(r)
  if (!step || r.requesterId === u.id) return false
  if (u.permissions.includes('*')) return true
  return hasPermission(u.permissions, 'workflows.approve') && step.roleKey === u.role
}

export const canCancel = (r: WorkflowRequest, u: AuthUser | null | undefined) =>
  !!u && r.requesterId === u.id && r.status === 'pending'

/** After full approval the requester continues the work and closes it. */
export const canComplete = (r: WorkflowRequest, u: AuthUser | null | undefined) =>
  !!u && r.requesterId === u.id && r.status === 'approved'
