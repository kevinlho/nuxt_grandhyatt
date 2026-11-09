<script setup lang="ts">
import type { WorkflowTemplate, WorkflowTemplateInput } from '~/types/workflow'

definePageMeta({ permission: 'workflows.manage' })
const { $api } = useNuxtApp()
const { items, total, loading, saving, query, load, save, remove } = useCrud<WorkflowTemplate, WorkflowTemplateInput>($api.workflowTemplates, 'Approval flow', validateWorkflowTemplate)
const { data: roles } = await useAsyncData('wft.roles', () => $api.roles.list({ page: 1, pageSize: 100 }).then(r => r.items))
const roleName = (k: string) => roles.value?.find(r => r.key === k)?.name ?? k

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<WorkflowTemplate | null>(null)
function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(t: WorkflowTemplate) { selected.value = t; formOpen.value = true }
function openDelete(t: WorkflowTemplate) { selected.value = t; deleteOpen.value = true }
async function onSubmit(input: WorkflowTemplateInput) { if (await save(input, selected.value?.id)) formOpen.value = false }
async function onDelete() { if (selected.value) { await remove(selected.value.id); deleteOpen.value = false } }
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Approval Flows</h1>
        <p class="text-sm text-(--ui-text-muted)">Define who must approve each type of request, level by level.</p>
      </div>
      <UButton icon="i-lucide-plus" label="New flow" :ui="{ label: 'hidden sm:inline' }" aria-label="New flow" @click="openCreate" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search flows…" class="w-full sm:max-w-xs" />
      </div>
      <ul class="divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 3" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No approval flows yet.</li>
        <li v-for="t in (loading ? [] : items)" :key="t.id" class="p-4 flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-medium">{{ t.name }} <UBadge v-if="!t.isActive" label="inactive" color="neutral" variant="subtle" size="sm" class="ml-1" /></p>
            <p v-if="t.description" class="text-sm text-(--ui-text-muted)">{{ t.description }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
              <UBadge label="Requester" color="primary" variant="subtle" />
              <template v-for="(s, i) in t.steps" :key="i">
                <UIcon name="i-lucide-chevron-right" class="text-(--ui-text-muted)" aria-hidden="true" />
                <UBadge :label="`${i + 1}. ${roleName(s.roleKey)}${s.label ? ' — ' + s.label : ''}`" color="neutral" variant="outline" />
              </template>
            </div>
          </div>
          <div class="flex -mr-2">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Edit ${t.name}`" @click="openEdit(t)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${t.name}`" @click="openDelete(t)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) text-sm text-(--ui-text-muted)">{{ total }} flows</div>
    </UCard>

    <WorkflowTemplateModal v-model:open="formOpen" :template="selected" :roles="roles ?? []" :saving="saving" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="`Delete flow ${selected?.name}?`" @confirm="onDelete" />
  </div>
</template>
