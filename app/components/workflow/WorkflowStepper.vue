<script setup lang="ts">
import { stepStatusColor, type WorkflowRequest, type StepStatus } from '~/types/workflow'

// Vertical approval chain: requester → each approval level.
defineProps<{ request: WorkflowRequest }>()

const icon: Record<StepStatus, string> = {
  approved: 'i-lucide-check', rejected: 'i-lucide-x', pending: 'i-lucide-hourglass',
  waiting: 'i-lucide-circle-dashed', skipped: 'i-lucide-skip-forward'
}
const ring: Record<StepStatus, string> = {
  approved: 'bg-(--ui-success) text-white', rejected: 'bg-(--ui-error) text-white',
  pending: 'bg-(--ui-warning) text-white ring-4 ring-(--ui-warning)/20',
  waiting: 'bg-(--ui-bg-elevated) text-(--ui-text-muted)', skipped: 'bg-(--ui-bg-elevated) text-(--ui-text-dimmed)'
}
const when = (s?: string) => s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''
</script>

<template>
  <ol class="relative">
    <li class="flex gap-3 pb-6 relative">
      <span class="absolute left-4 top-8 bottom-0 w-px bg-(--ui-border)" aria-hidden="true" />
      <span class="size-8 shrink-0 rounded-full grid place-items-center bg-primary text-white"><UIcon name="i-lucide-send" class="size-4" /></span>
      <div class="min-w-0 pt-1">
        <p class="font-medium text-sm">Submitted by {{ request.requesterName }}</p>
        <p class="text-xs text-(--ui-text-muted)">{{ when(request.createdAt) }}</p>
      </div>
    </li>
    <li v-for="(s, i) in request.steps" :key="s.order" class="flex gap-3 relative" :class="i < request.steps.length - 1 ? 'pb-6' : ''">
      <span v-if="i < request.steps.length - 1" class="absolute left-4 top-8 bottom-0 w-px bg-(--ui-border)" aria-hidden="true" />
      <span class="size-8 shrink-0 rounded-full grid place-items-center" :class="ring[s.status]"><UIcon :name="icon[s.status]" class="size-4" /></span>
      <div class="min-w-0 flex-1 pt-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-medium text-sm" :class="s.status === 'skipped' && 'text-(--ui-text-muted) line-through'">
            Level {{ i + 1 }} · {{ s.roleName }}<span v-if="s.label" class="font-normal text-(--ui-text-muted)"> — {{ s.label }}</span>
          </p>
          <UBadge :label="s.status === 'pending' ? 'waiting for decision' : s.status" :color="stepStatusColor[s.status]" variant="subtle" size="sm" />
        </div>
        <p v-if="s.actorName" class="text-xs text-(--ui-text-muted)">{{ s.actorName }} · {{ when(s.actedAt) }}</p>
        <p v-if="s.status === 'skipped'" class="text-xs text-(--ui-text-muted)">Skipped — requester is already at or above this level.</p>
        <p v-if="s.comment" class="mt-1.5 text-sm rounded-md bg-(--ui-bg-muted) px-3 py-2">“{{ s.comment }}”</p>
      </div>
    </li>
  </ol>
</template>
