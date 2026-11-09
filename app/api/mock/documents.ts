import type { DocumentApi, DocumentQuery } from '../documents'
import type { AuthUser } from '~/types/auth'
import type { DocCategory, DocumentFile, DocumentType } from '~/types/document'
import { kindOf } from '~/types/document'
import { tokenStorage } from '~/utils/tokenStorage'
import { toAuthUser } from './auth'
import { delay, paginate, uid, users } from './db'

/*
 * In-memory document store. Files are kept as blob: URLs for this tab only.
 * Visibility rule (backend must enforce the same):
 *   everyone → any user with documents.view
 *   department → same department, the uploader, or documents.manage
 */
function me(): AuthUser & { departmentId?: string | null } {
  const s = tokenStorage.getUser()
  const u = s && users.find(x => x.id === s.id)
  if (!u) throw new Error('Not signed in')
  return { ...toAuthUser(u), departmentId: u.departmentId }
}
const canSee = (d: DocumentFile, u: ReturnType<typeof me>) =>
  d.visibility === 'everyone' || d.uploadedById === u.id || (!!u.departmentId && d.departmentId === u.departmentId) || hasPermission(u.permissions, 'documents.manage')
const canChange = (d: DocumentFile, u: AuthUser) => d.uploadedById === u.id || hasPermission(u.permissions, 'documents.manage')

const t = (key: string, name: string, icon: string, keywords: string[], description = ''): DocumentType =>
  ({ id: uid(), key, name, icon, keywords, description, isActive: true, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() })

export const documentTypes: DocumentType[] = [
  t('sop', 'SOP', 'i-lucide-list-checks', ['sop', 'standard operating', 'procedure', 'prosedur', 'checklist'], 'Step-by-step operating procedures'),
  t('policy', 'Policy', 'i-lucide-scale', ['policy', 'policies', 'kebijakan', 'peraturan', 'regulation', 'handbook', 'code of conduct'], 'Rules employees must follow'),
  t('form', 'Forms & Templates', 'i-lucide-file-pen-line', ['form', 'formulir', 'template', 'beo']),
  t('training', 'Training', 'i-lucide-graduation-cap', ['training', 'pelatihan', 'onboarding', 'module', 'course']),
  t('manual', 'Manuals & Guides', 'i-lucide-book-open', ['manual', 'guide', 'panduan', 'instruction', 'user guide']),
  t('report', 'Reports', 'i-lucide-chart-column', ['report', 'laporan', 'summary', 'kpi', 'forecast', 'budget']),
  t('contract', 'Contracts', 'i-lucide-file-signature', ['contract', 'kontrak', 'agreement', 'perjanjian', 'mou', 'nda', 'sla']),
  t('menu', 'Menus & Recipes', 'i-lucide-utensils', ['menu', 'recipe', 'resep', 'wine list']),
  t('media', 'Images & Media', 'i-lucide-image', ['photo', 'foto', 'image'], 'Used automatically for image files'),
  t('other', 'Other', 'i-lucide-file', [], 'Fallback when nothing else matches')
]

/** minimal valid one-page PDF so seeded files preview and download for real */
function makePdf(title: string, lines: string[]) {
  const esc = (s: string) => s.replace(/[\\()]/g, m => '\\' + m)
  const text = [`BT /F1 18 Tf 50 780 Td (${esc(title)}) Tj ET`,
    ...lines.map((l, i) => `BT /F1 11 Tf 50 ${740 - i * 18} Td (${esc(l)}) Tj ET`)].join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]
  let out = '%PDF-1.4\n'
  const offs: number[] = []
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([out], { type: 'application/pdf' })
}
const textBlob = (s: string, type: string) => new Blob([s], { type })

type Seed = [title: string, fileName: string, category: DocCategory, dept: string | null, visibility: 'everyone' | 'department', uploader: string, daysAgo: number, tags: string[], lines: string[]]
const SEEDS: Seed[] = [
  ['SOP Guest Check-in', 'SOP_Guest_Check-in_v3.pdf', 'sop', 'd-fo', 'everyone', '3', 2, ['front office', 'check-in'], ['1. Greet the guest within 10 seconds.', '2. Verify ID and booking.', '3. Pre-authorise the card.', '4. Explain hotel facilities and Wi-Fi.']],
  ['SOP Room Cleaning Standard', 'SOP_Room_Cleaning.pdf', 'sop', 'd-hk', 'everyone', '4', 6, ['housekeeping'], ['Strip linen, dust top-down, sanitise bathroom.', 'Inspect with the 42-point checklist.']],
  ['Employee Handbook 2026', 'Employee_Handbook_2026.pdf', 'policy', 'd-exec', 'everyone', '1', 30, ['hr', 'policy'], ['Working hours, leave, grooming standards,', 'code of conduct and disciplinary process.']],
  ['Cash Handling Policy', 'Cash_Handling_Policy.pdf', 'policy', 'd-fin', 'department', '1', 14, ['finance'], ['Float limits, double count, drop safe rules.']],
  ['Leave Request Form', 'Leave_Request_Form.docx', 'form', 'd-exec', 'everyone', '1', 40, ['hr', 'form'], []],
  ['Banquet Event Order Template', 'BEO_template.xlsx', 'form', 'd-fnb', 'department', '3', 9, ['banquet'], []],
  ['Fire Safety Training', 'Fire_Safety_Training_Module.pdf', 'training', null, 'everyone', '1', 21, ['safety', 'training'], ['RACE: Rescue, Alarm, Contain, Extinguish.', 'PASS: Pull, Aim, Squeeze, Sweep.']],
  ['Opera PMS User Guide', 'Opera_PMS_User_Guide.pdf', 'manual', 'd-fo', 'everyone', '3', 12, ['pms', 'system'], ['Logging in, reservations, folios, night audit.']],
  ['Monthly Occupancy Report - Oct', 'Occupancy_Report_Oct_2026.pdf', 'report', 'd-exec', 'department', '2', 5, ['kpi'], ['Occupancy 81.4%  ADR Rp 2.450.000  RevPAR Rp 1.994.300']],
  ['Laundry Vendor Agreement', 'Laundry_Vendor_Agreement_2026.pdf', 'contract', 'd-fin', 'department', '1', 60, ['vendor'], ['Term: 12 months. SLA: 24h turnaround.']],
  ['Lobby Lounge Menu', 'Lobby_Lounge_Menu_Nov.pdf', 'menu', 'd-fnb', 'everyone', '3', 3, ['menu', 'f&b'], ['Afternoon tea set .... Rp 395.000', 'Kopi tubruk .... Rp 85.000']]
]

export const documents: DocumentFile[] = SEEDS.map(([title, fileName, category, dept, visibility, uploader, days, tags, lines]) => {
  const ext = fileName.split('.').pop()!
  const blob = ext === 'pdf' ? makePdf(title, lines)
    : ext === 'xlsx' ? textBlob('Sample spreadsheet (dummy)', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    : textBlob('Sample document (dummy)', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  const u = users.find(x => x.id === uploader)!
  const at = new Date(Date.now() - days * 86400000).toISOString()
  return {
    id: uid(), title, description: '', category, tags, departmentId: dept, visibility, status: 'active',
    fileName, mimeType: blob.type, extension: ext, size: ext === 'pdf' ? blob.size : 48000 + days * 1500,
    url: URL.createObjectURL(blob), uploadedById: u.id, uploadedByName: u.name, createdAt: at, updatedAt: at
  }
})

function filtered(q: Omit<DocumentQuery, 'page' | 'pageSize'>, u: ReturnType<typeof me>) {
  const s = String(q.search ?? '').trim().toLowerCase()
  let rows = documents.filter(d => canSee(d, u) && d.status === (q.status || 'active'))
  if (q.category) rows = rows.filter(d => d.category === q.category)
  if (q.departmentId) rows = rows.filter(d => q.departmentId === 'none' ? !d.departmentId : d.departmentId === q.departmentId)
  if (q.kind) rows = rows.filter(d => kindOf(d.extension) === q.kind)
  if (q.mine) rows = rows.filter(d => d.uploadedById === u.id)
  if (s) rows = rows.filter(d => [d.title, d.fileName, d.description, ...d.tags].some(x => x.toLowerCase().includes(s)))
  const sort = q.sort ?? 'newest'
  return [...rows].sort((a, b) =>
    sort === 'name' ? a.title.localeCompare(b.title)
    : sort === 'size' ? b.size - a.size
    : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt)
    : b.createdAt.localeCompare(a.createdAt))
}

const find = (id: string) => {
  const d = documents.find(x => x.id === id)
  if (!d) throw new Error('Document not found')
  return d
}

export const mockDocumentApi: DocumentApi = {
  async list(q) { await delay(); return paginate(filtered(q, me()), { page: q.page, pageSize: q.pageSize }, []) },
  async counts(q) {
    await delay(150)
    const rows = filtered(q, me())
    return rows.reduce<Record<string, number>>((acc, d) => { acc[d.category] = (acc[d.category] ?? 0) + 1; return acc }, {})
  },
  async get(id) {
    await delay(); const d = find(id)
    if (!canSee(d, me())) throw new Error('Forbidden')
    return { ...d }
  },
  async upload(input, onProgress) {
    const u = me()
    if (!hasPermission(u.permissions, 'documents.upload')) throw new Error('Forbidden')
    // simulate upload progress (~1s, a bit longer for bigger files)
    const steps = 10
    for (let i = 1; i <= steps; i++) { await delay(60 + Math.min(input.file.size / 400000, 120)); onProgress?.(Math.round(i / steps * 100)) }
    const type = documentTypes.find(x => x.key === input.category)
    if (!type?.isActive) throw new Error('Choose an active document type')
    const { file, ...meta } = input
    const now = new Date().toISOString()
    const doc: DocumentFile = {
      ...meta, id: uid(), status: 'active', title: meta.title.trim() || file.name,
      fileName: file.name, mimeType: file.type, extension: fileExt(file.name), size: file.size,
      url: URL.createObjectURL(file), uploadedById: u.id, uploadedByName: u.name, createdAt: now, updatedAt: now
    }
    documents.unshift(doc)
    return { ...doc }
  },
  async update(id, meta) {
    await delay(); const d = find(id)
    if (!canChange(d, me())) throw new Error('Only the uploader or a document manager can edit this')
    Object.assign(d, meta, { updatedAt: new Date().toISOString() })
    return { ...d }
  },
  async archive(id) {
    await delay(); const d = find(id)
    if (!canChange(d, me())) throw new Error('Only the uploader or a document manager can archive this')
    d.status = 'archived'; d.updatedAt = new Date().toISOString()
    return { ...d }
  },
  async restore(id) {
    await delay(); const d = find(id)
    if (!canChange(d, me())) throw new Error('Forbidden')
    d.status = 'active'; d.updatedAt = new Date().toISOString()
    return { ...d }
  }
}
