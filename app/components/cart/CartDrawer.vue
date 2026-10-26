<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div 
      v-if="uiStore.isCartDrawerOpen" 
      class="fixed inset-0 bg-brand-dark-green/60 backdrop-blur-sm z-50 transition-opacity duration-300"
      @click="uiStore.toggleCartDrawer(false)"
    ></div>

    <!-- Drawer -->
    <div 
      class="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-brand-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
      :class="uiStore.isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 flex items-center justify-between border-b border-gray-100 bg-white">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-dark-green">
            🍵
          </div>
          <h2 class="font-heading text-xl sm:text-2xl font-bold text-brand-dark-green">Giỏ hàng của bạn</h2>
          <span v-if="cartStore.totalItems > 0" class="text-xs font-bold bg-brand-peach/80 text-brand-dark-green px-2 py-0.5 rounded-full">
            {{ cartStore.totalItems }}
          </span>
        </div>
        <button 
          class="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700" 
          title="Đóng"
          @click="uiStore.toggleCartDrawer(false)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Free Shipping Banner Progress -->
      <div v-if="cartStore.items.length > 0" class="px-5 py-3 bg-brand-cream/60 border-b border-brand-cream">
        <div class="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span v-if="cartStore.amountNeededForFreeship > 0" class="text-brand-dark-green">
            Thêm <strong class="text-brand-gold font-bold">{{ cartStore.amountNeededForFreeship.toLocaleString('vi-VN') }}đ</strong> để được <strong class="text-green-700">Freeship</strong>
          </span>
          <span v-else class="text-green-700 font-bold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Chúc mừng! Bạn đã được Freeship
          </span>
          <span class="text-gray-500 text-[11px] font-bold">100k freeship</span>
        </div>
        <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            class="bg-gradient-to-r from-brand-peach to-brand-gold h-full rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(100, (cartStore.subtotal / cartStore.freeshipThreshold) * 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-grow overflow-y-auto p-5 sm:p-6 bg-brand-cream/20">
        <div v-if="cartStore.items.length === 0" class="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
          <div class="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
            🥣
          </div>
          <h3 class="font-heading text-lg font-bold text-brand-dark-green mb-1">Giỏ hàng chưa có món nào</h3>
          <p class="text-sm text-gray-500 mb-6 max-w-xs">Hãy khám phá thực đơn chè thanh mát tươi mới của Chè Cốc ngay nhé!</p>
          <NuxtLink 
            to="/products" 
            class="bg-brand-dark-green text-brand-cream px-6 py-3 rounded-full text-sm font-bold hover:bg-[#1a4132] transition-colors shadow-md" 
            @click="uiStore.toggleCartDrawer(false)"
          >
            Khám phá thực đơn
          </NuxtLink>
        </div>
        
        <div v-else class="space-y-3.5">
          <CartItem 
            v-for="item in cartStore.items" 
            :key="item.cartKey" 
            :item="item" 
          />
        </div>
      </div>

      <!-- Footer -->
      <div v-if="cartStore.items.length > 0" class="p-5 sm:p-6 border-t border-gray-100 bg-white shadow-lg">
        <div class="space-y-2 mb-4 text-sm text-gray-600">
          <div class="flex justify-between items-center">
            <span>Tạm tính</span>
            <span class="font-semibold text-brand-dark-green">{{ cartStore.subtotal.toLocaleString('vi-VN') }}đ</span>
          </div>

          <div class="flex justify-between items-center text-xs">
            <span>Phí giao hàng (ước tính)</span>
            <span v-if="cartStore.shippingFee === 0" class="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
              Miễn phí
            </span>
            <span v-else class="font-medium text-gray-700">
              {{ cartStore.shippingFee.toLocaleString('vi-VN') }}đ
            </span>
          </div>

          <div v-if="cartStore.discountAmount > 0" class="flex justify-between items-center text-xs text-red-600">
            <span>Giảm giá ({{ cartStore.appliedCoupon?.code }})</span>
            <span class="font-bold">-{{ cartStore.discountAmount.toLocaleString('vi-VN') }}đ</span>
          </div>

          <div class="pt-2 border-t border-gray-100 flex justify-between items-center text-brand-dark-green">
            <span class="font-heading font-bold text-lg">Tổng tiền</span>
            <span class="font-bold text-2xl text-brand-gold">{{ cartStore.orderTotal.toLocaleString('vi-VN') }}đ</span>
          </div>
        </div>

        <button 
          class="w-full bg-brand-dark-green text-brand-cream py-4 rounded-2xl font-bold hover:bg-[#1a4132] transition-all transform active:scale-[0.98] shadow-lg flex justify-center items-center gap-2 group cursor-pointer" 
          @click="proceedToCheckout"
        >
          <span>Tiến hành đặt hàng</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import CartItem from '~/components/cart/CartItem.vue'

const router = useRouter()
const cartStore = useCartStore()
const uiStore = useUiStore()

const proceedToCheckout = () => {
  uiStore.toggleCartDrawer(false)
  router.push('/checkout')
}
</script>
