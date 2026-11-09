<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { statusColor, type Order, type OrderStatus, type OrderStatusInput } from '~/types/order'

definePageMeta({ permission: 'orders.view' })
const { $api } = useNuxtApp()
const { can } = usePermission()
const canManage = computed(() => can('orders.manage'))
const { items, total, loading, saving, query, load, save } = useCrud<Order, OrderStatusInput>($api.orders, 'Order')

const detailOpen = ref(false)
const selected = ref<Order | null>(null)
function openDetail(o: Order) { selected.value = o; detailOpen.value = true }
async function onStatus(status: OrderStatus) {
  if (selected.value && await save({ status }, selected.value.id)) detailOpen.value = false
}

const date = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const qty = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0)

const columns: TableColumn<Order>[] = [
  { accessorKey: 'code', header: 'Order' },
  { accessorKey: 'customerName', header: 'Customer' },
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => date(row.original.createdAt) },
  { id: 'items', header: 'Items', cell: ({ row }) => qty(row.original) },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => idr(row.original.total) },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl sm:text-2xl font-semibold">Orders</h1>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="p-4 border-b border-(--ui-border)">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search code, customer, city, status…" class="w-full sm:max-w-xs" />
      </div>
      <UTable class="hidden md:block" :data="items" :columns="columns" :loading="loading">
        <template #code-cell="{ row }"><span class="font-mono">{{ row.original.code }}</span></template>
        <template #customerName-cell="{ row }">
          <p class="font-medium">{{ row.original.customerName }}</p>
          <p class="text-xs text-(--ui-text-muted)">{{ row.original.city }}</p>
        </template>
        <template #status-cell="{ row }">
          <UBadge :label="row.original.status" :color="statusColor[row.original.status]" variant="subtle" />
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end"><UButton icon="i-lucide-eye" size="sm" color="neutral" variant="ghost" :aria-label="`View ${row.original.code}`" @click="openDetail(row.original)" /></div>
        </template>
      </UTable>
      <ul class="md:hidden divide-y divide-(--ui-border)">
        <li v-if="loading" v-for="i in 4" :key="`sk${i}`" class="p-4"><USkeleton class="h-14" /></li>
        <li v-else-if="!items.length" class="p-6 text-center text-sm text-(--ui-text-muted)">No orders found.</li>
        <li v-for="o in (loading ? [] : items)" :key="o.id">
          <button type="button" class="w-full p-4 flex items-start gap-3 text-left" @click="openDetail(o)">
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate"><span class="font-mono">{{ o.code }}</span> · {{ o.customerName }}</p>
              <p class="text-sm text-(--ui-text-muted)">{{ date(o.createdAt) }} · {{ qty(o) }} items</p>
              <p class="mt-1 text-sm font-semibold">{{ idr(o.total) }}</p>
            </div>
            <UBadge :label="o.status" :color="statusColor[o.status]" variant="subtle" />
          </button>
        </li>
      </ul>
      <div class="p-4 border-t border-(--ui-border) flex flex-col-reverse sm:flex-row gap-3 justify-between items-center text-sm">
        <span class="text-(--ui-text-muted)">{{ total }} orders</span>
        <UPagination :sibling-count="1" show-edges v-model:page="query.page" :items-per-page="query.pageSize" :total="total" />
      </div>
    </UCard>

    <OrderDetailModal v-model:open="detailOpen" :order="selected" :saving="saving" @submit="onStatus" />
  </div>
</template>
