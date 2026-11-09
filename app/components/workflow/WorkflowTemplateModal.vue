<script setup lang="ts">
import type { WorkflowTemplate, WorkflowTemplateInput } from '~/types/workflow'
import type { Role } from '~/types/rbac'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ template?: WorkflowTemplate | null; roles: Role[]; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: WorkflowTemplateInput] }>()

const empty = (): WorkflowTemplateInput => ({ name: '', description: '', isActive: true, steps: [{ roleKey: '', label: '' }] })
const form = reactive<WorkflowTemplateInput>(empty())
watch(open, (v) => {
  if (!v) return
  const t = props.template
  Object.assign(form, t ? { name: t.name, description: t.description, isActive: t.isActive, steps: t.steps.map(s => ({ ...s })) } : empty())
})

const approverRoles = computed(() => props.roles.filter(r => r.level > 0 && !r.permissions.includes('*')).sort((a, b) => a.level - b.level))
const roleItems = computed(() => approverRoles.value.map(r => ({ label: `${r.name} (L${r.level})`, value: r.key })))
const level = (k: string) => props.roles.find(r => r.key === k)?.level ?? 0
const outOfOrder = computed(() => form.steps.some((s, i) => i > 0 && s.roleKey && level(s.roleKey) <= level(form.steps[i - 1]!.roleKey)))

function add() {
  const last = form.steps.at(-1)
  const next = approverRoles.value.find(r => r.level > level(last?.roleKey ?? '') && !form.steps.some(s => s.roleKey === r.key))
  form.steps.push({ roleKey: next?.key ?? '', label: '' })
}
const move = (i: number, d: -1 | 1) => { const s = form.steps; [s[i], s[i + d]] = [s[i + d]!, s[i]!] }
function submit() { emit('submit', { ...form, steps: form.steps.map(s => ({ roleKey: s.roleKey, label: s.label?.trim() || undefined })) }) }
</script>

<template>
  <UModal v-model:open="open" :title="template ? 'Edit approval flow' : 'New approval flow'" :ui="{ content: 'sm:max-w-xl' }">
    <template #body>
      <form id="wft-form" class="space-y-4" @submit.prevent="submit">
        <UFormField label="Name" required><UInput v-model="form.name" class="w-full" placeholder="e.g. Purchase Request" /></UFormField>
        <UFormField label="Description"><UTextarea v-model="form.description" :rows="2" autoresize class="w-full" /></UFormField>
        <USwitch v-model="form.isActive" label="Active" description="Inactive flows can't receive new requests." />

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">Approval levels <span class="text-(--ui-text-muted) font-normal">(in order)</span></p>
            <UButton icon="i-lucide-plus" size="xs" variant="soft" label="Add level" @click="add" />
          </div>
          <div v-for="(s, i) in form.steps" :key="i" class="flex items-center gap-2 rounded-lg border border-(--ui-border) p-2">
            <span class="size-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center">{{ i + 1 }}</span>
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              <USelect v-model="s.roleKey" :items="roleItems" placeholder="Approver role" class="w-full" :aria-label="`Level ${i + 1} role`" />
              <UInput v-model="s.label" placeholder="Label (optional)" class="w-full" :aria-label="`Level ${i + 1} label`" />
            </div>
            <div class="flex flex-col sm:flex-row">
              <UButton icon="i-lucide-arrow-up" size="xs" color="neutral" variant="ghost" :disabled="i === 0" aria-label="Move up" @click="move(i, -1)" />
              <UButton icon="i-lucide-arrow-down" size="xs" color="neutral" variant="ghost" :disabled="i === form.steps.length - 1" aria-label="Move down" @click="move(i, 1)" />
            </div>
            <UButton icon="i-lucide-x" size="xs" color="error" variant="ghost" :disabled="form.steps.length === 1" aria-label="Remove level" @click="form.steps.splice(i, 1)" />
          </div>
          <UAlert v-if="outOfOrder" color="warning" variant="soft" icon="i-lucide-triangle-alert"
            description="Levels usually go junior → senior. A senior role before a junior one will make the junior step get skipped for senior requesters." />
          <p class="text-xs text-(--ui-text-muted)">Levels at or below the requester's own level are skipped automatically.</p>
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="wft-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
