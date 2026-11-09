<script setup lang="ts">
import { FILE_KINDS, type DocumentFile, type DocSort } from '~/types/document'

definePageMeta({ permission: 'documents.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const toast = useToast()
const route = useRoute()

// filters (category = the "folder")
const f = reactive({
  category: (route.query.category as string) || '',
  search: '', departmentId: 'all', kind: 'all', sort: 'newest' as DocSort, status: 'active', mine: false, page: 1, pageSize: 12
})
const params = computed(() => ({
  search: f.search || undefined, departmentId: f.departmentId === 'all' ? undefined : f.departmentId,
  kind: f.kind === 'all' ? undefined : f.kind, sort: f.sort, status: f.status, mine: f.mine ? '1' : undefined
}))

const items = ref<DocumentFile[]>([])
const total = ref(0)
const counts = ref<Record<string, number>>({})
const loading = ref(false)
async function load() {
  loading.value = true
  try {
    const [res, c] = await Promise.all([
      $api.documents.list({ ...params.value, category: f.category || undefined, page: f.page, pageSize: f.pageSize }),
      $api.documents.counts(params.value)
    ])
    items.value = res.items; total.value = res.total; counts.value = c
  } catch (e) {
    toast.add({ title: 'Failed to load documents', description: (e as Error).message, color: 'error' })
  } finally { loading.value = false }
}
let t: ReturnType<typeof setTimeout>
watch(() => f.search, () => { clearTimeout(t); t = setTimeout(() => { f.page = 1; load() }, 300) })
watch(() => [f.category, f.departmentId, f.kind, f.sort, f.status, f.mine], () => { f.page = 1; load(); navigateTo({ query: f.category ? { category: f.category } : {} }, { replace: true }) })
watch(() => f.page, load)
onMounted(load)

const allCount = computed(() => Object.values(counts.value).reduce((a, b) => a + b, 0))
const { types, typeOf } = useDocumentTypes()
// folders = types that have documents (plus the selected one); unknown keys still show so nothing gets lost
const folders = computed(() => {
  const keys = new Set([...types.value.map(t => t.key), ...Object.keys(counts.value)])
  return [...keys].map(k => ({ ...typeOf(k), count: counts.value[k] ?? 0 })).filter(c => c.count || c.key === f.category)
})

const { data: deptList } = await useAsyncData('docs.departments', () =>
  $api.departments.list({ page: 1, pageSize: 500 }).then(r => r.items).catch(() => []))
const deptName = (id?: string | null) => (id && deptList.value?.find(d => d.id === id)?.name) || '—'
const deptItems = computed(() => [{ label: 'All departments', value: 'all' }, { label: 'No department', value: 'none' }, ...(deptList.value ?? []).map(d => ({ label: d.name, value: d.id }))])
const kindItems = [{ label: 'All file types', value: 'all' }, ...Object.entries(FILE_KINDS).map(([k, v]) => ({ label: v.label, value: k, icon: v.icon }))]
const sortItems: { label: string; value: DocSort }[] = [
  { label: 'Newest first', value: 'newest' }, { label: 'Oldest first', value: 'oldest' }, { label: 'Name A–Z', value: 'name' }, { label: 'Largest first', value: 'size' }
]
const view = ref<'list' | 'grid'>('list')
try { view.value = (localStorage.getItem('cms.docs.view') as 'list' | 'grid') || 'list' } catch { /* ignore */ }
watch(view, v => { try { localStorage.setItem('cms.docs.view', v) } catch { /* ignore */ } })

const uploadOpen = ref(false)
const detailOpen = ref(false)
const selected = ref<DocumentFile | null>(null)
function openDoc(d: DocumentFile) { selected.value = d; detailOpen.value = true }
function onChanged(d: DocumentFile) { selected.value = d; load() }
const date = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const hasFilters = computed(() => f.search || f.departmentId !== 'all' || f.kind !== 'all' || f.mine || f.status !== 'active')
function clearFilters() { Object.assign(f, { search: '', departmentId: 'all', kind: 'all', mine: false, status: 'active' }) }
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Documents</h1>
        <p class="text-sm text-(--ui-text-muted)">Hotel SOPs, policies, forms and manuals — one place to find them.</p>
      </div>
      <div class="flex gap-2">
      <UButton v-if="can('documents.types')" to="/documents/types" icon="i-lucide-tags" label="Types" color="neutral" variant="outline" :ui="{ label: 'hidden sm:inline' }" aria-label="Manage document types" />
      <UButton v-if="can('documents.upload')" icon="i-lucide-upload" label="Upload" :ui="{ label: 'hidden sm:inline' }" aria-label="Upload documents" @click="uploadOpen = true" />
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[220px_1fr]">
      <!-- category folders -->
      <nav aria-label="Categories" class="lg:sticky lg:top-6 self-start">
        <div class="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 -mx-1 px-1">
          <UButton :variant="!f.category ? 'soft' : 'ghost'" :color="!f.category ? 'primary' : 'neutral'" icon="i-lucide-library" class="shrink-0 lg:justify-start" @click="f.category = ''">
            All documents <UBadge :label="String(allCount)" size="sm" color="neutral" variant="subtle" class="ml-auto" />
          </UButton>
          <UButton v-for="c in folders" :key="c.key" :variant="f.category === c.key ? 'soft' : 'ghost'" :color="f.category === c.key ? 'primary' : 'neutral'" :icon="c.icon" class="shrink-0 lg:justify-start" @click="f.category = c.key">
            {{ c.name }} <UBadge :label="String(c.count)" size="sm" color="neutral" variant="subtle" class="ml-auto" />
          </UButton>
        </div>
      </nav>

      <UCard :ui="{ body: 'p-0 sm:p-0' }" class="min-w-0">
        <div class="p-4 border-b border-(--ui-border) space-y-2">
          <div class="flex flex-col sm:flex-row gap-2">
            <UInput v-model="f.search" icon="i-lucide-search" placeholder="Search title, file name, tags…" class="w-full sm:flex-1" />
            <USelect v-model="f.sort" :items="sortItems" icon="i-lucide-arrow-down-up" class="w-full sm:w-44" aria-label="Sort" />
            <UFieldGroup class="hidden sm:flex">
              <UButton icon="i-lucide-list" :variant="view === 'list' ? 'soft' : 'outline'" color="neutral" aria-label="List view" @click="view = 'list'" />
              <UButton icon="i-lucide-layout-grid" :variant="view === 'grid' ? 'soft' : 'outline'" color="neutral" aria-label="Grid view" @click="view = 'grid'" />
            </UFieldGroup>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <USelect v-model="f.departmentId" :items="deptItems" icon="i-lucide-building-2" size="sm" class="w-full sm:w-48" aria-label="Department" />
            <USelect v-model="f.kind" :items="kindItems" size="sm" class="w-full sm:w-40" aria-label="File type" />
            <USwitch v-model="f.mine" label="My uploads" size="sm" />
            <USwitch :model-value="f.status === 'archived'" label="Archived" size="sm" @update:model-value="v => f.status = v ? 'archived' : 'active'" />
            <UButton v-if="hasFilters" label="Clear" size="xs" variant="link" color="neutral" @click="clearFilters" />
          </div>
        </div>

        <div v-if="loading && !items.length" class="p-4 space-y-3"><USkeleton v-for="i in 5" :key="i" class="h-12" /></div>
        <div v-else-if="!items.length" class="p-10 text-center">
          <UIcon name="i-lucide-folder-open" class="size-10 text-(--ui-text-dimmed)" />
          <p class="mt-2 text-sm text-(--ui-text-muted)">{{ hasFilters || f.category ? 'No documents match these filters.' : 'No documents yet.' }}</p>
          <UButton v-if="can('documents.upload') && !hasFilters" class="mt-3" icon="i-lucide-upload" label="Upload the first one" variant="soft" @click="uploadOpen = true" />
        </div>

        <!-- list -->
        <ul v-else-if="view === 'list'" class="divide-y divide-(--ui-border)" :class="loading && 'opacity-60'">
          <li v-for="d in items" :key="d.id">
            <button type="button" class="w-full text-left p-4 flex items-center gap-3 hover:bg-(--ui-bg-elevated)/50" @click="openDoc(d)">
              <DocumentIcon :ext="d.extension" />
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ d.title }}</p>
                <p class="text-xs text-(--ui-text-muted) truncate">
                  {{ typeOf(d.category).name }} · {{ deptName(d.departmentId) }} · {{ formatBytes(d.size) }} · {{ d.uploadedByName }}
                </p>
              </div>
              <UIcon v-if="d.visibility === 'department'" name="i-lucide-lock" class="text-(--ui-text-muted) shrink-0" aria-label="Department only" />
              <span class="hidden sm:block text-xs text-(--ui-text-muted) shrink-0 w-24 text-right">{{ date(d.createdAt) }}</span>
              <UButton :to="d.url" :download="d.fileName" target="_blank" external icon="i-lucide-download" size="sm" color="neutral" variant="ghost" :aria-label="`Download ${d.title}`" @click.stop />
            </button>
          </li>
        </ul>

        <!-- grid -->
        <div v-else class="p-4 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" :class="loading && 'opacity-60'">
          <button v-for="d in items" :key="d.id" type="button" class="text-left rounded-xl border border-(--ui-border) p-3 hover:border-primary/50 hover:bg-primary/5 flex flex-col gap-2" @click="openDoc(d)">
            <div class="flex items-start justify-between"><DocumentIcon :ext="d.extension" size="lg" /><UIcon v-if="d.visibility === 'department'" name="i-lucide-lock" class="text-(--ui-text-muted)" /></div>
            <p class="font-medium text-sm line-clamp-2">{{ d.title }}</p>
            <p class="text-xs text-(--ui-text-muted) mt-auto">{{ typeOf(d.category).name }} · {{ date(d.createdAt) }}</p>
          </button>
        </div>

        <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
          <span class="text-(--ui-text-muted)">{{ total }} documents</span>
          <UPagination :sibling-count="1" show-edges v-model:page="f.page" :items-per-page="f.pageSize" :total="total" />
        </div>
      </UCard>
    </div>

    <DocumentUploadModal v-model:open="uploadOpen" :departments="deptList ?? []" @uploaded="load" />
    <DocumentDetail v-model:open="detailOpen" :doc="selected" :departments="deptList ?? []" @changed="onChanged" />
  </div>
</template>
