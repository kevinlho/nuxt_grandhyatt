/**
 * Document library contract.
 * Files are sorted into a category (auto-suggested from the file name/type, confirmed by the uploader)
 * and belong to a department. `visibility` decides who can retrieve them.
 */
/**
 * Document type (category) — managed in /documents/types.
 * `keywords` drive auto-sorting: a file whose name contains a keyword gets this type.
 */
export interface DocumentType {
  id: string
  key: string            // stable id stored on documents, e.g. 'sop'
  name: string           // 'SOP'
  icon: string           // lucide icon, e.g. 'i-lucide-list-checks'
  description: string
  keywords: string[]     // ['sop', 'procedure', 'prosedur']
  isActive: boolean      // inactive = no new uploads, existing files stay
  createdAt: string
}
export type DocumentTypeInput = Omit<DocumentType, 'id' | 'createdAt'>

/** DocumentType.key */
export type DocCategory = string

/** fallback keys the auto-sort uses when no keyword matches */
export const FALLBACK_TYPE = { image: 'media', other: 'other' }

export const DOC_TYPE_ICONS = [
  'i-lucide-list-checks', 'i-lucide-scale', 'i-lucide-file-pen-line', 'i-lucide-graduation-cap', 'i-lucide-book-open',
  'i-lucide-chart-column', 'i-lucide-file-signature', 'i-lucide-utensils', 'i-lucide-image', 'i-lucide-file',
  'i-lucide-shield-alert', 'i-lucide-receipt', 'i-lucide-calendar-days', 'i-lucide-wrench', 'i-lucide-bed-double',
  'i-lucide-users', 'i-lucide-megaphone', 'i-lucide-clipboard-list', 'i-lucide-folder', 'i-lucide-briefcase'
]

export type DocVisibility = 'everyone' | 'department'
export type DocStatus = 'active' | 'archived'

export interface DocumentFile {
  id: string
  title: string
  description: string
  category: DocCategory
  tags: string[]
  departmentId?: string | null
  visibility: DocVisibility
  status: DocStatus
  fileName: string
  mimeType: string
  extension: string     // 'pdf', 'docx', …
  size: number          // bytes
  url: string           // download / preview URL
  uploadedById: string
  uploadedByName: string
  createdAt: string
  updatedAt: string
}

/** editable details (the file itself is replaced only by uploading a new document) */
export interface DocumentMeta {
  title: string
  description: string
  category: DocCategory
  tags: string[]
  departmentId?: string | null
  visibility: DocVisibility
}

export interface DocumentUpload extends DocumentMeta { file: File }

export type DocSort = 'newest' | 'oldest' | 'name' | 'size'

export const DOC_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  maxFiles: 10,
  accept: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'png', 'jpg', 'jpeg', 'webp']
}

/** file-type groups for the type filter and icons */
export const FILE_KINDS: Record<string, { label: string; icon: string; color: string; exts: string[] }> = {
  pdf: { label: 'PDF', icon: 'i-lucide-file-text', color: 'text-red-500', exts: ['pdf'] },
  doc: { label: 'Word', icon: 'i-lucide-file-type', color: 'text-blue-500', exts: ['doc', 'docx', 'md', 'txt'] },
  sheet: { label: 'Excel / CSV', icon: 'i-lucide-file-spreadsheet', color: 'text-green-600', exts: ['xls', 'xlsx', 'csv'] },
  slide: { label: 'PowerPoint', icon: 'i-lucide-presentation', color: 'text-orange-500', exts: ['ppt', 'pptx'] },
  image: { label: 'Image', icon: 'i-lucide-file-image', color: 'text-purple-500', exts: ['png', 'jpg', 'jpeg', 'webp'] }
}
export const kindOf = (ext: string) => Object.entries(FILE_KINDS).find(([, k]) => k.exts.includes(ext.toLowerCase()))?.[0] ?? 'other'
