// Guards every /admin page except the login screen
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }
})
