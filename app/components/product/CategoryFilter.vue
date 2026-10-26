<template>
  <div class="w-full">
    <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 transform active:scale-95 cursor-pointer border"
        :class="activeCategoryId === cat.id 
          ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green shadow-md scale-[1.02]' 
          : 'bg-white text-gray-700 hover:text-brand-dark-green hover:bg-brand-cream/60 border-gray-200/80 hover:border-brand-gold/40 shadow-sm'"
        @click="$emit('select-category', cat.id)"
      >
        <span class="text-base sm:text-lg">{{ cat.icon }}</span>
        <span>{{ cat.name }}</span>
        <span 
          v-if="getCount(cat.id)"
          class="text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-0.5"
          :class="activeCategoryId === cat.id ? 'bg-brand-peach text-brand-dark-green' : 'bg-gray-100 text-gray-500'"
        >
          {{ getCount(cat.id) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALL_CATEGORY_ID, type Category, type Product } from '#shared/types/catalog'

const props = defineProps<{
  categories: Category[]
  activeCategoryId: number
  products: Product[]
}>()

defineEmits<{
  (e: 'select-category', id: number): void
}>()

const getCount = (categoryId: number) => {
  if (categoryId === ALL_CATEGORY_ID) return props.products.length
  return props.products.filter(p => p.categoryId === categoryId).length
}
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
