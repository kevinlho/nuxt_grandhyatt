<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { workflowStatusColor, type WorkflowRequest, type WorkflowRequestInput, type WorkflowScope, type WorkflowStatus } from '~/types/workflow'

definePageMeta({ permission: ['workflows.create', 'workflows.approve', 'workflows.view_all'] })
const { $api } = useNuxtApp()
const { can } = usePermission()
const toast = useToast()
const route = useRoute()

const tabs = computed(() => [
  can('workflows.approve') && { label: 'Waiting for me', value: 'inbox', icon: 'i-lucide-inbox' },
  can('workflows.create') && { label: 'My requests', value: 'mine', icon: 'i-lucide-send' },
  can('workflows.view_all') && { label: 'All', value: 'all', icon: 'i-lucide-list' }
].filter(Boolean) as { label: string; value: WorkflowScope; icon: string }[])

const query = reactive({ page: 1, pageSize: 10, search: '', status: 'all' as WorkflowStatus | 'all', scope: (route.query.scope as WorkflowScope) || tabs.value[0]!.value })
const statusItems = [{ label: 'Any status', value: 'all' }, ...(['pending', 'approved', 'rejected', 'cancelled', 'completed'] as const).map(s => ({ label: s, value: s }))]

const items = ref<WorkflowRequest[]>([])
const total = ref(0)
const loading = ref(false)
async function load() {
  loading.value = true
  try {
    const r = await $api.workflows.list({ ...query, status: query.status === 'all' ? '' : query.status })
    items.value = r.items; total.value = r.total
  } catch (e) {
    toast.add({ title: 'Failed to load requests', description: (e as Error).message, color: 'error' })
  } finally { loading.value = false }
}
let t: ReturnType<typeof setTimeout>
watch(() => query.search, () => { clearTimeout(t); t = setTimeout(() => { query.page = 1; load() }, 300) })
watch(() => [query.scope, query.status], () => { query.page = 1; load(); navigateTo({ query: { scope: query.scope } }, { replace: true }) })
watch(() => query.page, load)
onMounted(load)

// new request
const formOpen = ref(false)
const saving = ref(false)
const { data: refs } = await useAsyncData('workflow.refs', async () => {
  const [tp, rl] = await Promise.all([
    $api.workflowTemplates.list({ page: 1, pageSize: 100 }),
    $api.roles.list({ page: 1, pageSize: 100 }).catch(() => ({ items: [] }))
  ])
  return { templates: tp.items.filter(x => x.isActive), roles: rl.items }
})
async function onSubmit(input: WorkflowRequestInput) {
  const invalid = validateWorkflowRequest(input)
  if (invalid) return toast.add({ title: 'Cannot submit', description: invalid, color: 'error' })
  saving.value = true
  try {
    const r = await $api.workflows.submit(input)
    toast.add({ title: `${r.code} submitted`, description: r.status === 'approved' ? 'Approved automatically.' : `Waiting for ${currentStepOf(r)?.roleName}.`, color: 'success' })
    formOpen.value = false
    // let the modal finish its leave transition before the page unmounts
    query.scope = 'mine'
    setTimeout(() => navigateTo(`/workflows/${r.id}`), 250)
  } catch (e) {
    toast.add({ title: 'Submit failed', description: (e as Error).message, color: 'error' })
  } finally { saving.value = false }
}

const waitingOn = (r: WorkflowRequest) => r.status === 'pending' ? currentStepOf(r)?.roleName : undefined
const progress = (r: WorkflowRequest) => {
  const real = r.steps.filter(s => s.status !== 'skipped')
  return `${real.filter(s => s.status === 'approved').length}/${real.length}`
}
const date = (s: string) => new Date(s).toLocaleDateString('id-ID')
const columns: TableColumn<WorkflowRequest>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'title', header: 'Request' },
  { accessorKey: 'requesterName', header: 'Requester' },
  { id: 'progress', header: 'Approvals' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'updatedAt', header: 'Updated', cell: ({ row }) => date(row.original.updatedAt) },
  { id: 'actions', header: '' }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Workflows</h1>
        <p class="text-sm text-(--ui-text-muted)">Requests move forward only after each approval level signs off.</p>
      </div>
      <UButton v-if="can('workflows.create')" icon="i-lucide-plus" label="New request" :ui="{ label: 'hidden sm:inline' }" aria-label="New request" @click="formOpen = true" />
    </div>

    <UTabs v-if="tabs.length > 1" v-model="query.scope" :items="tabs" :content="false" class="w-full sm:w-fit" />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border) flex flex-col sm:flex-row gap-2">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search code, title, requester…" class="w-full sm:max-w-xs" />
        <USelect v-model="query.status" :items="statusItems" class="w-full sm:w-44 capitalize" />
      </div>

      <UTable class="hidden md:block" :data="items" :columns="columns" :loading="loading">
        <template #code-cell="{ row }"><span class="font-mono text-sm">{{ row.original.code }}</span></template>
        <template #title-cell="{ row }">
          <p class="font-medium">{{ row.original.title }}</p>
          <p class="text-xs text-(--ui-text-muted)">{{ row.original.templateName }}<template v-if="row.original.amount"> · {{ idr(row.original.amount) }}</template></p>
        </template>
        <template #progress-cell="{ row }">
          <span class="text-sm">{{ progress(row.original) }}</span>
          <span v-if="waitingOn(row.original)" class="text-xs text-(--ui-text-muted)"> · next: {{ waitingOn(row.original) }}</span>
        </template>
        <template #status-cell="{ row }"><UBadge :label="row.original.status" :color="workflowStatusColor[row.original.status]" variant="subtle" /></template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton :label="query.scope === 'inbox' ? 'Review' : undefined" :icon="query.scope === 'inbox' ? undefined : 'i-lucide-chevron-right'" size="sm" :variant="query.scope === 'inbox' ? 'soft' : 'ghost'" color="neutral" :to="`/workflows/${row.original.id}`" :aria-label="`Open ${row.original.code}`" />
          </div>
        </template>
        <template #empty><p class="py-6 text-center text-sm text-(--ui-text-muted)">{{ query.scope === 'inbox' ? 'Nothing waiting for your approval.' : 'No requests found.' }}</p></template>
      </UTable>

      <ul class="md:hidden divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">{{ query.scope === 'inbox' ? 'Nothing waiting for your approval.' : 'No requests found.' }}</li>
        <li v-for="r in (loading ? [] : items)" :key="r.id">
          <NuxtLink :to="`/workflows/${r.id}`" class="p-4 flex items-start gap-3 active:bg-(--ui-bg-elevated)">
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ r.title }}</p>
              <p class="text-xs text-(--ui-text-muted) truncate"><span class="font-mono">{{ r.code }}</span> · {{ r.requesterName }} · {{ date(r.updatedAt) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5 items-center">
                <UBadge :label="r.status" :color="workflowStatusColor[r.status]" variant="subtle" />
                <span class="text-xs text-(--ui-text-muted)">{{ progress(r) }} approved<template v-if="waitingOn(r)"> · next: {{ waitingOn(r) }}</template></span>
              </div>
            </div>
            <UIcon name="i-lucide-chevron-right" class="mt-1 text-(--ui-text-muted)" />
          </NuxtLink>
        </li>
      </ul>

      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} requests</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <WorkflowRequestModal v-model:open="formOpen" :templates="refs?.templates ?? []" :roles="refs?.roles ?? []" :saving="saving" @submit="onSubmit" />
  </div>
</template>
