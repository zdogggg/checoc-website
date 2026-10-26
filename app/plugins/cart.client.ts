import { useCartStore } from '~/stores/cart'

export default defineNuxtPlugin(() => {
  // Restore the cart only after hydration has fully finished (async layouts included),
  // otherwise the server-rendered (empty) cart and the cart from localStorage differ
  // and Vue reports a hydration mismatch.
  onNuxtReady(() => {
    useCartStore().hydrate()
  })
})
