<template>
  <section class="py-24 bg-[#F7F1E5] relative overflow-hidden flex items-center min-h-[80vh]">
    <!-- Background Decor -->
    <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
      <h2 class="text-[20vw] font-serif font-bold whitespace-nowrap text-[#0D241B]">BEST SELLER</h2>
    </div>

    <div class="container mx-auto px-4 max-w-7xl relative z-10">
      <div class="flex flex-col lg:flex-row items-center gap-16">
        
        <!-- Text Content -->
        <div
v-motion
             class="flex-1 lg:pl-10 text-center lg:text-left order-1"
             :initial="{ opacity: 0, x: -50 }"
             :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 800 } }"
        >
          <div class="inline-flex items-center space-x-2 bg-[#F6B99F] px-4 py-1.5 rounded-full mb-6">
             <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span class="text-[#0D241B] text-xs font-bold uppercase tracking-wider">{{ product.badge === 'best-seller' ? 'Bán chạy' : 'Nên thử' }}</span>
          </div>
          
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-serif text-[#0D241B] font-bold mb-6 leading-tight">
            {{ product.name }}
          </h2>

          <p class="text-gray-700 text-lg mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
            {{ product.shortDescription || product.description }}
          </p>

          <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4">
             <button
               v-if="product.isAvailable"
               class="px-8 py-4 bg-[#0D241B] text-[#FFFDF8] rounded-full hover:bg-[#1a4132] transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1"
               @click="$emit('add-to-cart')"
             >
               Thêm vào giỏ - {{ formatVnd(product.price) }}
             </button>
             <span v-else class="px-6 py-3 rounded-full bg-gray-200 text-gray-600 font-medium">Tạm hết hôm nay</span>
             <NuxtLink :to="`/products/${product.slug}`" class="font-semibold underline text-[#0D241B]">Xem chi tiết</NuxtLink>
          </div>

          <!-- What goes into it, as entered in the menu -->
          <div v-if="highlights.length" class="mt-12 grid grid-cols-2 gap-6 text-left border-t border-[#0D241B]/10 pt-8">
            <div v-for="(item, i) in highlights" :key="item" class="flex flex-col">
              <span class="text-[#D9A441] text-2xl font-serif mb-1">{{ String(i + 1).padStart(2, '0') }}</span>
              <h4 class="text-[#0D241B] font-semibold mb-1">{{ item }}</h4>
            </div>
          </div>
        </div>

        <!-- Huge Image -->
        <div
v-motion
             class="flex-1 relative order-2 mt-12 lg:mt-0"
             :initial="{ opacity: 0, scale: 0.8, rotate: -5 }"
             :visibleOnce="{ opacity: 1, scale: 1, rotate: 0, transition: { duration: 1000, type: 'spring' } }"
        >
          <!-- Blob background -->
          <div class="absolute inset-0 bg-[#DDE8D6] rounded-full blur-3xl opacity-50 scale-110 mix-blend-multiply"></div>
          
          <img
loading="lazy" decoding="async" 
            :src="imageAt(product.image, 800) || PLACEHOLDER_IMAGE"
            :alt="product.name"
            class="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl object-cover aspect-[4/5] transform hover:scale-[1.02] transition-transform duration-700"
          />
          
          <!-- Floating badge -->
          <div
v-motion
               class="absolute right-0 md:-right-4 top-1/4 md:top-1/4 bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-xl z-20 scale-90 md:scale-100 origin-right"
               :initial="{ y: 0 }"
               :enter="{ y: [-10, 10, -10], transition: { duration: 4000, repeat: Infinity } }"
          >
            <div class="flex items-center gap-2 md:gap-3">
              <div class="w-8 h-8 md:w-12 md:h-12 bg-[#F7F1E5] rounded-full flex items-center justify-center text-sm md:text-xl shrink-0 text-brand-gold"><AppIcon name="sparkles" /></div>
              <div>
                <p class="text-[10px] md:text-xs text-gray-500 font-medium whitespace-nowrap">{{ product.badge === 'best-seller' ? 'Bán chạy nhất' : 'Món nổi bật' }}</p>
                <p class="text-xs md:text-sm font-bold text-[#0D241B] whitespace-nowrap">{{ product.categoryName }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/catalog'

const props = defineProps<{ product: Product }>()
defineEmits(['add-to-cart'])

const highlights = computed(() => (props.product.ingredients.length ? props.product.ingredients : props.product.toppings).slice(0, 2))
</script>
