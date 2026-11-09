<script setup lang="ts">
import { workflowStatusColor, type WorkflowRequest } from '~/types/workflow'

definePageMeta({ permission: ['workflows.create', 'workflows.approve', 'workflows.view_all'] })
const { $api } = useNuxtApp()
const { user } = useAuth()
const toast = useToast()
const route = useRoute()
const id = route.params.id as string

const req = ref<WorkflowRequest | null>(null)
const error = ref('')
async function load() {
  try { req.value = await $api.workflows.get(id) } catch (e) { error.value = (e as Error).message }
}
onMounted(load)

const mayDecide = computed(() => !!req.value && canDecide(req.value, user.value))
const mayCancel = computed(() => !!req.value && canCancel(req.value, user.value))
const mayComplete = computed(() => !!req.value && canComplete(req.value, user.value))
const step = computed(() => req.value && currentStepOf(req.value))

type Action = 'approve' | 'reject' | 'cancel' | 'complete'
const action = ref<Action | null>(null)
const comment = ref('')
const busy = ref(false)
const actionCopy: Record<Action, { title: string; button: string; color: 'success' | 'error' | 'neutral' | 'primary'; needsReason?: boolean }> = {
  approve: { title: 'Approve request', button: 'Approve', color: 'success' },
  reject: { title: 'Reject request', button: 'Reject', color: 'error', needsReason: true },
  cancel: { title: 'Cancel request', button: 'Cancel request', color: 'neutral' },
  complete: { title: 'Mark as completed', button: 'Complete', color: 'primary' }
}
function ask(a: Action) { action.value = a; comment.value = '' }
async function run() {
  const a = action.value
  if (!a || !req.value) return
  if (actionCopy[a].needsReason && !comment.value.trim()) return toast.add({ title: 'Please give a reason', color: 'error' })
  busy.value = true
  try {
    const c = comment.value.trim() || undefined
    req.value = a === 'approve' ? await $api.workflows.approve(id, c)
      : a === 'reject' ? await $api.workflows.reject(id, c!)
      : a === 'cancel' ? await $api.workflows.cancel(id)
      : await $api.workflows.complete(id, c)
    const next = currentStepOf(req.value)
    toast.add({ title: `${req.value.code} ${a === 'approve' ? 'approved' : a === 'reject' ? 'rejected' : a === 'cancel' ? 'cancelled' : 'completed'}`,
      description: next ? `Now waiting for ${next.roleName}.` : undefined, color: a === 'reject' ? 'warning' : 'success' })
    action.value = null
    useState('workflow.inbox').value = await $api.workflows.inboxCount().catch(() => 0)
  } catch (e) {
    toast.add({ title: 'Action failed', description: (e as Error).message, color: 'error' })
  } finally { busy.value = false }
}

const banner = computed(() => {
  const r = req.value
  if (!r) return null
  if (r.status === 'pending') return mayDecide.value
    ? { color: 'warning' as const, icon: 'i-lucide-hand', title: 'Your decision is needed', text: `You are approving as ${step.value?.roleName}.` }
    : { color: 'warning' as const, icon: 'i-lucide-hourglass', title: `Waiting for ${step.value?.roleName}`, text: 'This request cannot continue until every level approves.' }
  if (r.status === 'approved') return { color: 'success' as const, icon: 'i-lucide-badge-check', title: 'Fully approved — you can continue', text: mayComplete.value ? 'Mark it completed once the work is done.' : '' }
  if (r.status === 'rejected') return { color: 'error' as const, icon: 'i-lucide-circle-x', title: 'Rejected', text: r.steps.find(s => s.status === 'rejected')?.comment ?? '' }
  if (r.status === 'completed') return { color: 'info' as const, icon: 'i-lucide-flag', title: 'Completed', text: '' }
  return { color: 'neutral' as const, icon: 'i-lucide-ban', title: 'Cancelled by requester', text: '' }
})
const when = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="space-y-4 max-w-4xl">
    <UButton to="/workflows" icon="i-lucide-arrow-left" label="Workflows" color="neutral" variant="ghost" class="-ml-2" />

    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <USkeleton v-else-if="!req" class="h-64" />

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-(--ui-text-muted)"><span class="font-mono">{{ req.code }}</span> · {{ req.templateName }}</p>
          <h1 class="text-xl sm:text-2xl font-semibold break-words">{{ req.title }}</h1>
        </div>
        <UBadge :label="req.status" :color="workflowStatusColor[req.status]" variant="subtle" size="lg" class="self-start capitalize" />
      </div>

      <UAlert v-if="banner" :color="banner.color" :icon="banner.icon" variant="subtle" :title="banner.title" :description="banner.text || undefined" />

      <div v-if="mayDecide || mayCancel || mayComplete" class="flex flex-col sm:flex-row gap-2">
        <UButton v-if="mayDecide" icon="i-lucide-check" label="Approve" color="success" class="justify-center" @click="ask('approve')" />
        <UButton v-if="mayDecide" icon="i-lucide-x" label="Reject" color="error" variant="soft" class="justify-center" @click="ask('reject')" />
        <UButton v-if="mayComplete" icon="i-lucide-flag" label="Mark completed" class="justify-center" @click="ask('complete')" />
        <UButton v-if="mayCancel" icon="i-lucide-ban" label="Cancel request" color="neutral" variant="outline" class="justify-center sm:ml-auto" @click="ask('cancel')" />
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <UCard class="lg:col-span-3">
          <template #header><h2 class="font-semibold">Details</h2></template>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt class="text-(--ui-text-muted)">Requester</dt><dd class="font-medium">{{ req.requesterName }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Submitted</dt><dd>{{ when(req.createdAt) }}</dd></div>
            <div v-if="req.amount != null"><dt class="text-(--ui-text-muted)">Amount</dt><dd class="font-medium">{{ idr(req.amount) }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Last update</dt><dd>{{ when(req.updatedAt) }}</dd></div>
          </dl>
          <p v-if="req.description" class="mt-4 text-sm whitespace-pre-line">{{ req.description }}</p>
        </UCard>
        <UCard class="lg:col-span-2">
          <template #header><h2 class="font-semibold">Approval chain</h2></template>
          <WorkflowStepper :request="req" />
        </UCard>
      </div>

      <UCard>
        <template #header><h2 class="font-semibold">Activity</h2></template>
        <ul class="space-y-2 text-sm">
          <li v-for="(h, i) in [...req.history].reverse()" :key="i" class="flex gap-2">
            <span class="text-(--ui-text-muted) shrink-0 w-36">{{ when(h.at) }}</span>
            <span><b>{{ h.actorName }}</b> {{ h.action }}<template v-if="h.comment"> — “{{ h.comment }}”</template></span>
          </li>
        </ul>
      </UCard>
    </template>

    <UModal :open="!!action" :title="action ? actionCopy[action].title : ''" @update:open="v => { if (!v) action = null }">
      <template #body>
        <UFormField v-if="action !== 'cancel'" :label="action === 'reject' ? 'Reason' : 'Comment'" :required="action === 'reject'" :hint="action === 'reject' ? undefined : 'Optional'">
          <UTextarea v-model="comment" :rows="3" autoresize class="w-full" autofocus />
        </UFormField>
        <p v-else>The request will stop and approvers will no longer see it.</p>
      </template>
      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" label="Back" class="justify-center" @click="action = null" />
          <UButton v-if="action" :color="actionCopy[action].color" :label="actionCopy[action].button" :loading="busy" class="justify-center" @click="run" />
        </div>
      </template>
    </UModal>
  </div>
</template>
