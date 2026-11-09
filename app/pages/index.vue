<script setup lang="ts">
import { statusColor } from '~/types/order'
import { workflowStatusColor } from '~/types/workflow'

const { $api } = useNuxtApp()
const { user } = useAuth()
const { can } = usePermission()
const none = { items: [], total: 0, page: 1, pageSize: 0 }

const { data, pending } = await useAsyncData('dashboard', async () => {
  // only fetch what this role may see
  const [u, p, o, inbox, mine] = await Promise.all([
    can('users.view') ? $api.users.list({ page: 1, pageSize: 1000 }) : none,
    can('products.view') ? $api.products.list({ page: 1, pageSize: 1000 }) : none,
    can('orders.view') ? $api.orders.list({ page: 1, pageSize: 1000 }) : none,
    can('workflows.approve') ? $api.workflows.list({ page: 1, pageSize: 5, scope: 'inbox' }) : none,
    can('workflows.create') ? $api.workflows.list({ page: 1, pageSize: 5, scope: 'mine' }) : none
  ] as const)
  const paid = o.items.filter(x => x.status !== 'pending' && x.status !== 'cancelled')
  return {
    totalUsers: u.total,
    activeUsers: u.items.filter(x => x.status === 'active').length,
    totalProducts: p.total,
    lowStock: p.items.filter(x => x.stock < 10),
    inventoryValue: p.items.reduce((s, x) => s + x.price * x.stock, 0),
    recentUsers: u.items.slice(0, 5),
    pendingOrders: o.items.filter(x => x.status === 'pending').length,
    revenue: paid.reduce((s, x) => s + x.total, 0),
    recentOrders: o.items.slice(0, 5),
    inbox: inbox.items, inboxTotal: inbox.total,
    myRequests: mine.items
  }
})

const stats = computed(() => data.value ? [
  can('workflows.approve') && { label: 'Awaiting My Approval', value: data.value.inboxTotal, icon: 'i-lucide-inbox' },
  can('orders.view') && { label: 'Revenue', value: idr(data.value.revenue), icon: 'i-lucide-wallet' },
  can('orders.view') && { label: 'Pending Orders', value: data.value.pendingOrders, icon: 'i-lucide-shopping-bag' },
  can('products.view') && { label: 'Products', value: data.value.totalProducts, icon: 'i-lucide-package' },
  can('products.view') && { label: 'Inventory Value', value: idr(data.value.inventoryValue), icon: 'i-lucide-boxes' }
].filter(Boolean).slice(0, 4) as { label: string; value: string | number; icon: string }[] : [])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl sm:text-2xl font-semibold">Dashboard</h1>
      <p class="text-(--ui-text-muted)">Welcome back, {{ user?.name }}</p>
    </div>

    <div class="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <UCard v-for="s in stats" :key="s.label">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div class="self-start p-2 rounded-lg bg-primary/10"><UIcon :name="s.icon" class="size-6 text-primary" /></div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm text-(--ui-text-muted)">{{ s.label }}</p>
            <p class="text-base sm:text-xl font-semibold break-words">{{ s.value }}</p>
          </div>
        </div>
      </UCard>
      <USkeleton v-if="pending" v-for="i in 4" :key="i" class="h-20" />
    </div>

    <div v-if="data" class="grid gap-4 lg:grid-cols-2">
      <UCard v-if="can('workflows.approve') || can('workflows.create')" class="lg:col-span-2">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="font-semibold">{{ can('workflows.approve') ? 'Waiting for your approval' : 'My requests' }}</h2>
            <UButton to="/workflows" size="xs" variant="ghost" label="Open workflows" trailing-icon="i-lucide-arrow-right" />
          </div>
        </template>
        <p v-if="!(can('workflows.approve') ? data.inbox : data.myRequests).length" class="text-sm text-(--ui-text-muted)">Nothing here right now.</p>
        <ul v-else class="divide-y divide-(--ui-border)">
          <li v-for="r in (can('workflows.approve') ? data.inbox : data.myRequests)" :key="r.id">
            <NuxtLink :to="`/workflows/${r.id}`" class="py-2 flex justify-between items-center gap-3 text-sm">
              <span class="min-w-0 truncate"><span class="font-mono">{{ r.code }}</span> {{ r.title }} <span class="text-(--ui-text-muted)">· {{ r.requesterName }}</span></span>
              <UBadge :label="r.status" :color="workflowStatusColor[r.status]" variant="subtle" class="shrink-0" />
            </NuxtLink>
          </li>
        </ul>
      </UCard>
      <UCard v-if="can('orders.view')" class="lg:col-span-2">
        <template #header>
          <div class="flex justify-between items-center"><h2 class="font-semibold">Recent Orders</h2><UButton to="/orders" size="xs" variant="ghost" label="View all" trailing-icon="i-lucide-arrow-right" /></div>
        </template>
        <p v-if="!data.recentOrders.length" class="text-sm text-(--ui-text-muted)">No orders yet.</p>
        <ul v-else class="divide-y divide-(--ui-border)">
          <li v-for="o in data.recentOrders" :key="o.id" class="py-2 flex justify-between items-center gap-3 text-sm">
            <span class="min-w-0 truncate"><span class="font-mono">{{ o.code }}</span> <span class="text-(--ui-text-muted)">· {{ o.customerName }}</span></span>
            <span class="flex items-center gap-2 shrink-0"><span class="hidden sm:inline">{{ idr(o.total) }}</span><UBadge :label="o.status" :color="statusColor[o.status]" variant="subtle" /></span>
          </li>
        </ul>
      </UCard>
      <UCard v-if="can('users.view')">
        <template #header><h2 class="font-semibold">Recent Users</h2></template>
        <ul class="divide-y divide-(--ui-border)">
          <li v-for="u in data.recentUsers" :key="u.id" class="py-2 flex justify-between items-center gap-3 text-sm">
            <span class="min-w-0 truncate">{{ u.name }} <span class="text-(--ui-text-muted)">· {{ u.email }}</span></span>
            <UBadge :label="u.role" variant="subtle" class="shrink-0" />
          </li>
        </ul>
      </UCard>
      <UCard v-if="can('products.view')">
        <template #header><h2 class="font-semibold">Low Stock (&lt; 10)</h2></template>
        <p v-if="!data.lowStock.length" class="text-sm text-(--ui-text-muted)">All good.</p>
        <ul v-else class="divide-y divide-(--ui-border)">
          <li v-for="p in data.lowStock" :key="p.id" class="py-2 flex justify-between items-center gap-3 text-sm">
            <span class="min-w-0 truncate">{{ p.name }} <span class="text-(--ui-text-muted)">· {{ p.sku }}</span></span>
            <UBadge :label="`${p.stock} left`" color="warning" variant="subtle" class="shrink-0" />
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
