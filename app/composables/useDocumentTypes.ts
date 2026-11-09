import type { DocumentType } from '~/types/document'

/** Document types, cached for the session; call refresh() after changes. */
export function useDocumentTypes() {
  const { $api } = useNuxtApp()
  const { data, refresh, pending } = useAsyncData('document-types', () =>
    $api.documentTypes.list({ page: 1, pageSize: 500 }).then(r => r.items), { default: () => [] as DocumentType[] })
  const types = computed(() => data.value ?? [])
  const active = computed(() => types.value.filter(t => t.isActive))
  const typeOf = (key: string) => types.value.find(t => t.key === key)
    ?? { key, name: key || 'Uncategorised', icon: 'i-lucide-file', isActive: false } as Pick<DocumentType, 'key' | 'name' | 'icon' | 'isActive'>
  const items = (includeKey?: string) => types.value
    .filter(t => t.isActive || t.key === includeKey)
    .map(t => ({ label: t.isActive ? t.name : `${t.name} (inactive)`, value: t.key, icon: t.icon }))
  return { types, active, typeOf, items, refresh, pending }
}
