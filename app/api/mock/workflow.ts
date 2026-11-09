import type { WorkflowApi, WorkflowQuery } from '../workflow'
import type { AuthUser } from '~/types/auth'
import type { WorkflowHistoryEntry, WorkflowRequest, WorkflowRequestInput, WorkflowStep, WorkflowTemplate } from '~/types/workflow'
import { tokenStorage } from '~/utils/tokenStorage'
import { toAuthUser } from './auth'
import { delay, paginate, roles, uid, users, workflowRequests as rows, workflowTemplates } from './db'

/*
 * In-memory version of the backend rules. The real backend must implement the same:
 *  1. copy the template's steps onto the request
 *  2. skip steps whose role level <= requester's level
 *  3. only the holder of the current step's role can approve/reject, in order
 *  4. last approval → status 'approved'; any rejection → 'rejected'
 */

function me(): AuthUser {
  const s = tokenStorage.getUser()
  const u = s && users.find(x => x.id === s.id)
  if (!u) throw new Error('Not signed in')
  return toAuthUser(u)
}

const levelOf = (roleKey: string) => roles.find(r => r.key === roleKey)?.level ?? 0
const nameOf = (roleKey: string) => roles.find(r => r.key === roleKey)?.name ?? roleKey
const now = () => new Date().toISOString()
const code = () => `WF-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`

export function buildSteps(t: WorkflowTemplate, requesterRole: string): WorkflowStep[] {
  const myLevel = levelOf(requesterRole)
  return t.steps.map((s, order) => ({
    order, roleKey: s.roleKey, roleName: nameOf(s.roleKey), label: s.label,
    status: levelOf(s.roleKey) <= myLevel ? 'skipped' : 'waiting'
  }))
}

/** Moves to the next non-skipped step, or marks the request approved if none left. */
function advance(r: WorkflowRequest) {
  const next = r.steps.findIndex(s => s.status === 'waiting')
  if (next < 0) { r.status = 'approved'; r.currentStep = -1; return }
  r.steps[next]!.status = 'pending'
  r.currentStep = next
}

function create(input: WorkflowRequestInput, u: AuthUser, at = now()): WorkflowRequest {
  const t = workflowTemplates.find(x => x.id === input.templateId)
  if (!t || !t.isActive) throw new Error('Workflow type not found or inactive')
  if (!input.title.trim()) throw new Error('Title is required')
  const r: WorkflowRequest = {
    id: uid(), code: code(), templateId: t.id, templateName: t.name,
    title: input.title.trim(), description: input.description, amount: input.amount,
    requesterId: u.id, requesterName: u.name, requesterRole: u.role,
    status: 'pending', currentStep: -1, steps: buildSteps(t, u.role),
    history: [{ at, actorId: u.id, actorName: u.name, action: 'submitted' }],
    createdAt: at, updatedAt: at
  }
  advance(r)
  return r
}

function decide(r: WorkflowRequest, u: AuthUser, approve: boolean, comment?: string) {
  if (!canDecide(r, u)) throw new Error('You cannot decide on this request at its current step')
  const step = r.steps[r.currentStep]!
  const at = now()
  Object.assign(step, { status: approve ? 'approved' : 'rejected', actorId: u.id, actorName: u.name, comment, actedAt: at })
  r.history.push({ at, actorId: u.id, actorName: u.name, action: approve ? 'approved' : 'rejected', comment })
  r.updatedAt = at
  if (approve) advance(r)
  else { r.status = 'rejected'; r.currentStep = -1 }
}

const log = (r: WorkflowRequest, u: AuthUser, action: WorkflowHistoryEntry['action'], comment?: string) => {
  r.updatedAt = now()
  r.history.push({ at: r.updatedAt, actorId: u.id, actorName: u.name, action, comment })
}

// ---- seed a few requests in different states -------------------------------
let seeded = false
function seed() {
  if (seeded) return
  seeded = true
  const by = (id: string) => toAuthUser(users.find(u => u.id === id)!)
  const [emp, mgr, ceo] = [by('4'), by('3'), by('2')]
  const [purchase, leave, content] = workflowTemplates
  const t = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
  const a = create({ templateId: purchase!.id, title: 'New linen for Grand Ballroom', description: '200 table cloths, ivory.', amount: 45000000 }, emp, t(3))
  const b = create({ templateId: purchase!.id, title: 'Replace lobby espresso machine', description: 'Current unit is beyond repair.', amount: 28500000 }, emp, t(2))
  decide(b, mgr, true, 'Needed before the weekend events.')
  const c = create({ templateId: leave!.id, title: 'Annual leave 12–14 Nov', description: 'Family event.' }, emp, t(5))
  decide(c, mgr, true)
  const d = create({ templateId: content!.id, title: 'Year-end staycation promo', description: 'Homepage banner + IG posts.' }, mgr, t(1))
  const e = create({ templateId: purchase!.id, title: 'Gym equipment upgrade', description: 'Two treadmills.', amount: 120000000 }, emp, t(6))
  decide(e, mgr, true); decide(e, ceo, false, 'Not in this year\'s budget — resubmit in Q1.')
  rows.push(d, b, a, c, e)
}

const find = (id: string) => {
  seed()
  const r = rows.find(x => x.id === id)
  if (!r) throw new Error('Request not found')
  return r
}
const clone = (r: WorkflowRequest) => structuredClone(r)

function visible(q: Pick<WorkflowQuery, 'scope' | 'status'>, u: AuthUser) {
  seed()
  let list = rows
  if (q.scope === 'mine') list = list.filter(r => r.requesterId === u.id)
  else if (q.scope === 'inbox') list = list.filter(r => canDecide(r, u))
  else if (!hasPermission(u.permissions, 'workflows.view_all')) throw new Error('Forbidden')
  if (q.status) list = list.filter(r => r.status === q.status)
  return [...list].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
}

export const mockWorkflowApi: WorkflowApi = {
  async list(q) { await delay(); return structuredClone(paginate(visible(q, me()), { page: q.page, pageSize: q.pageSize, search: q.search }, ['code', 'title', 'templateName', 'requesterName', 'status'])) },
  async get(id) {
    await delay()
    const r = find(id), u = me()
    const involved = r.requesterId === u.id || r.steps.some(s => s.roleKey === u.role) || hasPermission(u.permissions, 'workflows.view_all')
    if (!involved) throw new Error('Forbidden')
    return clone(r)
  },
  async inboxCount() { await delay(150); return visible({ scope: 'inbox' }, me()).length },
  async submit(input) {
    await delay()
    const u = me()
    if (!hasPermission(u.permissions, 'workflows.create')) throw new Error('Forbidden')
    const r = create(input, u)
    rows.unshift(r)
    return clone(r)
  },
  async approve(id, comment) { await delay(); const r = find(id); decide(r, me(), true, comment); return clone(r) },
  async reject(id, comment) {
    await delay()
    if (!comment?.trim()) throw new Error('A reason is required to reject')
    const r = find(id); decide(r, me(), false, comment); return clone(r)
  },
  async cancel(id) {
    await delay()
    const r = find(id), u = me()
    if (!canCancel(r, u)) throw new Error('Only the requester can cancel a pending request')
    r.status = 'cancelled'
    if (r.currentStep >= 0) r.steps[r.currentStep]!.status = 'waiting'
    r.currentStep = -1
    log(r, u, 'cancelled')
    return clone(r)
  },
  async complete(id, comment) {
    await delay()
    const r = find(id), u = me()
    if (!canComplete(r, u)) throw new Error('Only the requester can complete an approved request')
    r.status = 'completed'
    log(r, u, 'completed', comment)
    return clone(r)
  }
}
