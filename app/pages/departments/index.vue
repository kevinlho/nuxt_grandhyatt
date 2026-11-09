<script setup lang="ts">
import type { Department, DepartmentInput } from '~/types/department'

definePageMeta({ permission: 'departments.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canManage = computed(() => can('departments.manage'))
const { items, total, loading, saving, query, load, save, remove } = useCrud<Department, DepartmentInput>($api.departments, 'Department', validateDepartment)

// users power member counts + the head picker
const { data: userList, refresh: refreshUsers } = await useAsyncData('departments.users', () =>
  can('users.view') ? $api.users.list({ page: 1, pageSize: 1000 }).then(r => r.items).catch(() => []) : Promise.resolve([]))
const members = (id: string) => userList.value?.filter(u => u.departmentId === id) ?? []
const headName = (id?: string) => id ? userList.value?.find(u => u.id === id)?.name : undefined
const unassigned = computed(() => userList.value?.filter(u => !u.departmentId).length ?? 0)

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<Department | null>(null)
function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(d: Department) { selected.value = d; formOpen.value = true }
function openDelete(d: Department) { selected.value = d; deleteOpen.value = true }
async function onSubmit(input: DepartmentInput) { if (await save(input, selected.value?.id)) formOpen.value = false }
async function onDelete() {
  if (!selected.value) return
  await remove(selected.value.id)
  deleteOpen.value = false
  refreshUsers()
}
const deleteMessage = computed(() => {
  const n = selected.value ? members(selected.value.id).length : 0
  return n
    ? `${selected.value?.name} still has ${n} member(s). Move them to another department first.`
    : `Delete department ${selected.value?.name}?`
})
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Departments</h1>
        <p class="text-sm text-(--ui-text-muted)">
          Organisational units every user belongs to.
          <NuxtLink v-if="unassigned" to="/users?department=none" class="text-primary underline-offset-2 hover:underline">{{ unassigned }} users unassigned</NuxtLink>
        </p>
      </div>
      <UButton v-if="canManage" icon="i-lucide-plus" label="Add Department" :ui="{ label: 'hidden sm:inline' }" aria-label="Add Department" @click="openCreate" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search name or code…" class="w-full sm:max-w-xs" />
      </div>
      <ul class="divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No departments yet.</li>
        <li v-for="d in (loading ? [] : items)" :key="d.id" class="p-4 flex items-start gap-3">
          <div class="size-10 shrink-0 rounded-lg bg-primary/10 text-primary grid place-items-center font-mono text-xs font-semibold">{{ d.code }}</div>
          <div class="flex-1 min-w-0">
            <p class="font-medium">{{ d.name }}</p>
            <p v-if="d.description" class="text-sm text-(--ui-text-muted)">{{ d.description }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <UBadge v-if="headName(d.headUserId)" :label="`Head: ${headName(d.headUserId)}`" icon="i-lucide-user-star" color="neutral" variant="subtle" />
              <UButton v-if="can('users.view')" :to="`/users?department=${d.id}`" size="xs" variant="soft" color="neutral" icon="i-lucide-users" :label="`${members(d.id).length} members`" />
              <UAvatarGroup v-if="members(d.id).length" size="2xs" :max="5">
                <UAvatar v-for="u in members(d.id)" :key="u.id" :alt="u.name" />
              </UAvatarGroup>
            </div>
          </div>
          <div v-if="canManage" class="flex -mr-2">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Edit ${d.name}`" @click="openEdit(d)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${d.name}`" @click="openDelete(d)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} departments</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <DepartmentFormModal v-model:open="formOpen" :department="selected" :users="userList ?? []" :saving="saving" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="deleteMessage" @confirm="onDelete" />
  </div>
</template>
