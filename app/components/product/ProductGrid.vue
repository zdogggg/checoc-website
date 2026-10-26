<template>
  <div>
    <!-- Products Grid -->
    <div 
      v-if="products.length > 0" 
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
    >
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto"
    >
      <div class="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        🔍
      </div>
      <h3 class="font-heading text-xl font-bold text-brand-dark-green mb-2">Không tìm thấy món chè phù hợp</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Rất tiếc chúng tôi không tìm thấy kết quả phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử từ khóa khác hoặc làm mới bộ lọc.
      </p>
      <button 
        class="bg-brand-peach text-brand-dark-green font-bold px-6 py-2.5 rounded-full hover:bg-[#f3a886] transition-all text-sm shadow-sm" 
        @click="$emit('reset-filter')"
      >
        Xem tất cả món
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/catalog'
import ProductCard from '~/components/product/ProductCard.vue'

defineProps<{
  products: Product[]
}>()

defineEmits<{
  (e: 'reset-filter'): void
}>()
</script>
