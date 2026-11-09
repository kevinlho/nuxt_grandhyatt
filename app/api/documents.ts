import type { AxiosInstance } from 'axios'
import type { PageQuery, Paginated } from '~/types/pagination'
import type { DocumentFile, DocumentMeta, DocumentUpload, DocSort } from '~/types/document'

export type DocumentQuery = PageQuery & {
  category?: string; departmentId?: string; kind?: string; status?: string; sort?: DocSort; mine?: string
}

export const documentApi = (http: AxiosInstance) => ({
  list: async (params: DocumentQuery) => (await http.get<Paginated<DocumentFile>>('/documents', { params })).data,
  /** document count per category, within what the user may see (respects status/department/kind/search) */
  counts: async (params: Omit<DocumentQuery, 'page' | 'pageSize' | 'category'>) =>
    (await http.get<Record<string, number>>('/documents/counts', { params })).data,
  get: async (id: string) => (await http.get<DocumentFile>(`/documents/${id}`)).data,
  async upload(input: DocumentUpload, onProgress?: (pct: number) => void) {
    const fd = new FormData()
    const { file, tags, ...meta } = input
    Object.entries(meta).forEach(([k, v]) => v != null && fd.append(k, String(v)))
    tags.forEach(t => fd.append('tags', t))
    fd.append('file', file, file.name)
    const { data } = await http.post<DocumentFile>('/documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000,
      onUploadProgress: e => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100))
    })
    return data
  },
  update: async (id: string, meta: DocumentMeta) => (await http.put<DocumentFile>(`/documents/${id}`, meta)).data,
  archive: async (id: string) => (await http.post<DocumentFile>(`/documents/${id}/archive`)).data,
  restore: async (id: string) => (await http.post<DocumentFile>(`/documents/${id}/restore`)).data
})

export type DocumentApi = ReturnType<typeof documentApi>
