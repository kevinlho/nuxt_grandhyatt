<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { ASSET_CATEGORIES, conditionColor, type Asset, type AssetInput } from '~/types/asset'

definePageMeta({ permission: 'assets.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canCreate = computed(() => can('assets.create'))
const canEdit = computed(() => can('assets.edit'))
const canDeprecate = computed(() => can('assets.deprecate'))

const { items, total, loading, saving, query, load, save } = useCrud<Asset, AssetInput>($api.assets, 'Asset', validateAsset)

const { data: deptList } = await useAsyncData('assets.departments', () =>
  can('departments.view') ? $api.departments.list({ page: 1, pageSize: 500 }).then(r => r.items).catch(() => []) : Promise.resolve([]))
const deptName = (id?: string | null) => (id && deptList.value?.find(d => d.id === id)?.name) || '—'

// summary + tag list for auto-numbering (all assets, not just this page)
const { data: summary, refresh: refreshSummary } = await useAsyncData('assets.summary', async () => {
  const all = (await $api.assets.list({ page: 1, pageSize: 5000 })).items
  const active = all.filter(a => a.status !== 'deprecated')
  return { tags: all.map(a => a.tag), active: active.length, deprecated: all.length - active.length, value: active.reduce((s, a) => s + (a.value ?? 0), 0), damaged: active.filter(a => a.condition === 'damaged').length }
})

const status = ref<'active' | 'deprecated' | 'all'>('active')
const statusItems = [{ label: 'Active', value: 'active' }, { label: 'Deprecated', value: 'deprecated' }, { label: 'All', value: 'all' }]
watch(status, v => { query.status = v === 'all' ? '' : v }, { immediate: true })
const category = ref('all')
const dept = ref('all')
const categoryItems = [{ label: 'All categories', value: 'all' }, ...ASSET_CATEGORIES.map(c => ({ label: c, value: c }))]
const deptItems = computed(() => [{ label: 'All departments', value: 'all' }, { label: 'No department', value: 'none' }, ...(deptList.value ?? []).map(d => ({ label: d.name, value: d.id }))])
watch(category, v => { query.category = v === 'all' ? '' : v })
watch(dept, v => { query.departmentId = v === 'all' ? '' : v })

const formOpen = ref(false)
const deprecateOpen = ref(false)
const selected = ref<Asset | null>(null)
function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(a: Asset) { selected.value = a; formOpen.value = true }
function openDeprecate(a: Asset) { selected.value = a; deprecateOpen.value = true }
const strip = ({ id: _i, createdAt: _c, createdBy: _b, ...rest }: Asset): AssetInput => rest
async function onSubmit(input: AssetInput) {
  if (await save(input, selected.value?.id)) { formOpen.value = false; refreshSummary() }
}
/** deprecate (with reason) or restore — assets are never deleted */
async function onDeprecate(reason: string) {
  const a = selected.value
  if (!a) return
  const restoring = a.status === 'deprecated'
  const input: AssetInput = { ...strip(a), status: restoring ? 'active' : 'deprecated',
    deprecatedAt: restoring ? null : new Date().toISOString(), deprecatedReason: restoring ? null : reason }
  if (await save(input, a.id)) { deprecateOpen.value = false; refreshSummary() }
}
const rowActions = (a: Asset) => [[
  ...(canEdit.value ? [{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(a) }] : []),
  ...(canDeprecate.value ? [a.status === 'deprecated'
    ? { label: 'Restore', icon: 'i-lucide-archive-restore', onSelect: () => openDeprecate(a) }
    : { label: 'Mark deprecated', icon: 'i-lucide-archive', color: 'warning' as const, onSelect: () => openDeprecate(a) }] : [])
]]
const hasActions = computed(() => canEdit.value || canDeprecate.value)

const date = (s?: string) => s ? new Date(s).toLocaleDateString('id-ID') : '—'
const columns: TableColumn<Asset>[] = [
  { accessorKey: 'tag', header: 'Tag' },
  { accessorKey: 'name', header: 'Asset' },
  { accessorKey: 'departmentId', header: 'Department', cell: ({ row }) => deptName(row.original.departmentId) },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'condition', header: 'Condition' },
  { accessorKey: 'value', header: 'Value' },
  { id: 'actions', header: '' }
]
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Assets</h1>
        <p class="text-sm text-(--ui-text-muted)">Hotel equipment and property, by department and location.</p>
      </div>
      <UButton v-if="canCreate" icon="i-lucide-plus" label="Add Asset" :ui="{ label: 'hidden sm:inline' }" aria-label="Add Asset" @click="openCreate" />
    </div>

    <div v-if="summary" class="grid grid-cols-3 gap-3">
      <UCard :ui="{ body: 'p-3 sm:p-4' }"><p class="text-xs text-(--ui-text-muted)">Active assets</p><p class="text-lg font-semibold">{{ summary.active }} <span v-if="summary.deprecated" class="text-xs font-normal text-(--ui-text-muted)">+{{ summary.deprecated }} deprecated</span></p></UCard>
      <UCard :ui="{ body: 'p-3 sm:p-4' }"><p class="text-xs text-(--ui-text-muted)">Total value</p><p class="text-sm sm:text-lg font-semibold break-words">{{ idr(summary.value) }}</p></UCard>
      <UCard :ui="{ body: 'p-3 sm:p-4' }"><p class="text-xs text-(--ui-text-muted)">Damaged</p><p class="text-lg font-semibold" :class="summary.damaged ? 'text-(--ui-error)' : ''">{{ summary.damaged }}</p></UCard>
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border) flex flex-col sm:flex-row gap-2">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search tag, name, location…" class="w-full sm:max-w-xs" />
        <USelect v-model="status" :items="statusItems" class="w-full sm:w-36" aria-label="Filter by status" />
        <USelect v-model="category" :items="categoryItems" class="w-full sm:w-44" aria-label="Filter by category" />
        <USelect v-if="deptList?.length" v-model="dept" :items="deptItems" icon="i-lucide-building-2" class="w-full sm:w-48" aria-label="Filter by department" />
      </div>

      <UTable class="hidden md:block" :data="items" :columns="columns" :loading="loading">
        <template #tag-cell="{ row }"><span class="font-mono text-sm">{{ row.original.tag }}</span></template>
        <template #name-cell="{ row }">
          <p class="font-medium" :class="row.original.status === 'deprecated' ? 'line-through text-(--ui-text-muted)' : ''">{{ row.original.name }}</p>
          <p class="text-xs text-(--ui-text-muted)">{{ row.original.category }}<template v-if="row.original.notes"> · {{ row.original.notes }}</template></p>
          <p v-if="row.original.status === 'deprecated'" class="text-xs text-(--ui-warning)">Deprecated {{ date(row.original.deprecatedAt ?? undefined) }}<template v-if="row.original.deprecatedReason"> — {{ row.original.deprecatedReason }}</template></p>
        </template>
        <template #value-cell="{ row }">
          <p>{{ row.original.value != null ? idr(row.original.value) : '—' }}</p>
          <p class="text-xs text-(--ui-text-muted)">Bought {{ date(row.original.purchaseDate) }}</p>
        </template>
        <template #condition-cell="{ row }">
          <UBadge v-if="row.original.status === 'deprecated'" label="Deprecated" color="neutral" variant="solid" />
          <UBadge v-else :label="row.original.condition" :color="conditionColor[row.original.condition]" variant="subtle" class="capitalize" />
        </template>
        <template #actions-cell="{ row }">
          <div v-if="hasActions" class="flex justify-end">
            <UDropdownMenu :items="rowActions(row.original)" :content="{ align: 'end' }">
              <UButton icon="i-lucide-ellipsis-vertical" size="sm" color="neutral" variant="ghost" :aria-label="`Actions for ${row.original.name}`" />
            </UDropdownMenu>
          </div>
        </template>
        <template #empty><p class="py-6 text-center text-sm text-(--ui-text-muted)">No assets found.</p></template>
      </UTable>

      <ul class="md:hidden divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No assets found.</li>
        <li v-for="a in (loading ? [] : items)" :key="a.id" class="p-4 flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate" :class="a.status === 'deprecated' ? 'line-through text-(--ui-text-muted)' : ''">{{ a.name }}</p>
            <p class="text-xs text-(--ui-text-muted) truncate"><span class="font-mono">{{ a.tag }}</span> · {{ a.category }}</p>
            <p class="text-xs text-(--ui-text-muted) truncate">{{ deptName(a.departmentId) }} · {{ a.location }}</p>
            <div class="mt-2 flex flex-wrap gap-1.5 items-center">
              <UBadge v-if="a.status === 'deprecated'" label="Deprecated" color="neutral" variant="solid" />
              <UBadge v-else :label="a.condition" :color="conditionColor[a.condition]" variant="subtle" class="capitalize" />
              <span v-if="a.value != null" class="text-xs">{{ idr(a.value) }}</span>
            </div>
          </div>
          <UDropdownMenu v-if="hasActions" :items="rowActions(a)" :content="{ align: 'end' }">
            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" class="-mr-2" :aria-label="`Actions for ${a.name}`" />
          </UDropdownMenu>
        </li>
      </ul>

      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} assets</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <AssetFormModal v-model:open="formOpen" :asset="selected" :departments="deptList ?? []" :existing-tags="summary?.tags ?? []" :saving="saving" @submit="onSubmit" />
    <AssetDeprecateModal v-model:open="deprecateOpen" :asset="selected" :saving="saving" @confirm="onDeprecate" />
  </div>
</template>
