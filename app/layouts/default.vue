<script setup lang="ts">
// Mobile-first: top bar + slide-over drawer below lg, sticky sidebar from lg up.
const drawerOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { drawerOpen.value = false })
</script>

<template>
  <div class="min-h-dvh lg:flex bg-(--ui-bg-muted)">
    <!-- Desktop sidebar -->
    <aside class="hidden lg:block w-60 shrink-0 sticky top-0 h-dvh border-r border-(--ui-border) bg-(--ui-bg)">
      <LayoutAppNav />
    </aside>

    <!-- Mobile top bar -->
    <header
      class="lg:hidden sticky top-0 z-30 h-14 pt-[env(safe-area-inset-top)] box-content flex items-center gap-2 px-2 border-b border-(--ui-border) bg-(--ui-bg)/90 backdrop-blur"
    >
      <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="lg" aria-label="Open menu" @click="drawerOpen = true" />
      <span class="font-bold flex items-center"><UIcon name="i-lucide-box" class="mr-2 text-primary" /> CMS</span>
    </header>

    <USlideover v-model:open="drawerOpen" side="left" title="Menu" :ui="{ content: 'max-w-[80vw] w-72' }">
      <template #content>
        <LayoutAppNav @navigate="drawerOpen = false" />
      </template>
    </USlideover>

    <main class="flex-1 min-w-0 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <slot />
    </main>
  </div>
</template>
