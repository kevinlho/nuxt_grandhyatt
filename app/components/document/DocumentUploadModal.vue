<script setup lang="ts">
import { DOC_LIMITS, type DocumentUpload, type DocVisibility } from '~/types/document'
import type { Department } from '~/types/department'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ departments: Department[] }>()
const emit = defineEmits<{ uploaded: [count: number] }>()
const { $api } = useNuxtApp()
const { user } = useAuth()
const toast = useToast()

type Row = DocumentUpload & { key: string; progress: number; state: 'ready' | 'uploading' | 'done' | 'error'; error?: string; tagText: string }
const rows = ref<Row[]>([])
const dragging = ref(false)
const input = ref<HTMLInputElement>()
const busy = computed(() => rows.value.some(r => r.state === 'uploading'))
watch(open, v => { if (v) rows.value = [] })

const { active: activeTypes, items: typeItems, refresh: refreshTypes } = useDocumentTypes()
watch(open, v => { if (v) refreshTypes() })
const categoryItems = computed(() => typeItems())
const NONE = '__none'
const deptItems = computed(() => [{ label: 'No department', value: NONE }, ...props.departments.map(d => ({ label: d.name, value: d.id }))])
const visItems: { label: string; value: DocVisibility; icon: string }[] = [
  { label: 'Everyone', value: 'everyone', icon: 'i-lucide-globe' },
  { label: 'My department only', value: 'department', icon: 'i-lucide-lock' }
]

function add(list: FileList | File[] | null | undefined) {
  const files = Array.from(list ?? [])
  for (const file of files) {
    if (rows.value.length >= DOC_LIMITS.maxFiles) { toast.add({ title: `Up to ${DOC_LIMITS.maxFiles} files at once`, color: 'warning' }); break }
    const ext = fileExt(file.name)
    if (!DOC_LIMITS.accept.includes(ext)) { toast.add({ title: `${file.name}: file type not allowed`, color: 'error' }); continue }
    if (file.size > DOC_LIMITS.maxBytes) { toast.add({ title: `${file.name} is larger than 25 MB`, color: 'error' }); continue }
    if (rows.value.some(r => r.file.name === file.name && r.file.size === file.size)) continue
    rows.value.push({
      key: Math.random().toString(36).slice(2), file, progress: 0, state: 'ready', tagText: '',
      title: titleFromFile(file.name), description: '', category: suggestCategory(file.name, activeTypes.value), tags: [],
      departmentId: user.value?.departmentId ?? null, visibility: 'everyone'
    })
  }
}

async function uploadAll() {
  const pending = rows.value.filter(r => r.state === 'ready' || r.state === 'error')
  if (pending.some(r => !r.title.trim())) return toast.add({ title: 'Every file needs a title', color: 'error' })
  let ok = 0
  for (const r of pending) {   // sequential: keeps bandwidth and progress readable
    r.state = 'uploading'; r.progress = 0; r.error = undefined
    try {
      const tags = r.tagText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      await $api.documents.upload({ file: r.file, title: r.title.trim(), description: r.description, category: r.category, tags, departmentId: r.departmentId, visibility: r.visibility }, p => { r.progress = p })
      r.state = 'done'; ok++
    } catch (e) {
      r.state = 'error'; r.error = (e as Error).message
    }
  }
  if (ok) emit('uploaded', ok)
  if (rows.value.every(r => r.state === 'done')) {
    toast.add({ title: `${ok} document${ok > 1 ? 's' : ''} uploaded`, color: 'success' })
    open.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Upload documents" description="Files are sorted into a category automatically — check it before uploading." :dismissible="!busy" :ui="{ content: 'sm:max-w-3xl' }">
    <template #body>
      <div
        class="rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
        :class="dragging ? 'border-primary bg-primary/5' : 'border-(--ui-border) hover:border-primary/50'"
        role="button" tabindex="0" aria-label="Choose files to upload"
        @click="input?.click()" @keydown.enter.space.prevent="input?.click()"
        @dragover.prevent="dragging = true" @dragleave.self="dragging = false" @drop.prevent="dragging = false; add($event.dataTransfer?.files)"
      >
        <UIcon name="i-lucide-upload-cloud" class="size-8 text-primary" />
        <p class="mt-2 text-sm font-medium">Drop files here or click to browse</p>
        <p class="text-xs text-(--ui-text-muted)">PDF, Word, Excel, PowerPoint, text or images · up to 25 MB each · {{ DOC_LIMITS.maxFiles }} at a time</p>
        <input ref="input" type="file" multiple class="hidden" :accept="DOC_LIMITS.accept.map(e => '.' + e).join(',')" @change="e => { add((e.target as HTMLInputElement).files); (e.target as HTMLInputElement).value = '' }" />
      </div>

      <ul v-if="rows.length" class="mt-4 space-y-3">
        <li v-for="(r, i) in rows" :key="r.key" class="rounded-xl border border-(--ui-border) p-3">
          <div class="flex items-start gap-3">
            <DocumentIcon :ext="fileExt(r.file.name)" />
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-center gap-2">
                <p class="text-xs text-(--ui-text-muted) truncate flex-1">{{ r.file.name }} · {{ formatBytes(r.file.size) }}</p>
                <UBadge v-if="r.state === 'done'" label="Uploaded" color="success" variant="subtle" size="sm" icon="i-lucide-check" />
                <UButton v-else-if="r.state !== 'uploading'" icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :aria-label="`Remove ${r.file.name}`" @click="rows.splice(i, 1)" />
              </div>
              <fieldset :disabled="r.state === 'uploading' || r.state === 'done'" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UInput v-model="r.title" placeholder="Title" class="w-full sm:col-span-2" :aria-label="`Title for ${r.file.name}`" />
                <USelect v-model="r.category" :items="categoryItems" class="w-full" :aria-label="`Category for ${r.file.name}`" />
                <USelect :model-value="r.departmentId || NONE" :items="deptItems" @update:model-value="(v: string) => r.departmentId = v === NONE ? null : v" icon="i-lucide-building-2" class="w-full" :aria-label="`Department for ${r.file.name}`" />
                <USelect v-model="r.visibility" :items="visItems" class="w-full" :aria-label="`Who can see ${r.file.name}`" />
                <UInput v-model="r.tagText" placeholder="Tags, comma separated" icon="i-lucide-tag" class="w-full" :aria-label="`Tags for ${r.file.name}`" />
              </fieldset>
              <UProgress v-if="r.state === 'uploading'" v-model="r.progress" size="sm" />
              <p v-if="r.error" class="text-xs text-(--ui-error)">{{ r.error }}</p>
            </div>
          </div>
        </li>
      </ul>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:items-center gap-2 w-full">
        <span class="text-sm text-(--ui-text-muted) sm:mr-auto">{{ rows.length }} file{{ rows.length === 1 ? '' : 's' }}</span>
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" :disabled="busy" @click="open = false" />
        <UButton icon="i-lucide-upload" :label="busy ? 'Uploading…' : 'Upload'" :loading="busy" :disabled="!rows.some(r => r.state !== 'done')" class="justify-center" @click="uploadAll" />
      </div>
    </template>
  </UModal>
</template>
