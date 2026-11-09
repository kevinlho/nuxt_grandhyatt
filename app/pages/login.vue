<script setup lang="ts">
definePageMeta({ layout: 'blank', public: true })

const { login } = useAuth()
const route = useRoute()
const form = reactive({ email: 'admin@example.com', password: 'password' })
const loading = ref(false)
const error = ref('')
const useDummy = useRuntimeConfig().public.useDummy
const demo = ['admin', 'employee', 'manager', 'ceo']
const pick = (r: string) => { form.email = `${r}@example.com`; form.password = 'password' }

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await login(form)
    await navigateTo((route.query.redirect as string) || '/')
  } catch (e) {
    error.value = (e as Error).message
  } finally { loading.value = false }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center bg-(--ui-bg-muted) p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-semibold">Sign in</h1>
        <div v-if="useDummy" class="mt-2 space-y-1.5">
          <p class="text-sm text-(--ui-text-muted)">Demo accounts (password: <code>password</code>)</p>
          <div class="flex flex-wrap gap-1.5">
            <UButton v-for="r in demo" :key="r" :label="r" size="xs" :variant="form.email.startsWith(r + '@') ? 'solid' : 'outline'" color="neutral" @click="pick(r)" />
          </div>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Email">
          <UInput v-model="form.email" type="email" autocomplete="email" inputmode="email" icon="i-lucide-mail" class="w-full" required />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="form.password" type="password" autocomplete="current-password" icon="i-lucide-lock" class="w-full" required />
        </UFormField>
        <UAlert v-if="error" color="error" variant="soft" :title="error" />
        <UButton type="submit" block size="lg" :loading="loading" label="Sign in" />
      </form>
    </UCard>
  </div>
</template>
