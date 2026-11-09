<script setup lang="ts">
import type { Role, RoleInput } from '~/types/rbac'

definePageMeta({ permission: 'roles.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canManage = computed(() => can('roles.manage'))
const { items, total, loading, saving, query, load, save, remove } = useCrud<Role, RoleInput>($api.roles, 'Role', validateRole)
query.pageSize = 50

const { data: userList, refresh: refreshUsers } = await useAsyncData('roles.users', () =>
  can('users.view') ? $api.users.list({ page: 1, pageSize: 1000 }).then(r => r.items) : Promise.resolve([]))
const memberCount = (key: string) => userList.value?.filter(u => u.role === key).length ?? 0
const sorted = computed(() => [...items.value].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)))
// the approval ladder = roles with level > 0, junior → senior
const ladder = computed(() => sorted.value.filter(r => r.level > 0 && !r.permissions.includes('*')).reverse())

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<Role | null>(null)
function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(r: Role) { selected.value = r; formOpen.value = true }
function openDelete(r: Role) { selected.value = r; deleteOpen.value = true }
async function onSubmit(input: RoleInput) { if (await save(input, selected.value?.id)) { formOpen.value = false; refreshUsers() } }
async function onDelete() { if (selected.value) { await remove(selected.value.id); deleteOpen.value = false } }

const permSummary = (r: Role) => r.permissions.includes('*') ? 'All permissions' : `${r.permissions.length} permissions`
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Roles & Access</h1>
        <p class="text-sm text-(--ui-text-muted)">What each role can do, and where it sits in the approval hierarchy.</p>
      </div>
      <UButton v-if="canManage" icon="i-lucide-plus" label="Add Role" :ui="{ label: 'hidden sm:inline' }" aria-label="Add Role" @click="openCreate" />
    </div>

    <UCard v-if="ladder.length">
      <p class="text-sm font-medium mb-3">Approval hierarchy</p>
      <ol class="flex flex-wrap items-center gap-2 text-sm">
        <template v-for="(r, i) in ladder" :key="r.id">
          <li><UBadge :label="`${r.name} · L${r.level}`" variant="subtle" size="lg" /></li>
          <UIcon v-if="i < ladder.length - 1" name="i-lucide-chevron-right" class="text-(--ui-text-muted)" aria-hidden="true" />
        </template>
      </ol>
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search roles…" class="w-full sm:max-w-xs" />
      </div>
      <ul class="divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-12" /></li>
        <li v-else-if="!sorted.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No roles found.</li>
        <li v-for="r in (loading ? [] : sorted)" :key="r.id" class="p-4 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-primary/10 shrink-0">
            <UIcon :name="r.permissions.includes('*') ? 'i-lucide-crown' : 'i-lucide-shield'" class="size-5 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium">{{ r.name }} <span class="font-mono text-xs text-(--ui-text-muted)">{{ r.key }}</span></p>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <UBadge :label="r.level ? `Level ${r.level}` : 'No approval level'" color="neutral" variant="subtle" />
              <UBadge :label="permSummary(r)" variant="subtle" />
              <UBadge v-if="can('users.view')" :label="`${memberCount(r.key)} users`" color="neutral" variant="outline" />
              <UBadge v-if="r.isSystem" label="system" color="warning" variant="subtle" />
            </div>
          </div>
          <div class="flex -mr-2">
            <UButton :icon="canManage ? 'i-lucide-pencil' : 'i-lucide-eye'" color="neutral" variant="ghost" :aria-label="`Open ${r.name}`" @click="openEdit(r)" />
            <UButton v-if="canManage && !r.isSystem" icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${r.name}`" @click="openDelete(r)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) text-sm text-(--ui-text-muted)">{{ total }} roles</div>
    </UCard>

    <RoleFormModal v-model:open="formOpen" :role="selected" :saving="saving" :readonly="!canManage" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="`Delete role ${selected?.name}?`" @confirm="onDelete" />
  </div>
</template>
