<template>
  <header 
    class="h-20 flex items-center justify-between px-4 sm:px-8 fixed top-0 w-full z-50 transition-all duration-300"
    :class="isSolidNavbar ? 'bg-brand-dark-green shadow-lg text-white py-3' : 'bg-transparent text-white pt-6'"
  >
    <!-- Logo -->
    <NuxtLink to="/" class="flex items-center gap-3 cursor-pointer group">
      <div class="w-10 h-10 bg-brand-white rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
        <span class="text-brand-dark-green text-xl">🍵</span>
      </div>
      <div class="flex flex-col">
        <span class="font-heading text-xl sm:text-2xl font-bold leading-none tracking-wide">Chè Cốc</span>
        <span class="text-[9px] sm:text-[10px] text-brand-peach tracking-widest font-medium uppercase mt-1">Ngọt lành từ thiên nhiên</span>
      </div>
    </NuxtLink>
    
    <!-- Links -->
    <nav class="hidden md:flex gap-8 font-medium text-sm">
      <NuxtLink 
        to="/" 
        class="transition-colors pb-1 border-b-2"
        :class="route.path === '/' ? 'text-brand-peach border-brand-peach font-semibold' : 'text-white/80 hover:text-white border-transparent'"
      >
        Trang chủ
      </NuxtLink>
      <NuxtLink 
        to="/products" 
        class="transition-colors pb-1 border-b-2"
        :class="route.path.startsWith('/products') ? 'text-brand-peach border-brand-peach font-semibold' : 'text-white/80 hover:text-white border-transparent'"
      >
        Thực đơn
      </NuxtLink>
      <NuxtLink 
        to="/about" 
        class="transition-colors pb-1 border-b-2"
        :class="route.path === '/about' ? 'text-brand-peach border-brand-peach font-semibold' : 'text-white/80 hover:text-white border-transparent'"
      >
        Về chúng tôi
      </NuxtLink>
      <NuxtLink 
        to="/news" 
        class="transition-colors pb-1 border-b-2"
        :class="route.path === '/news' ? 'text-brand-peach border-brand-peach font-semibold' : 'text-white/80 hover:text-white border-transparent'"
      >
        Tin tức
      </NuxtLink>
      <NuxtLink 
        to="/contact" 
        class="transition-colors pb-1 border-b-2"
        :class="route.path === '/contact' ? 'text-brand-peach border-brand-peach font-semibold' : 'text-white/80 hover:text-white border-transparent'"
      >
        Liên hệ
      </NuxtLink>
    </nav>
    
    <!-- Actions -->
    <div class="flex items-center gap-3 sm:gap-6">
      <NuxtLink to="/products" class="hover:text-brand-peach transition-colors p-2 rounded-full hover:bg-white/10" title="Tìm kiếm chè">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </NuxtLink>
      
      <CartButton />
      
      <NuxtLink 
        to="/products"
        class="hidden md:flex items-center gap-2 bg-[#F6B99F] text-brand-dark-green px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#f3a886] transition-all transform hover:-translate-y-0.5 shadow-md"
      >
        Đặt hàng ngay
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </NuxtLink>

      <button class="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" @click="uiStore.toggleMobileMenu" aria-label="Menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import CartButton from '~/components/cart/CartButton.vue'

const route = useRoute()
const cartStore = useCartStore()
const uiStore = useUiStore()
const isScrolled = ref(false)

const isSolidNavbar = computed(() => {
  return isScrolled.value || route.path !== '/'
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 40
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
