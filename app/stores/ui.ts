import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product } from '#shared/types/catalog'

export interface ToastMessage {
  id: number
  text: string
  type?: 'success' | 'info' | 'warning'
}

export const useUiStore = defineStore('ui', () => {
  const isCartDrawerOpen = ref(false)
  const isMobileMenuOpen = ref(false)
  const isQuickViewOpen = ref(false)
  const selectedProduct = ref<Product | null>(null)
  const toasts = ref<ToastMessage[]>([])

  function toggleCartDrawer(forcedState?: boolean | unknown) {
    if (typeof forcedState === 'boolean') {
      isCartDrawerOpen.value = forcedState
    } else {
      isCartDrawerOpen.value = !isCartDrawerOpen.value
    }
    if (isCartDrawerOpen.value) {
      isMobileMenuOpen.value = false
    }
  }

  function toggleMobileMenu(forcedState?: boolean | unknown) {
    if (typeof forcedState === 'boolean') {
      isMobileMenuOpen.value = forcedState
    } else {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
    }
    if (isMobileMenuOpen.value) {
      isCartDrawerOpen.value = false
    }
  }

  function openQuickView(product: Product) {
    selectedProduct.value = product
    isQuickViewOpen.value = true
  }

  function closeQuickView() {
    isQuickViewOpen.value = false
    selectedProduct.value = null
  }

  function showToast(text: string, type: 'success' | 'info' | 'warning' = 'success') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, text, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  return { 
    isCartDrawerOpen, 
    isMobileMenuOpen, 
    isQuickViewOpen, 
    selectedProduct, 
    toasts,
    toggleCartDrawer, 
    toggleMobileMenu, 
    openQuickView, 
    closeQuickView,
    showToast
  }
})
