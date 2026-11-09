<script setup lang="ts">
import type { WorkflowRequestInput, WorkflowTemplate } from '~/types/workflow'
import type { Role } from '~/types/rbac'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ templates: WorkflowTemplate[]; roles: Role[]; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: WorkflowRequestInput] }>()
const { user } = useAuth()

const empty = (): WorkflowRequestInput => ({ templateId: '', title: '', description: '', amount: undefined })
const form = reactive<WorkflowRequestInput>(empty())
watch(open, v => { if (v) Object.assign(form, empty(), { templateId: props.templates[0]?.id ?? '' }) })

const items = computed(() => props.templates.map(t => ({ label: t.name, value: t.id })))
const template = computed(() => props.templates.find(t => t.id === form.templateId))
const level = (k: string) => props.roles.find(r => r.key === k)?.level ?? 0
const roleName = (k: string) => props.roles.find(r => r.key === k)?.name ?? k
// preview of who will approve, after skipping levels at/below mine
const chain = computed(() => (template.value?.steps ?? []).map(s => ({ ...s, skipped: level(s.roleKey) <= (user.value?.roleLevel ?? 0) })))
</script>

<template>
  <UModal v-model:open="open" title="New workflow request" description="It continues only after every approval level signs off.">
    <template #body>
      <form id="wf-form" class="space-y-4" @submit.prevent="emit('submit', { ...form })">
        <UFormField label="Type" required>
          <USelect v-model="form.templateId" :items="items" class="w-full" placeholder="Choose…" />
        </UFormField>
        <p v-if="template?.description" class="-mt-2 text-xs text-(--ui-text-muted)">{{ template.description }}</p>

        <div v-if="chain.length" class="rounded-lg border border-(--ui-border) p-3">
          <p class="text-xs font-medium text-(--ui-text-muted) mb-2">Approval route</p>
          <div class="flex flex-wrap items-center gap-1.5 text-sm">
            <UBadge :label="`You (${user?.roleName ?? user?.role})`" color="primary" variant="subtle" />
            <template v-for="s in chain" :key="s.roleKey">
              <UIcon name="i-lucide-chevron-right" class="text-(--ui-text-muted)" aria-hidden="true" />
              <UBadge :label="roleName(s.roleKey)" :color="s.skipped ? 'neutral' : 'warning'" variant="subtle" :class="s.skipped && 'line-through opacity-60'" />
            </template>
          </div>
          <p v-if="chain.every(s => s.skipped)" class="mt-2 text-xs text-(--ui-text-muted)">Your level covers every step — this will be approved immediately.</p>
        </div>

        <UFormField label="Title" required><UInput v-model="form.title" class="w-full" placeholder="What needs approval?" /></UFormField>
        <UFormField label="Details"><UTextarea v-model="form.description" :rows="4" autoresize class="w-full" /></UFormField>
        <UFormField label="Amount (IDR)" hint="Optional">
          <UInputNumber v-model="form.amount" :min="0" :step="100000" :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }" class="w-full" />
        </UFormField>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="wf-form" icon="i-lucide-send" label="Submit for approval" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
