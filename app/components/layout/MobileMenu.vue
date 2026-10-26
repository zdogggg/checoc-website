<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
v-if="uiStore.isMobileMenuOpen" 
         class="fixed inset-0 bg-brand-dark-green/60 backdrop-blur-sm z-[60] transition-opacity md:hidden"
         @click="uiStore.toggleMobileMenu">
    </div>

    <!-- Drawer -->
    <div
class="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-brand-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col md:hidden"
         :class="uiStore.isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'">
      
      <div class="p-6 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-dark-green rounded-full flex items-center justify-center">
            <span class="text-brand-white text-xl">🍵</span>
          </div>
          <span class="font-heading text-xl font-bold text-brand-dark-green">Chè Cốc</span>
        </div>
        <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500" @click="uiStore.toggleMobileMenu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav class="flex-grow flex flex-col p-8 gap-6 overflow-y-auto">
        <NuxtLink to="/" class="font-heading text-2xl text-brand-dark-green hover:text-brand-peach transition-colors" @click="uiStore.toggleMobileMenu">Trang chủ</NuxtLink>
        <NuxtLink to="/products" class="font-heading text-2xl text-brand-dark-green hover:text-brand-peach transition-colors" @click="uiStore.toggleMobileMenu">Sản phẩm</NuxtLink>
        <NuxtLink to="/about" class="font-heading text-2xl text-brand-dark-green hover:text-brand-peach transition-colors" @click="uiStore.toggleMobileMenu">Về chúng tôi</NuxtLink>
        <NuxtLink to="/news" class="font-heading text-2xl text-brand-dark-green hover:text-brand-peach transition-colors" @click="uiStore.toggleMobileMenu">Tin tức</NuxtLink>
        <NuxtLink to="/contact" class="font-heading text-2xl text-brand-dark-green hover:text-brand-peach transition-colors" @click="uiStore.toggleMobileMenu">Liên hệ</NuxtLink>
      </nav>

      <div class="p-8 border-t border-gray-100">
        <button class="w-full bg-brand-peach text-brand-dark-green px-5 py-4 rounded-full font-bold hover:bg-[#f3a886] transition-colors flex items-center justify-center gap-2" @click="handleOrder">
          Đặt hàng ngay
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUiStore } from '~/stores/ui'

const router = useRouter()
const uiStore = useUiStore()

const handleOrder = () => {
  uiStore.toggleMobileMenu()
  router.push('/products')
}
</script>
