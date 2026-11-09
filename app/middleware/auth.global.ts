import { tokenStorage } from '~/utils/tokenStorage'

export default defineNuxtRouteMiddleware((to) => {
  const loggedIn = !!tokenStorage.getAccessToken() && !!tokenStorage.getUser()
  if (to.meta.public) {
    if (loggedIn && to.path === '/login') return navigateTo('/')
    return
  }
  if (!loggedIn) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })

  // RBAC: pages declare definePageMeta({ permission: 'users.view' })
  if (to.meta.permission && !hasPermission(tokenStorage.getUser()?.permissions, to.meta.permission)) {
    if (to.path === '/') return
    useToast().add({ title: 'Access denied', description: 'Your role does not have access to that page.', color: 'error' })
    return navigateTo('/')
  }
})
