<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { User, UserInput } from '~/types/user'

definePageMeta({ permission: 'users.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canManage = computed(() => can('users.manage'))
const { data: roleList } = await useAsyncData('roles.all', () => $api.roles.list({ page: 1, pageSize: 100 }).then(r => r.items).catch(() => []))
const roleName = (k: string) => roleList.value?.find(r => r.key === k)?.name ?? k
const { data: deptList } = await useAsyncData('departments.all', () =>
  can('departments.view') ? $api.departments.list({ page: 1, pageSize: 500 }).then(r => r.items).catch(() => []) : Promise.resolve([]))
const deptName = (id?: string | null) => id ? deptList.value?.find(d => d.id === id)?.name ?? '—' : '—'
const deptFilterItems = computed(() => [
  { label: 'All departments', value: 'all' }, { label: 'Unassigned', value: 'none' },
  ...(deptList.value ?? []).map(d => ({ label: d.name, value: d.id }))
])
const route = useRoute()
const deptFilter = ref((route.query.department as string) || 'all')

const { items, total, loading, saving, query, load, save, remove } = useCrud<User, UserInput>($api.users, 'User', validateUser)

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<User | null>(null)

function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(u: User) { selected.value = u; formOpen.value = true }
function openDelete(u: User) { selected.value = u; deleteOpen.value = true }

async function onSubmit(input: UserInput) {
  if (await save(input, selected.value?.id)) formOpen.value = false
}
async function onDelete() {
  if (!selected.value) return
  await remove(selected.value.id)
  deleteOpen.value = false
}

const columns: TableColumn<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'departmentId', header: 'Department', cell: ({ row }) => deptName(row.original.departmentId) },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('id-ID') },
  { id: 'actions', header: '' }
]

watch(deptFilter, v => { query.departmentId = v === 'all' ? '' : v }, { immediate: true })
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl sm:text-2xl font-semibold">Users</h1>
      <UButton v-if="canManage" icon="i-lucide-plus" label="Add User" :ui="{ label: 'hidden sm:inline' }" :aria-label="'Add User'" @click="openCreate" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border) flex flex-col sm:flex-row gap-2">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search name, email, role…" class="w-full sm:max-w-xs" />
        <USelect v-if="deptList?.length" v-model="deptFilter" :items="deptFilterItems" icon="i-lucide-building-2" class="w-full sm:w-52" aria-label="Filter by department" />
      </div>
      <UTable class="hidden md:block" :data="items" :columns="columns" :loading="loading">
        <template #role-cell="{ row }"><UBadge :label="roleName(row.original.role)" variant="subtle" /></template>
        <template #status-cell="{ row }">
          <UBadge :label="row.original.status" :color="row.original.status === 'active' ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #actions-cell="{ row }">
          <div v-if="canManage" class="flex justify-end gap-1">
            <UButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" @click="openEdit(row.original)" />
            <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" @click="openDelete(row.original)" />
          </div>
        </template>
      </UTable>
      <!-- Mobile card list -->
      <ul class="md:hidden divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-12" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No users found.</li>
        <li v-for="u in (loading ? [] : items)" :key="u.id" class="p-4 flex items-start gap-3">
          <UAvatar :alt="u.name" size="md" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ u.name }}</p>
            <p class="text-sm text-(--ui-text-muted) truncate">{{ u.email }}</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <UBadge :label="roleName(u.role)" variant="subtle" />
              <UBadge v-if="u.departmentId" :label="deptName(u.departmentId)" color="neutral" variant="outline" />
              <UBadge :label="u.status" :color="u.status === 'active' ? 'success' : 'neutral'" variant="subtle" />
            </div>
          </div>
          <div v-if="canManage" class="flex -mr-2">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Edit ${u.name}`" @click="openEdit(u)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${u.name}`" @click="openDelete(u)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} users</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <UserFormModal v-model:open="formOpen" :user="selected" :saving="saving" :roles="roleList ?? []" :departments="deptList ?? []" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="`Delete user ${selected?.name}?`" @confirm="onDelete" />
  </div>
</template>
