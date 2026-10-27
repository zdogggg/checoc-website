<template>
  <div class="bg-white text-brand-dark-green rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-100/80 relative">
    <!-- Image & Badges -->
    <div class="aspect-square bg-brand-cream relative overflow-hidden cursor-pointer" @click="navigateToProduct">
      <img 
        :src="product.image || 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop'" 
        class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
        :alt="product.name" 
        loading="lazy"
      />
      
      <!-- Gradient overlay on bottom of image -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <!-- Badge -->
      <div v-if="product.badge" class="absolute top-2.5 left-2.5 z-10">
        <span 
          v-if="product.badge === 'best-seller'" 
          class="bg-[#D9A441] text-brand-dark-green text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"
        >
          <AppIcon name="star" filled /> Bán chạy
        </span>
        <span 
          v-else-if="product.badge === 'new'" 
          class="bg-[#F6B99F] text-brand-dark-green text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"
        >
          <AppIcon name="sparkles" /> Món mới
        </span>
        <span 
          v-else-if="product.badge === 'signature'" 
          class="bg-brand-dark-green text-brand-cream text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"
        >
          <AppIcon name="crown" /> Đặc biệt
        </span>
        <span 
          v-else-if="product.badge === 'sale'" 
          class="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"
        >
          <AppIcon name="flame" /> Giảm giá
        </span>
      </div>

      <!-- Quick View button (Desktop hover) -->
      <button 
        class="hidden sm:flex absolute bottom-3 right-3 w-9 h-9 bg-white/90 hover:bg-white text-brand-dark-green rounded-full items-center justify-center shadow-md transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10"
        title="Xem nhanh"
        @click.stop="openQuickView"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

      <!-- Favorite button -->
      <button 
        class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
        :class="isFavorite ? 'bg-red-50 text-red-500 shadow-sm' : 'bg-black/20 hover:bg-white text-white hover:text-red-500 backdrop-blur-sm'"
        title="Yêu thích"
        @click.stop="toggleFavorite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </button>
    </div>
    
    <!-- Info -->
    <div class="p-3 sm:p-5 flex flex-col flex-grow">
      <!-- Category & Rating -->
      <div class="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
        <span class="truncate max-w-[120px] text-brand-dark-green/70 font-medium">{{ product.categoryName || 'Chè đặc sắc' }}</span>
        <div class="flex items-center gap-1 text-amber-500 font-bold shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>{{ product.rating || 4.9 }}</span>
        </div>
      </div>

      <!-- Title -->
      <h3 
        class="font-heading font-bold text-sm sm:text-base leading-snug mb-1.5 text-brand-dark-green hover:text-brand-gold transition-colors line-clamp-1 cursor-pointer"
        :title="product.name"
        @click="navigateToProduct"
      >
        {{ product.name }}
      </h3>

      <!-- Short Description -->
      <p class="text-gray-500 text-xs mb-3 line-clamp-2 min-h-[32px] leading-relaxed hidden sm:block">
        {{ product.shortDescription }}
      </p>
      
      <!-- Price & CTA -->
      <div class="mt-auto pt-2">
        <div class="flex items-baseline gap-1.5 mb-2.5">
          <span class="font-bold text-base sm:text-lg text-brand-dark-green">
            {{ product.price.toLocaleString('vi-VN') }}đ
          </span>
          <span v-if="product.originalPrice" class="text-xs text-gray-400 line-through">
            {{ product.originalPrice.toLocaleString('vi-VN') }}đ
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <button 
            class="flex-grow bg-[#F6B99F] text-brand-dark-green font-bold py-2 sm:py-2.5 px-3 rounded-xl hover:bg-[#f3a886] transition-all transform active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm" 
            @click="handleAddToCart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span>Thêm</span>
          </button>

          <NuxtLink 
            :to="`/products/${product.slug}`" 
            class="sm:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-brand-dark-green shrink-0"
            title="Chi tiết"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Product } from '#shared/types/catalog'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'add-to-cart' | 'quick-view', product: Product): void
}>()

const router = useRouter()
const cartStore = useCartStore()
const uiStore = useUiStore()
const isFavorite = ref(false)

const navigateToProduct = () => {
  router.push(`/products/${props.product.slug}`)
}

const openQuickView = () => {
  emit('quick-view', props.product)
  uiStore.openQuickView(props.product)
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  if (isFavorite.value) {
    uiStore.showToast(`Đã thêm ${props.product.name} vào mục Yêu thích!`)
  }
}

const handleAddToCart = () => {
  emit('add-to-cart', props.product)
  cartStore.addItem(props.product, 1)
  uiStore.showToast(`Đã thêm 1 ${props.product.name} vào giỏ hàng!`)
}
</script>
