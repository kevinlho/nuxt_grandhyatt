<script setup lang="ts">
import type { DocumentType, DocumentTypeInput } from '~/types/document'

definePageMeta({ permission: 'documents.types' })
const { $api } = useNuxtApp()
const { items, total, loading, saving, query, load, save, remove } = useCrud<DocumentType, DocumentTypeInput>($api.documentTypes, 'Document type', validateDocumentType)
query.pageSize = 50
const { refresh: refreshShared } = useDocumentTypes()

// how many documents use each type (all statuses)
const { data: usage, refresh: refreshUsage } = await useAsyncData('doctypes.usage', async () => {
  const [a, b] = await Promise.all([$api.documents.counts({ status: 'active' }), $api.documents.counts({ status: 'archived' })])
  const out: Record<string, number> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v
  return out
})
const used = (key: string) => usage.value?.[key] ?? 0

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<DocumentType | null>(null)
function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(t: DocumentType) { selected.value = t; formOpen.value = true }
function openDelete(t: DocumentType) { selected.value = t; deleteOpen.value = true }
async function onSubmit(input: DocumentTypeInput) {
  if (await save(input, selected.value?.id)) { formOpen.value = false; refreshShared() }
}
async function onDelete() {
  if (!selected.value) return
  await remove(selected.value.id)
  deleteOpen.value = false
  refreshShared(); refreshUsage()
}
async function toggleActive(t: DocumentType) {
  const { id: _i, createdAt: _c, ...rest } = t
  if (await save({ ...rest, isActive: !t.isActive }, t.id)) refreshShared()
}
const deleteMessage = computed(() => {
  const n = selected.value ? used(selected.value.key) : 0
  return n ? `${n} document(s) use “${selected.value?.name}”. Move them to another type or deactivate this one instead.` : `Delete document type “${selected.value?.name}”?`
})
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <UButton to="/documents" icon="i-lucide-arrow-left" label="Documents" color="neutral" variant="ghost" class="-ml-2" />
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold">Document Types</h1>
        <p class="text-sm text-(--ui-text-muted)">How uploads are sorted. Keywords in a file name pick the type automatically.</p>
      </div>
      <UButton icon="i-lucide-plus" label="New type" :ui="{ label: 'hidden sm:inline' }" aria-label="New document type" @click="openCreate" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search types…" class="w-full sm:max-w-xs" />
      </div>
      <ul class="divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 5" :key="`sk${i}`" class="p-4"><USkeleton class="h-12" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No document types.</li>
        <li v-for="t in (loading ? [] : items)" :key="t.id" class="p-4 flex items-start gap-3" :class="!t.isActive && 'opacity-60'">
          <div class="size-10 shrink-0 rounded-lg bg-primary/10 grid place-items-center"><UIcon :name="t.icon" class="size-5 text-primary" /></div>
          <div class="flex-1 min-w-0">
            <p class="font-medium">
              {{ t.name }} <span class="font-mono text-xs text-(--ui-text-muted)">{{ t.key }}</span>
              <UBadge v-if="!t.isActive" label="inactive" color="neutral" variant="subtle" size="sm" class="ml-1" />
            </p>
            <p v-if="t.description" class="text-sm text-(--ui-text-muted)">{{ t.description }}</p>
            <div class="mt-2 flex flex-wrap gap-1.5 items-center">
              <UButton :to="`/documents?category=${t.key}`" size="xs" variant="soft" color="neutral" icon="i-lucide-files" :label="`${used(t.key)} documents`" />
              <UBadge v-for="k in t.keywords.slice(0, 6)" :key="k" :label="k" color="neutral" variant="outline" size="sm" />
              <span v-if="t.keywords.length > 6" class="text-xs text-(--ui-text-muted)">+{{ t.keywords.length - 6 }}</span>
              <span v-if="!t.keywords.length" class="text-xs text-(--ui-text-muted)">No keywords</span>
            </div>
          </div>
          <div class="flex -mr-2">
            <UButton :icon="t.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'" color="neutral" variant="ghost" :aria-label="t.isActive ? `Deactivate ${t.name}` : `Activate ${t.name}`" @click="toggleActive(t)" />
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Edit ${t.name}`" @click="openEdit(t)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${t.name}`" @click="openDelete(t)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) text-sm text-(--ui-text-muted)">{{ total }} types</div>
    </UCard>

    <DocumentTypeFormModal v-model:open="formOpen" :type="selected" :in-use="selected ? used(selected.key) : 0" :saving="saving" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="deleteMessage" @confirm="onDelete" />
  </div>
</template>
