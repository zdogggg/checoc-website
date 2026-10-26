<template>
  <Teleport to="body">
    <div 
      v-if="uiStore.isQuickViewOpen && product" 
      class="fixed inset-0 bg-brand-dark-green/60 backdrop-blur-sm z-[60] transition-opacity flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      @click="uiStore.closeQuickView"
    >
      <div 
        class="bg-brand-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all duration-300 relative max-h-[92vh] border border-brand-gold/20"
        @click.stop
      >
        <!-- Close button -->
        <button 
          class="absolute top-3 right-3 z-30 w-9 h-9 bg-white/90 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-brand-dark-green shadow-sm transition-colors" 
          title="Đóng"
          @click="uiStore.closeQuickView"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <!-- Product Image -->
        <div class="md:w-5/12 relative bg-brand-cream shrink-0 h-56 md:h-auto">
          <img 
            :src="product?.image || 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop'" 
            class="w-full h-full object-cover" 
            :alt="product?.name || 'Chè Cốc'"
          />
          <div v-if="product?.badge" class="absolute top-3 left-3">
            <span class="bg-brand-gold text-brand-dark-green text-xs font-bold px-2.5 py-1 rounded-full shadow-sm inline-flex items-center gap-1">
              <AppIcon :name="BADGE_ICONS[product.badge]" :filled="product.badge === 'best-seller'" />
              {{ BADGE_LABELS[product.badge] }}
            </span>
          </div>
        </div>

        <!-- Details & Options -->
        <div class="md:w-7/12 p-5 sm:p-7 flex flex-col overflow-y-auto bg-brand-white">
          <div class="mb-4 pb-4 border-b border-gray-100">
            <div class="flex items-center gap-2 text-xs text-brand-gold font-bold mb-1">
              <span>{{ product?.categoryName }}</span>
              <span>•</span>
              <span class="flex items-center gap-0.5 text-amber-500">
                <AppIcon name="star" filled /> {{ product?.rating || 4.9 }}
              </span>
            </div>
            <h2 class="font-heading text-2xl sm:text-3xl font-bold text-brand-dark-green mb-1.5 leading-snug">
              {{ product?.name }}
            </h2>
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-brand-gold font-bold text-2xl">
                {{ unitPrice.toLocaleString('vi-VN') }}đ
              </span>
              <span v-if="product?.originalPrice" class="text-sm text-gray-400 line-through">
                {{ product?.originalPrice?.toLocaleString('vi-VN') }}đ
              </span>
            </div>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
              {{ product?.description || product?.shortDescription }}
            </p>
          </div>

          <!-- Options -->
          <div class="space-y-4 mb-6">
            <!-- Sugar -->
            <div>
              <label class="block text-xs font-bold text-brand-dark-green mb-1.5 uppercase tracking-wider">
                Độ ngọt: <span class="text-brand-gold">{{ selectedSugar }}</span>
              </label>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <button 
                  v-for="opt in sugarOptions" 
                  :key="opt.id"
                  type="button"
                  class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer"
                  :class="selectedSugar === opt.shortLabel ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-gold/40'"
                  @click="selectedSugar = opt.shortLabel"
                >
                  {{ opt.shortLabel }}
                </button>
              </div>
            </div>

            <!-- Ice -->
            <div>
              <label class="block text-xs font-bold text-brand-dark-green mb-1.5 uppercase tracking-wider">
                Lượng đá: <span class="text-brand-gold">{{ selectedIce }}</span>
              </label>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <button 
                  v-for="opt in iceOptions" 
                  :key="opt.id"
                  type="button"
                  class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer"
                  :class="selectedIce === opt.shortLabel ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-gold/40'"
                  @click="selectedIce = opt.shortLabel"
                >
                  {{ opt.shortLabel }}
                </button>
              </div>
            </div>

            <!-- Extra Toppings -->
            <div>
              <label class="block text-xs font-bold text-brand-dark-green mb-1.5 uppercase tracking-wider">
                Thêm Topping (+giá)
              </label>
              <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <label 
                  v-for="top in extraToppings.slice(0, 4)" 
                  :key="top.id"
                  class="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-brand-cream/40 cursor-pointer text-xs transition-colors"
                  :class="isToppingSelected(top.name) ? 'bg-brand-cream/60 border-brand-gold/40 font-semibold' : 'bg-white'"
                >
                  <div class="flex items-center gap-2">
                    <input 
                      v-model="selectedToppings" 
                      type="checkbox" 
                      :value="top"
                      class="rounded text-brand-dark-green focus:ring-brand-gold"
                    />
                    <span>{{ top.name }}</span>
                  </div>
                  <span class="text-brand-gold font-bold">+{{ top.price.toLocaleString('vi-VN') }}đ</span>
                </label>
              </div>
            </div>

            <!-- Quantity -->
            <div class="flex items-center justify-between pt-2">
              <span class="text-xs font-bold text-brand-dark-green uppercase tracking-wider">Số lượng</span>
              <div class="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                <button 
                  class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-sm font-bold hover:bg-gray-50 transition-colors" 
                  @click="quantity > 1 ? quantity-- : null"
                >
                  -
                </button>
                <span class="font-bold w-6 text-center text-sm">{{ quantity }}</span>
                <button 
                  class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-sm font-bold hover:bg-gray-50 transition-colors" 
                  @click="quantity++"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- CTAs -->
          <div class="mt-auto space-y-2">
            <button 
              class="w-full bg-brand-dark-green text-brand-cream py-3.5 rounded-xl font-bold hover:bg-[#1a4132] transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer" 
              @click="addToCart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Thêm vào giỏ • {{ (unitPrice * quantity).toLocaleString('vi-VN') }}đ
            </button>

            <NuxtLink 
              v-if="product?.slug"
              :to="`/products/${product.slug}`" 
              class="block text-center text-xs text-brand-gold hover:underline py-1 font-semibold"
              @click="uiStore.closeQuickView"
            >
              Xem trang chi tiết món ăn →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUiStore } from '~/stores/ui'
import { useCartStore } from '~/stores/cart'
import type { ToppingOption } from '#shared/types/catalog'

const uiStore = useUiStore()
const cartStore = useCartStore()

const { data: productOptions } = await useProductOptions()
const sugarOptions = computed(() => productOptions.value.sugar)
const iceOptions = computed(() => productOptions.value.ice)
const extraToppings = computed(() => productOptions.value.toppings)
const defaultSugar = () => (sugarOptions.value.find(o => o.default) ?? sugarOptions.value[0])?.shortLabel ?? '100% đường'
const defaultIce = () => (iceOptions.value.find(o => o.default) ?? iceOptions.value[0])?.shortLabel ?? 'Đá riêng'

const product = computed(() => uiStore.selectedProduct)
const quantity = ref(1)
const selectedSugar = ref(defaultSugar())
const selectedIce = ref(defaultIce())
const selectedToppings = ref<ToppingOption[]>([])

const isToppingSelected = (name: string) => {
  return selectedToppings.value.some(t => t.name === name)
}

const unitPrice = computed(() => {
  if (!product.value) return 0
  const toppingsTotal = selectedToppings.value.reduce((sum, t) => sum + (t.price || 0), 0)
  return (product.value.price || 0) + toppingsTotal
})

watch(() => uiStore.isQuickViewOpen, (isOpen) => {
  if (isOpen) {
    quantity.value = 1
    selectedSugar.value = defaultSugar()
    selectedIce.value = defaultIce()
    selectedToppings.value = []
  }
})

const addToCart = () => {
  if (!product.value) return
  cartStore.addItem(product.value, quantity.value, {
    sugar: selectedSugar.value,
    ice: selectedIce.value,
    toppings: selectedToppings.value.map(t => ({ name: t.name, price: t.price }))
  })
  uiStore.showToast(`Đã thêm ${quantity.value} ${product.value.name} vào giỏ hàng!`)
  uiStore.closeQuickView()
  uiStore.toggleCartDrawer(true)
}
</script>
