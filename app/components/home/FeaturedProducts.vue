<template>
  <section class="py-24 bg-brand-dark-green text-brand-white relative overflow-hidden">
    <!-- Decor leaves background could go here -->
    
    <div class="container mx-auto px-6 relative z-10" v-motion-slide-visible-once-bottom>
      
      <div class="flex justify-between items-end mb-12">
        <div>
          <div class="inline-flex items-center gap-2 bg-[#F6B99F] text-brand-dark-green px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Best Seller
          </div>
          <h2 class="font-heading text-4xl md:text-5xl font-bold mb-2">Sản phẩm nổi bật</h2>
          <p class="text-brand-white/70">Những món chè được yêu thích nhất hiện nay</p>
        </div>
        <NuxtLink to="/products" class="text-brand-white hover:text-brand-peach transition-colors hidden sm:flex items-center gap-2 pb-2">
          Xem tất cả <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <div class="relative">
        <!-- Carousel Arrows Placeholder -->
        <button class="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-20 backdrop-blur-sm transition-colors hidden lg:flex">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button class="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-20 backdrop-blur-sm transition-colors hidden lg:flex">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <ProductCard 
            v-for="product in products" 
            :key="product.id" 
            :product="product" 
            @add-to-cart="$emit('add-to-cart', $event)" 
            @quick-view="uiStore.openQuickView($event)"
          />
        </div>
      </div>
      
      <div class="mt-8 text-center sm:hidden">
        <NuxtLink to="/products" class="inline-flex items-center gap-2 text-brand-white hover:text-brand-peach transition-colors">
          Xem tất cả <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/utils/mockData'
import ProductCard from '~/components/product/ProductCard.vue'
import { useUiStore } from '~/stores/ui'

const uiStore = useUiStore()

defineProps<{
  products: Product[]
}>()

defineEmits(['add-to-cart'])
</script>
