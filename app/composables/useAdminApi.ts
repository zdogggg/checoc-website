// $fetch for the admin API: a 401 (expired session) sends the user back to the login page
export function useAdminApi() {
  const route = useRoute()
  const { clear } = useUserSession()

  return async function adminFetch<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return (await $fetch(url, options)) as T
    } catch (error) {
      if (apiStatus(error) === 401) {
        await clear()
        await navigateTo({ path: '/admin/login', query: { redirect: route.fullPath } })
      }
      throw error
    }
  }
}

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ quán',
  manager: 'Quản lý',
  staff: 'Nhân viên',
}

// Mirrors CATALOG_EDITORS on the server; only used to hide buttons, the API enforces it
export function useCanEditCatalog() {
  const { user } = useUserSession()
  return computed(() => user.value?.role === 'owner' || user.value?.role === 'manager')
}
