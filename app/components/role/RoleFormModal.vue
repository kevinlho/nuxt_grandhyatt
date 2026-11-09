<script setup lang="ts">
import { PERMISSIONS, PERMISSION_GROUPS, type Permission, type PermissionGrant, type Role, type RoleInput } from '~/types/rbac'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ role?: Role | null; saving?: boolean; readonly?: boolean }>()
const emit = defineEmits<{ submit: [input: RoleInput] }>()

const empty = (): RoleInput => ({ key: '', name: '', level: 1, permissions: [] })
const form = reactive<RoleInput>(empty())
const isSuper = computed(() => form.permissions.includes('*'))

watch(open, (v) => {
  if (!v) return
  Object.assign(form, props.role
    ? { key: props.role.key, name: props.role.name, level: props.role.level, permissions: [...props.role.permissions] }
    : empty())
})
// suggest a key from the name for new roles
watch(() => form.name, (n) => { if (!props.role) form.key = n.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') })

const has = (p: Permission) => isSuper.value || form.permissions.includes(p)
function toggle(p: Permission, on: boolean) {
  const set = new Set<PermissionGrant>(form.permissions)
  on ? set.add(p) : set.delete(p)
  form.permissions = [...set]
}
function toggleGroup(keys: Permission[], on: boolean) { keys.forEach(k => toggle(k, on)) }
</script>

<template>
  <UModal v-model:open="open" :title="readonly ? role?.name : role ? 'Edit Role' : 'Add Role'" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <form id="role-form" class="space-y-5" @submit.prevent="emit('submit', { ...form, permissions: [...form.permissions] })">
        <fieldset :disabled="readonly" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField label="Name" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Key" required :help="role?.isSystem ? 'System role' : 'Stored on the user'">
            <UInput v-model="form.key" class="w-full font-mono" :disabled="role?.isSystem" />
          </UFormField>
          <UFormField label="Approval level" help="Higher = more senior">
            <UInputNumber v-model="form.level" :min="0" :max="99" class="w-full" />
          </UFormField>
        </fieldset>

        <UAlert v-if="isSuper" icon="i-lucide-crown" color="primary" variant="soft" title="Full access" description="This role has every permission, including approving any workflow step." />

        <div v-else class="space-y-3">
          <p class="text-sm font-medium">Permissions</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="g in PERMISSION_GROUPS" :key="g.label" class="rounded-lg border border-(--ui-border) p-3 space-y-2">
              <UCheckbox
                :label="g.label" :disabled="readonly" :ui="{ label: 'font-semibold' }"
                :model-value="g.keys.every(has) ? true : g.keys.some(has) ? 'indeterminate' : false"
                @update:model-value="v => toggleGroup(g.keys, v === true)"
              />
              <div class="pl-6 space-y-1.5">
                <UCheckbox
                  v-for="k in g.keys" :key="k" :disabled="readonly"
                  :label="PERMISSIONS[k]" :description="k" :model-value="has(k)"
                  @update:model-value="v => toggle(k, v === true)"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" :label="readonly ? 'Close' : 'Cancel'" class="justify-center" @click="open = false" />
        <UButton v-if="!readonly" type="submit" form="role-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
