<script setup lang="ts">
import type { User, UserInput } from '~/types/user'
import type { Role } from '~/types/rbac'
import type { Department } from '~/types/department'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ user?: User | null; saving?: boolean; roles: Role[]; departments: Department[] }>()
const emit = defineEmits<{ submit: [input: UserInput] }>()

const empty = (): UserInput => ({ name: '', email: '', role: props.roles.find(r => r.key === 'employee')?.key ?? props.roles[0]?.key ?? '', status: 'active', departmentId: null })
const form = reactive<UserInput>(empty())

watch(open, (v) => {
  if (!v) return
  Object.assign(form, props.user
    ? { name: props.user.name, email: props.user.email, role: props.user.role, status: props.user.status, departmentId: props.user.departmentId ?? null }
    : empty())
})

const roleItems = computed(() => [...props.roles].sort((a, b) => b.level - a.level).map(r => ({ label: r.name, value: r.key })))
const NONE = '__none'
const deptItems = computed(() => [{ label: 'No department', value: NONE }, ...props.departments.map(d => ({ label: `${d.name} (${d.code})`, value: d.id }))])
const dept = computed({ get: () => form.departmentId || NONE, set: v => { form.departmentId = v === NONE ? null : v } })
const statuses = ['active', 'inactive']
</script>

<template>
  <UModal v-model:open="open" :title="user ? 'Edit User' : 'Add User'">
    <template #body>
      <form id="user-form" class="space-y-4" @submit.prevent="emit('submit', { ...form })">
        <UFormField label="Name" required><UInput v-model="form.name" class="w-full" /></UFormField>
        <UFormField label="Email" required><UInput v-model="form.email" type="email" class="w-full" /></UFormField>
        <UFormField label="Department"><USelect v-model="dept" :items="deptItems" icon="i-lucide-building-2" class="w-full" /></UFormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Role"><USelect v-model="form.role" :items="roleItems" class="w-full" /></UFormField>
          <UFormField label="Status"><USelect v-model="form.status" :items="statuses" class="w-full" /></UFormField>
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="user-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
