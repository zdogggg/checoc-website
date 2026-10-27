// Production: alert the shop on Telegram when the server fails (5xx). Client errors
// (validation, 404, 401) are expected and not reported.
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) return
  nitroApp.hooks.hook('error', (error, { event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status < 500) return
    void notifyServerError(error, event?.path.split('?')[0] ?? '(ngoài request)')
  })
})
