import type { NitroFetchOptions } from 'nitropack'

// Nitro's typed-route inference over every admin URL overflows the type checker,
// so the admin client calls $fetch through a plain signature
const untypedFetch = $fetch as unknown as <T>(url: string, options?: NitroFetchOptions<string>) => Promise<T>

// $fetch for the admin API: a 401 (expired session) sends the user back to the login page
export function useAdminApi() {
  const route = useRoute()
  const { clear } = useUserSession()

  return async function adminFetch<T>(url: string, options: NitroFetchOptions<string> = {}): Promise<T> {
    try {
      return await untypedFetch<T>(url, options)
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
