// A staff session can end on the server while its cookie lives on: password changed or reset,
// account deactivated. The admin route guard only sees the cookie, so whatever first gets a
// 401 from the admin API calls this to drop the session and go to the login screen.
export function useStaffSessionEnd() {
  const { clear } = useUserSession()
  return async (returnTo: string) => {
    await clear()
    const redirect = returnTo.startsWith('/admin') && !returnTo.startsWith('/admin/login') ? returnTo : '/admin'
    await clearError({ redirect: `/admin/login?redirect=${encodeURIComponent(redirect)}` })
  }
}
