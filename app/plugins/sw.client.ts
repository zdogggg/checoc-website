// Registers the service worker (public/sw.js). Production only: in development it would
// cache Vite's modules and fight hot reload.
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  // The build id makes each deploy a new worker version (see public/sw.js)
  const version = encodeURIComponent(useRuntimeConfig().app.buildId || 'v1')
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' }).catch((error) => {
      console.warn('[sw] registration failed', error)
    })
  })
})
