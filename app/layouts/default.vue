<template>
  <div class="min-h-screen flex flex-col font-sans bg-[var(--color-cream)] text-[var(--color-dark-green)]">
    <AppNavbar />
    <MobileMenu />

    <main class="flex-grow">
      <slot />
    </main>

    <AppFooter />
    
    <CartDrawer />
    <ProductQuickView />
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import AppNavbar from '~/components/layout/AppNavbar.vue'
import MobileMenu from '~/components/layout/MobileMenu.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import CartDrawer from '~/components/cart/CartDrawer.vue'
import ProductQuickView from '~/components/product/ProductQuickView.vue'
import AppToast from '~/components/common/AppToast.vue'
</script>
