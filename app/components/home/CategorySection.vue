<template>
  <section class="pb-20 pt-10 bg-brand-white">
    <div class="container mx-auto px-6" v-motion-slide-visible-once-bottom>
      
      <div class="flex flex-col md:flex-row justify-between md:items-end mb-8 md:mb-12 gap-4">
        <div>
          <h2 class="font-heading text-4xl text-brand-dark-green font-bold mb-2">Danh mục sản phẩm</h2>
          <p class="text-gray-500">Khám phá hương vị yêu thích của bạn</p>
        </div>
        
        <div class="hidden md:flex gap-2">
          <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      
      <div class="flex gap-5 md:gap-8 overflow-x-auto pb-12 pt-4 scrollbar-hide snap-x px-2">
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          @click="$emit('select', cat.id)"
          class="relative flex-shrink-0 cursor-pointer snap-start w-24 h-36 md:w-32 md:h-48 rounded-full overflow-hidden group transition-all duration-500 transform"
          :class="activeCategoryId === cat.id ? '-translate-y-3 shadow-xl ring-2 ring-brand-gold ring-offset-4 ring-offset-brand-white opacity-100' : 'shadow-md opacity-70 hover:opacity-100 hover:-translate-y-1'"
        >
          <!-- Background -->
          <div class="absolute inset-0">
            <div v-if="cat.id === 1" class="w-full h-full bg-brand-dark-green flex items-center justify-center pb-8">
              <span class="text-4xl">🌿</span>
            </div>
            <img v-else src="https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=300&auto=format&fit=crop" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
          
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-brand-dark-green via-brand-dark-green/40 to-transparent"></div>
          
          <!-- Text Content -->
          <div class="absolute bottom-6 md:bottom-8 left-0 right-0 px-2 text-center">
            <span class="font-heading text-sm md:text-base text-brand-white font-medium leading-snug drop-shadow-md block">
              {{ cat.name }}
            </span>
          </div>
          
          <!-- Active Dot Indicator -->
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-gold transition-all duration-300"
               :class="activeCategoryId === cat.id ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { mockCategories } from '~/utils/mockData'

defineProps({
  activeCategoryId: {
    type: Number,
    required: true
  }
})

defineEmits(['select'])

const categories = mockCategories
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
