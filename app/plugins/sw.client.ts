// Registers the service worker (public/sw.js). Production only: in development it would
// cache Vite's modules and fight hot reload.
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('[sw] registration failed', error)
    })
  })
})
