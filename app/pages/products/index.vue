<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Product, ProductInput } from '~/types/product'

definePageMeta({ permission: 'products.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canManage = computed(() => can('products.manage'))
const { items, total, loading, saving, query, load, save, remove } = useCrud<Product, ProductInput>($api.products, 'Product', validateProduct)

const formOpen = ref(false)
const deleteOpen = ref(false)
const selected = ref<Product | null>(null)

function openCreate() { selected.value = null; formOpen.value = true }
function openEdit(p: Product) { selected.value = p; formOpen.value = true }
function openDelete(p: Product) { selected.value = p; deleteOpen.value = true }

async function onSubmit(input: ProductInput) {
  if (await save(input, selected.value?.id)) formOpen.value = false
}
async function onDelete() {
  if (!selected.value) return
  await remove(selected.value.id)
  deleteOpen.value = false
}

const columns: TableColumn<Product>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'gender', header: 'For' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => idr(row.original.price) },
  { accessorKey: 'stock', header: 'Stock' },
  { accessorKey: 'isActive', header: 'Status' },
  { id: 'actions', header: '' }
]

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl sm:text-2xl font-semibold">Products</h1>
      <UButton v-if="canManage" icon="i-lucide-plus" label="Add Product" :ui="{ label: 'hidden sm:inline' }" :aria-label="'Add Product'" @click="openCreate" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search name, SKU, category, origin…" class="w-full sm:max-w-xs" />
      </div>
      <UTable class="hidden md:block" :data="items" :columns="columns" :loading="loading">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2 min-w-0">
            <span class="flex shrink-0 rounded overflow-hidden" aria-hidden="true"><span v-for="c in row.original.colors" :key="c" class="w-2 h-6" :style="{ background: c }" /></span>
            <div class="min-w-0"><p class="font-medium truncate">{{ row.original.name }}</p><p class="text-xs text-(--ui-text-muted) truncate">{{ row.original.origin }} · {{ row.original.technique }}</p></div>
          </div>
        </template>
        <template #stock-cell="{ row }">
          <UTooltip :text="row.original.variants.map(v => `${v.size}: ${v.stock}`).join(' · ')">
            <span :class="row.original.stock < 10 ? 'text-(--ui-warning) font-medium' : ''">{{ row.original.stock }}</span>
          </UTooltip>
        </template>
        <template #isActive-cell="{ row }">
          <UBadge :label="row.original.isActive ? 'in shop' : 'hidden'" :color="row.original.isActive ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton v-if="canManage" icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" @click="openEdit(row.original)" />
            <UButton v-if="canManage" icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" @click="openDelete(row.original)" />
          </div>
        </template>
      </UTable>
      <!-- Mobile card list -->
      <ul class="md:hidden divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No products found.</li>
        <li v-for="p in (loading ? [] : items)" :key="p.id" class="p-4 flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ p.name }}</p>
            <p class="text-sm text-(--ui-text-muted) truncate">{{ p.sku }} · {{ p.gender }} · {{ p.category }}</p>
            <p class="mt-1 text-sm">
              <span class="font-semibold">{{ idr(p.price) }}</span>
              <span class="mx-1 text-(--ui-text-muted)">·</span>
              <span :class="p.stock < 10 ? 'text-(--ui-warning) font-medium' : 'text-(--ui-text-muted)'">{{ p.stock }} in stock</span>
            </p>
            <UBadge class="mt-2" :label="p.isActive ? 'in shop' : 'hidden'" :color="p.isActive ? 'success' : 'neutral'" variant="subtle" />
          </div>
          <div class="flex -mr-2">
            <UButton v-if="canManage" icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Edit ${p.name}`" @click="openEdit(p)" />
            <UButton v-if="canManage" icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Delete ${p.name}`" @click="openDelete(p)" />
          </div>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} products</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <ProductFormModal v-model:open="formOpen" :product="selected" :saving="saving" @submit="onSubmit" />
    <CommonConfirmDialog v-model:open="deleteOpen" :message="`Delete product ${selected?.name}?`" @confirm="onDelete" />
  </div>
</template>
