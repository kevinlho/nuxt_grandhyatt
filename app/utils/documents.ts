import { FALLBACK_TYPE, type DocCategory, type DocumentType } from '~/types/document'

export const fileExt = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')

/** "SOP_Check-in_v2.pdf" → "SOP Check-in v2" */
export const titleFromFile = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()

const norm = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ')

/**
 * Auto-sort: pick the active document type whose keyword appears in the file name
 * (longest keyword wins, so "request form" beats "form"); otherwise images → media, rest → other.
 */
export function suggestCategory(fileName: string, types: DocumentType[]): DocCategory {
  const text = ` ${norm(titleFromFile(fileName))} `
  let best: { key: string; len: number } | null = null
  for (const t of types) {
    if (!t.isActive) continue
    for (const k of t.keywords) {
      const kw = norm(k).trim()
      if (kw && text.includes(` ${kw} `) && kw.length > (best?.len ?? 0)) best = { key: t.key, len: kw.length }
    }
  }
  if (best) return best.key
  const fb = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExt(fileName)) ? FALLBACK_TYPE.image : FALLBACK_TYPE.other
  return types.some(t => t.key === fb && t.isActive) ? fb : (types.find(t => t.isActive)?.key ?? fb)
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
