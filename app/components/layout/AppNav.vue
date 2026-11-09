<script setup lang="ts">
import type { Permission } from '~/types/rbac'

// Shared navigation used by the desktop sidebar and the mobile drawer.
const emit = defineEmits<{ navigate: [] }>()
const { user, logout } = useAuth()
const { can } = usePermission()
const { $api } = useNuxtApp()
const route = useRoute()

type NavLink = { label: string; icon: string; to: string; permission?: Permission | Permission[]; badge?: 'inbox' }
const groups: { label?: string; links: NavLink[] }[] = [
  { links: [{ label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' }] },
  { label: 'AI', links: [
    { label: 'Assistant', icon: 'i-lucide-sparkles', to: '/assistant', permission: 'chatbot.use' }
  ] },
  { label: 'Knowledge', links: [
    { label: 'Documents', icon: 'i-lucide-library', to: '/documents', permission: 'documents.view' },
    { label: 'Document Types', icon: 'i-lucide-tags', to: '/documents/types', permission: 'documents.types' }
  ] },
  { label: 'Workflow', links: [
    { label: 'Requests', icon: 'i-lucide-git-pull-request-arrow', to: '/workflows', permission: ['workflows.create', 'workflows.approve', 'workflows.view_all'], badge: 'inbox' },
    { label: 'Approval Flows', icon: 'i-lucide-route', to: '/workflows/templates', permission: 'workflows.manage' }
  ] },
  { label: 'Organization', links: [
    { label: 'Users', icon: 'i-lucide-users', to: '/users', permission: 'users.view' },
    { label: 'Departments', icon: 'i-lucide-building-2', to: '/departments', permission: 'departments.view' },
    { label: 'Assets', icon: 'i-lucide-package-search', to: '/assets', permission: 'assets.view' },
    { label: 'Roles & Access', icon: 'i-lucide-shield-check', to: '/roles', permission: 'roles.view' }
  ] },
  { label: 'Store', links: [
    { label: 'Products', icon: 'i-lucide-package', to: '/products', permission: 'products.view' },
    { label: 'Orders', icon: 'i-lucide-shopping-bag', to: '/orders', permission: 'orders.view' }
  ] }
]
const all = groups.flatMap(g => g.links)
// hide links the role can't open, and whole groups that end up empty
const visibleGroups = computed(() => groups
  .map(g => ({ ...g, links: g.links.filter(l => !l.permission || can(l.permission)) }))
  .filter(g => g.links.length))

// collapsible sections — remembered per browser; the section of the current page always opens
const STORE = 'cms.nav.collapsed'
const collapsed = ref<Record<string, boolean>>((() => { try { return JSON.parse(localStorage.getItem(STORE) ?? '{}') } catch { return {} } })())
const isOpen = (label?: string) => !label || !collapsed.value[label]
function toggle(label: string) {
  collapsed.value = { ...collapsed.value, [label]: isOpen(label) }
  try { localStorage.setItem(STORE, JSON.stringify(collapsed.value)) } catch { /* ignore */ }
}
watch(() => route.path, () => {
  const g = groups.find(g => g.label && g.links.some(l => isActive(l.to)))
  if (g?.label && !isOpen(g.label)) toggle(g.label)
}, { immediate: true })
const groupBadge = (g: { links: NavLink[] }) => g.links.some(l => l.badge === 'inbox') ? inbox.value : 0

// requests waiting for my decision; refreshed on navigation
const inbox = useState('workflow.inbox', () => 0)
async function refreshInbox() {
  if (!can(['workflows.approve'])) return
  try { inbox.value = await $api.workflows.inboxCount() } catch { /* ignore */ }
}
watch(() => route.fullPath, refreshInbox, { immediate: true })

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  // most specific link wins (/workflows vs /workflows/templates)
  const best = all.filter(l => l.to !== '/' && route.path.startsWith(l.to)).sort((a, b) => b.to.length - a.to.length)[0]
  return best?.to === to
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="h-16 shrink-0 flex items-center px-5 font-bold text-lg">
      <UIcon name="i-lucide-box" class="mr-2 text-primary" /> CMS
    </div>
    <nav class="flex-1 overflow-y-auto px-3 pb-3 space-y-2" aria-label="Main">
      <div v-for="(g, gi) in visibleGroups" :key="g.label ?? gi">
        <UCollapsible v-if="g.label" :open="isOpen(g.label)" @update:open="toggle(g.label)" :unmount-on-hide="false">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide text-(--ui-text-dimmed) hover:text-(--ui-text) hover:bg-(--ui-bg-elevated)/60 transition-colors"
          >
            <span class="flex-1 text-left">{{ g.label }}</span>
            <UBadge v-if="!isOpen(g.label) && groupBadge(g)" :label="String(groupBadge(g))" color="warning" size="sm" />
            <UIcon name="i-lucide-chevron-down" class="size-4 transition-transform duration-200" :class="isOpen(g.label) ? '' : '-rotate-90'" />
          </button>
          <template #content>
            <div class="space-y-0.5 pt-0.5" role="group" :aria-label="g.label">
              <UButton
                v-for="l in g.links" :key="l.to" :to="l.to" :icon="l.icon" :label="l.label"
                block class="justify-start" :variant="isActive(l.to) ? 'soft' : 'ghost'"
                :color="isActive(l.to) ? 'primary' : 'neutral'"
                :aria-current="isActive(l.to) ? 'page' : undefined"
                @click="emit('navigate')"
              >
                <template v-if="l.badge === 'inbox' && inbox" #trailing>
                  <UBadge :label="String(inbox)" color="warning" size="sm" class="ml-auto" :aria-label="`${inbox} waiting for your approval`" />
                </template>
              </UButton>
            </div>
          </template>
        </UCollapsible>
        <div v-else class="space-y-0.5">
          <UButton
            v-for="l in g.links" :key="l.to" :to="l.to" :icon="l.icon" :label="l.label"
            block class="justify-start" :variant="isActive(l.to) ? 'soft' : 'ghost'"
            :color="isActive(l.to) ? 'primary' : 'neutral'"
            :aria-current="isActive(l.to) ? 'page' : undefined"
            @click="emit('navigate')"
          />
        </div>
      </div>
    </nav>
    <div class="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-(--ui-border) flex items-center gap-2">
      <UAvatar :alt="user?.name" size="sm" />
      <div class="flex-1 min-w-0 text-sm">
        <p class="font-medium truncate">{{ user?.name }}</p>
        <p class="text-(--ui-text-muted) truncate">{{ user?.roleName ?? user?.role }} · {{ user?.email }}</p>
      </div>
      <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="Log out" @click="logout" />
    </div>
  </div>
</template>
