<script setup lang="ts">
import { kindOf, type DocumentFile, type DocumentMeta } from '~/types/document'
import type { Department } from '~/types/department'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ doc: DocumentFile | null; departments: Department[] }>()
const emit = defineEmits<{ changed: [doc: DocumentFile] }>()
const { $api } = useNuxtApp()
const { user } = useAuth()
const { can } = usePermission()
const toast = useToast()

const canChange = computed(() => !!props.doc && (props.doc.uploadedById === user.value?.id || can('documents.manage')))
const previewable = computed(() => props.doc && ['pdf', 'image'].includes(kindOf(props.doc.extension)))
const deptName = (id?: string | null) => (id && props.departments.find(d => d.id === id)?.name) || 'No department'
const when = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

// edit details
const editing = ref(false)
const saving = ref(false)
const form = reactive<DocumentMeta & { tagText: string }>({ title: '', description: '', category: 'other', tags: [], departmentId: null, visibility: 'everyone', tagText: '' })
watch(() => [open.value, props.doc?.id], () => { editing.value = false })
function startEdit() {
  const d = props.doc!
  Object.assign(form, { title: d.title, description: d.description, category: d.category, tags: d.tags, departmentId: d.departmentId ?? null, visibility: d.visibility, tagText: d.tags.join(', ') })
  editing.value = true
}
const { typeOf, items: typeItems } = useDocumentTypes()
const categoryItems = computed(() => typeItems(props.doc?.category))
const NONE = '__none'
const deptItems = computed(() => [{ label: 'No department', value: NONE }, ...props.departments.map(d => ({ label: d.name, value: d.id }))])
const visItems = [{ label: 'Everyone', value: 'everyone' }, { label: 'Department only', value: 'department' }]

async function save() {
  if (!props.doc || !form.title.trim()) return toast.add({ title: 'Title is required', color: 'error' })
  saving.value = true
  try {
    const { tagText, ...meta } = form
    const d = await $api.documents.update(props.doc.id, { ...meta, title: meta.title.trim(), tags: tagText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) })
    toast.add({ title: 'Details saved', color: 'success' })
    editing.value = false
    emit('changed', d)
  } catch (e) { toast.add({ title: 'Save failed', description: (e as Error).message, color: 'error' }) } finally { saving.value = false }
}
async function toggleArchive() {
  if (!props.doc) return
  try {
    const d = props.doc.status === 'archived' ? await $api.documents.restore(props.doc.id) : await $api.documents.archive(props.doc.id)
    toast.add({ title: d.status === 'archived' ? 'Document archived' : 'Document restored', color: 'success' })
    emit('changed', d)
    open.value = false
  } catch (e) { toast.add({ title: 'Failed', description: (e as Error).message, color: 'error' }) }
}
</script>

<template>
  <USlideover v-model:open="open" side="right" :title="doc?.title ?? 'Document'" :ui="{ content: 'w-full sm:max-w-xl' }">
    <template #body>
      <div v-if="doc" class="space-y-5">
        <!-- preview -->
        <div class="rounded-xl border border-(--ui-border) overflow-hidden bg-(--ui-bg-muted)">
          <iframe v-if="previewable && kindOf(doc.extension) === 'pdf'" :src="doc.url" :title="`Preview of ${doc.title}`" class="w-full h-[50vh] bg-white" />
          <img v-else-if="previewable" :src="doc.url" :alt="doc.title" class="w-full max-h-[50vh] object-contain" />
          <div v-else class="p-8 flex flex-col items-center text-center gap-2">
            <DocumentIcon :ext="doc.extension" size="lg" />
            <p class="text-sm text-(--ui-text-muted)">No preview for .{{ doc.extension }} files — download to open.</p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton :to="doc.url" :download="doc.fileName" target="_blank" external icon="i-lucide-download" label="Download" class="flex-1 justify-center" />
          <UButton v-if="previewable" :to="doc.url" target="_blank" external icon="i-lucide-external-link" color="neutral" variant="outline" aria-label="Open in new tab" />
        </div>

        <template v-if="!editing">
          <p v-if="doc.description" class="text-sm whitespace-pre-line">{{ doc.description }}</p>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt class="text-(--ui-text-muted)">Type</dt><dd class="flex items-center gap-1.5"><UIcon :name="typeOf(doc.category).icon" />{{ typeOf(doc.category).name }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Department</dt><dd>{{ deptName(doc.departmentId) }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Visible to</dt><dd>{{ doc.visibility === 'everyone' ? 'Everyone' : 'Department only' }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Size</dt><dd>{{ formatBytes(doc.size) }} · .{{ doc.extension }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Uploaded by</dt><dd>{{ doc.uploadedByName }}</dd></div>
            <div><dt class="text-(--ui-text-muted)">Uploaded</dt><dd>{{ when(doc.createdAt) }}</dd></div>
            <div class="col-span-2"><dt class="text-(--ui-text-muted)">File</dt><dd class="font-mono text-xs break-all">{{ doc.fileName }}</dd></div>
          </dl>
          <div v-if="doc.tags.length" class="flex flex-wrap gap-1.5">
            <UBadge v-for="t in doc.tags" :key="t" :label="t" color="neutral" variant="outline" icon="i-lucide-tag" />
          </div>
          <UAlert v-if="doc.status === 'archived'" icon="i-lucide-archive" color="neutral" variant="subtle" title="Archived" description="Hidden from the library. Restore it to make it available again." />
        </template>

        <form v-else class="space-y-3" @submit.prevent="save">
          <UFormField label="Title" required><UInput v-model="form.title" class="w-full" /></UFormField>
          <UFormField label="Description"><UTextarea v-model="form.description" :rows="2" autoresize class="w-full" /></UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Type"><USelect v-model="form.category" :items="categoryItems" class="w-full" /></UFormField>
            <UFormField label="Department"><USelect :model-value="form.departmentId || NONE" :items="deptItems" class="w-full" @update:model-value="(v: string) => form.departmentId = v === NONE ? null : v" /></UFormField>
            <UFormField label="Visible to"><USelect v-model="form.visibility" :items="visItems" class="w-full" /></UFormField>
            <UFormField label="Tags"><UInput v-model="form.tagText" placeholder="comma separated" class="w-full" /></UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" label="Cancel" @click="editing = false" />
            <UButton type="submit" label="Save" :loading="saving" />
          </div>
        </form>
      </div>
    </template>
    <template v-if="doc && canChange && !editing" #footer>
      <div class="flex gap-2 w-full">
        <UButton icon="i-lucide-pencil" label="Edit details" color="neutral" variant="outline" class="flex-1 justify-center" @click="startEdit" />
        <UButton :icon="doc.status === 'archived' ? 'i-lucide-archive-restore' : 'i-lucide-archive'" :label="doc.status === 'archived' ? 'Restore' : 'Archive'" color="neutral" variant="ghost" @click="toggleArchive" />
      </div>
    </template>
  </USlideover>
</template>
