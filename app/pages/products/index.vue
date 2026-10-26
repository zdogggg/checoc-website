<template>
  <div class="pt-24 sm:pt-28 pb-20 min-h-screen bg-[var(--color-cream)]">
    <!-- Header Banner -->
    <div class="bg-brand-dark-green text-white py-10 sm:py-14 px-4 sm:px-8 mb-8 sm:mb-12 relative overflow-hidden">
      <!-- Decorative background blur circles -->
      <div class="absolute -top-16 -right-16 w-64 h-64 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-peach/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto max-w-6xl relative z-10 text-center">
        <!-- Breadcrumbs -->
        <div class="flex items-center justify-center gap-2 text-xs text-white/60 mb-3">
          <NuxtLink to="/" class="hover:text-brand-peach transition-colors">Trang chủ</NuxtLink>
          <span>/</span>
          <span class="text-brand-peach font-semibold">Thực đơn</span>
        </div>

        <h1 class="font-heading text-3xl sm:text-5xl font-bold mb-3 tracking-wide">
          Thực Đơn Chè Cốc
        </h1>
        <p class="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-6 font-light">
          Hương vị truyền thống trong từng ly hiện đại — 100% nguyên liệu tự nhiên tươi ngon chế biến mỗi ngày.
        </p>

        <!-- Search Bar -->
        <div class="max-w-md mx-auto relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Tìm kiếm chè, topping, sầu riêng, sen..."
            class="w-full bg-white/95 text-brand-dark-green placeholder-gray-400 pl-11 pr-10 py-3 rounded-full text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
          />
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <button 
            v-if="searchQuery" 
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
            @click="searchQuery = ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="container mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Category Filter Pills -->
      <div class="mb-6 sm:mb-8">
        <CategoryFilter 
          :categories="categories" 
          :active-category-id="selectedCategoryId" 
          :products="products"
          @select-category="handleCategorySelect"
        />
      </div>

      <!-- Controls Row: Badges filter + Sorting + Count -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200/60">
        <!-- Quick Tag Badges -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button 
            v-for="filter in tagFilters"
            :key="filter.value"
            class="text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 border"
            :class="activeTag === filter.value 
              ? 'bg-brand-peach text-brand-dark-green border-brand-peach font-bold shadow-sm' 
              : 'bg-white/80 text-gray-600 border-gray-200 hover:border-gray-300'"
            @click="activeTag = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Sort Dropdown & Counter -->
        <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs sm:text-sm">
          <span class="text-gray-500 font-medium">
            <strong>{{ filteredProducts.length }}</strong> món
          </span>

          <div class="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <span class="text-gray-400 text-xs hidden sm:inline">Sắp xếp:</span>
            <select 
              v-model="selectedSort" 
              class="bg-transparent text-brand-dark-green font-medium text-xs sm:text-sm focus:outline-none cursor-pointer"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Product Grid -->
      <ProductGrid 
        :products="filteredProducts" 
        @reset-filter="resetAllFilters"
      />

      <!-- Benefits / Delivery Assurance Banner -->
      <div class="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-brand-gold/20 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
            🛵
          </div>
          <h4 class="font-heading font-bold text-base text-brand-dark-green mb-1">Giao Nhanh 30 Phút</h4>
          <p class="text-xs text-gray-500 leading-relaxed max-w-xs">Chè được bảo quản trong túi giữ nhiệt chuyên dụng, đá để riêng chuẩn lạnh mát.</p>
        </div>

        <div class="flex flex-col items-center">
          <div class="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
            🌿
          </div>
          <h4 class="font-heading font-bold text-base text-brand-dark-green mb-1">100% Tự Nhiên</h4>
          <p class="text-xs text-gray-500 leading-relaxed max-w-xs">Không chất bảo quản, không hương liệu nhân tạo, nấu mới mỗi ngày theo công thức gia truyền.</p>
        </div>

        <div class="flex flex-col items-center">
          <div class="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
            🎁
          </div>
          <h4 class="font-heading font-bold text-base text-brand-dark-green mb-1">Freeship Đơn Từ 100k</h4>
          <p class="text-xs text-gray-500 leading-relaxed max-w-xs">Áp dụng cho mọi đơn hàng đặt trực tiếp trên website hôm nay.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ALL_CATEGORY_ID } from '#shared/types/catalog'
import CategoryFilter from '~/components/product/CategoryFilter.vue'
import ProductGrid from '~/components/product/ProductGrid.vue'

// SEO
useHead({
  title: 'Thực Đơn Chè Cốc — Món Ngon Truyền Thống Tươi Mới',
  meta: [
    { name: 'description', content: 'Khám phá hơn 12 món chè truyền thống, chè Thái sầu riêng, chè khúc bạch và đồ ăn vặt tươi ngon tại Chè Cốc. Giao hàng nhanh 30 phút.' }
  ]
})

const searchQuery = ref('')
const [categories, { data: products }] = await Promise.all([useCategoryFilters(), useProducts()])

const selectedCategoryId = ref(ALL_CATEGORY_ID)
const activeTag = ref('all')
const selectedSort = ref('popular')

const tagFilters = [
  { label: 'Tất cả', value: 'all' },
  { label: '⭐ Bán chạy', value: 'best-seller' },
  { label: '👑 Đặc biệt', value: 'signature' },
  { label: '🔥 Đang giảm giá', value: 'sale' },
  { label: '✨ Món mới', value: 'new' }
]

const handleCategorySelect = (id: number) => {
  selectedCategoryId.value = id
}

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedCategoryId.value = ALL_CATEGORY_ID
  activeTag.value = 'all'
  selectedSort.value = 'popular'
}

const filteredProducts = computed(() => {
  let list = [...products.value]

  // Category filter
  if (selectedCategoryId.value !== ALL_CATEGORY_ID) {
    list = list.filter(p => p.categoryId === selectedCategoryId.value)
  }

  // Tag badge filter
  if (activeTag.value !== 'all') {
    list = list.filter(p => p.badge === activeTag.value)
  }

  // Search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.ingredients?.some(i => i.toLowerCase().includes(query)) ||
      p.toppings?.some(t => t.toLowerCase().includes(query))
    )
  }

  // Sorting
  if (selectedSort.value === 'price-asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (selectedSort.value === 'price-desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (selectedSort.value === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  } else if (selectedSort.value === 'popular') {
    // Sort best-sellers and signatures first
    list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
  }

  return list
})
</script>
