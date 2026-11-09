<script setup lang="ts">
import type { Department, DepartmentInput } from '~/types/department'
import type { User } from '~/types/user'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ department?: Department | null; users: User[]; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: DepartmentInput] }>()

const NONE = '__none'
const empty = (): DepartmentInput => ({ code: '', name: '', description: '', headUserId: undefined })
const form = reactive<DepartmentInput>(empty())
watch(open, (v) => {
  if (!v) return
  const d = props.department
  Object.assign(form, d ? { code: d.code, name: d.name, description: d.description, headUserId: d.headUserId } : empty())
})
// suggest a code from the name for new departments
watch(() => form.name, (n) => {
  if (props.department) return
  form.code = n.split(/[\s&]+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 6)
})

// department head: prefer members of this department, but allow anyone active
const headItems = computed(() => [
  { label: 'No head', value: NONE },
  ...props.users.filter(u => u.status === 'active')
    .sort((a, b) => Number(b.departmentId === props.department?.id) - Number(a.departmentId === props.department?.id) || a.name.localeCompare(b.name))
    .map(u => ({ label: `${u.name} · ${u.email}`, value: u.id }))
])
const head = computed({ get: () => form.headUserId || NONE, set: v => { form.headUserId = v === NONE ? undefined : v } })
</script>

<template>
  <UModal v-model:open="open" :title="department ? 'Edit Department' : 'Add Department'">
    <template #body>
      <form id="dept-form" class="space-y-4" @submit.prevent="emit('submit', { ...form, code: form.code.trim().toUpperCase() })">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField label="Name" required class="sm:col-span-2"><UInput v-model="form.name" class="w-full" placeholder="e.g. Food & Beverage" /></UFormField>
          <UFormField label="Code" required><UInput v-model="form.code" class="w-full font-mono uppercase" placeholder="FNB" maxlength="10" /></UFormField>
        </div>
        <UFormField label="Description"><UTextarea v-model="form.description" :rows="2" autoresize class="w-full" /></UFormField>
        <UFormField label="Department head" hint="Optional">
          <USelectMenu v-model="head" :items="headItems" value-key="value" class="w-full" :search-input="{ placeholder: 'Search people…' }" />
        </UFormField>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="dept-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
