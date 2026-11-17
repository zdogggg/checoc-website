import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

export default defineNuxtPlugin(() => {
  // Restore the cart only after hydration has fully finished (async layouts included),
  // otherwise the server-rendered (empty) cart and the cart from localStorage differ
  // and Vue reports a hydration mismatch.
  onNuxtReady(async () => {
    const cart = useCartStore()
    cart.hydrate()
    // The saved cart may be days old: bring prices and options in line with today's menu
    const message = await cart.syncWithMenu()
    if (message) useUiStore().showToast(message, 'warning')
  })
})
