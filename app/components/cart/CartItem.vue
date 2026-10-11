<template>
  <div class="flex gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
    <img 
      :src="item.image || 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=200&auto=format&fit=crop'" 
      :alt="item.name"
      class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-gray-100 shrink-0" 
    />
    <div class="flex-grow min-w-0 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start gap-2">
          <NuxtLink :to="`/products/${item.slug}`" @click="uiStore.toggleCartDrawer(false)" class="font-bold text-brand-dark-green text-sm sm:text-base hover:text-brand-gold transition-colors line-clamp-1">
            {{ item.name }}
          </NuxtLink>
          <button 
            @click="cartStore.removeItem(item.cartKey)" 
            class="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors shrink-0"
            title="Xóa món"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        <!-- Customizations -->
        <div v-if="item.options" class="mt-1 space-y-0.5 text-xs text-gray-500">
          <div class="flex items-center gap-2 text-brand-dark-green/70">
            <span class="inline-block bg-brand-cream/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-brand-dark-green">
              {{ item.options.sugar }}
            </span>
            <span class="inline-block bg-brand-cream/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-brand-dark-green">
              {{ item.options.ice }}
            </span>
          </div>
          
          <div v-if="item.options.toppings?.length" class="text-[11px] text-gray-500 line-clamp-1">
            <span class="text-brand-gold font-medium">+ Topping:</span> 
            {{ item.options.toppings.map((t: any) => t.name).join(', ') }}
          </div>

          <div v-if="item.options.note" class="text-[10px] italic text-gray-400 line-clamp-1">
            "{{ item.options.note }}"
          </div>
        </div>
      </div>
      
      <!-- Price & Quantity -->
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
        <div class="font-bold text-brand-dark-green text-sm sm:text-base">
          {{ (item.price * item.quantity).toLocaleString('vi-VN') }}đ
        </div>

        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
          <button 
            @click="cartStore.updateQuantity(item.cartKey, item.quantity - 1)" 
            class="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
            title="Giảm"
          >
            -
          </button>
          <span class="text-xs font-semibold w-4 text-center text-brand-dark-green">{{ item.quantity }}</span>
          <button 
            @click="cartStore.updateQuantity(item.cartKey, item.quantity + 1)" 
            class="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
            title="Tăng"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore, type CartItem } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

const cartStore = useCartStore()
const uiStore = useUiStore()

defineProps<{
  item: CartItem
}>()
</script>
