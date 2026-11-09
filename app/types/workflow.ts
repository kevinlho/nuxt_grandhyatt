/**
 * Workflow = a request that may only continue after it is approved up the hierarchy.
 *
 * WorkflowTemplate defines the approval chain, e.g. steps [manager, ceo].
 * When someone submits a request, the chain is copied onto the request.
 * Steps whose role level is <= the requester's level are skipped automatically
 * (a manager's request goes straight to the CEO). Steps are approved strictly in order;
 * one rejection ends the request.
 *
 *   pending ──approve each step──▶ approved ──requester continues──▶ completed
 *      │ reject at any step ▶ rejected
 *      └ requester cancels  ▶ cancelled
 */
export interface WorkflowTemplateStep {
  roleKey: string
  label?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  steps: WorkflowTemplateStep[]
  isActive: boolean
  createdAt: string
}

export type WorkflowTemplateInput = Omit<WorkflowTemplate, 'id' | 'createdAt'>

export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
export type StepStatus = 'waiting' | 'pending' | 'approved' | 'rejected' | 'skipped'

export interface WorkflowStep {
  order: number
  roleKey: string
  roleName: string
  label?: string
  status: StepStatus
  actorId?: string
  actorName?: string
  comment?: string
  actedAt?: string
}

export interface WorkflowHistoryEntry {
  at: string
  actorId: string
  actorName: string
  action: 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  comment?: string
}

export interface WorkflowRequest {
  id: string
  code: string
  templateId: string
  templateName: string
  title: string
  description: string
  amount?: number
  requesterId: string
  requesterName: string
  requesterRole: string
  status: WorkflowStatus
  /** index into steps of the step waiting for a decision; -1 when none */
  currentStep: number
  steps: WorkflowStep[]
  history: WorkflowHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowRequestInput {
  templateId: string
  title: string
  description: string
  amount?: number
}

/** mine = I submitted · inbox = waiting for my decision · all = everything (workflows.view_all) */
export type WorkflowScope = 'mine' | 'inbox' | 'all'

export const workflowStatusColor: Record<WorkflowStatus, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'neutral', completed: 'info'
}
export const stepStatusColor: Record<StepStatus, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning', approved: 'success', rejected: 'error', skipped: 'neutral', waiting: 'neutral'
}
