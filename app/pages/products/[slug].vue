<template>
  <div class="pt-24 sm:pt-28 pb-24 sm:pb-20 min-h-screen bg-[var(--color-cream)]">
    <!-- Breadcrumbs -->
    <div class="container mx-auto max-w-6xl px-4 sm:px-6 mb-6">
      <nav class="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
        <NuxtLink to="/" class="hover:text-brand-dark-green transition-colors">Trang chủ</NuxtLink>
        <span>/</span>
        <NuxtLink to="/products" class="hover:text-brand-dark-green transition-colors">Thực đơn</NuxtLink>
        <span>/</span>
        <span class="text-brand-dark-green font-semibold truncate">{{ product?.name || 'Chi tiết' }}</span>
      </nav>
    </div>

    <!-- Main Product Detail Section -->
    <div v-if="product" class="container mx-auto max-w-6xl px-4 sm:px-6">
      <div class="bg-white rounded-3xl p-5 sm:p-10 shadow-sm border border-gray-100/80 mb-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Column Left: Image Gallery (5 cols) -->
          <div class="lg:col-span-5 flex flex-col gap-4">
            <!-- Main Display Image -->
            <div class="aspect-square rounded-2xl overflow-hidden bg-brand-cream relative group shadow-inner border border-gray-100">
              <img 
                :src="activeImage || product?.image" 
                :alt="product?.name || 'Chè Cốc'" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              
              <!-- Badge -->
              <div v-if="product?.badge" class="absolute top-3.5 left-3.5 z-10">
                <span 
                  v-if="product?.badge === 'best-seller'" 
                  class="bg-[#D9A441] text-brand-dark-green text-xs font-bold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1"
                >
                  <AppIcon name="star" filled /> Món bán chạy nhất
                </span>
                <span 
                  v-else-if="product?.badge === 'signature'" 
                  class="bg-brand-dark-green text-brand-cream text-xs font-bold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1"
                >
                  <AppIcon name="crown" /> Món đặc sản quán
                </span>
                <span 
                  v-else-if="product?.badge === 'sale'" 
                  class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1"
                >
                  <AppIcon name="flame" /> Ưu đãi đặc biệt
                </span>
                <span 
                  v-else 
                  class="bg-[#F6B99F] text-brand-dark-green text-xs font-bold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1"
                >
                  <AppIcon name="sparkles" /> Món mới ra mắt
                </span>
              </div>
            </div>

            <!-- Thumbnails Row -->
            <div v-if="galleryList.length > 1" class="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              <button 
                v-for="(img, idx) in galleryList" 
                :key="idx"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer"
                :class="activeImage === img ? 'border-brand-gold ring-2 ring-brand-gold/30 scale-[1.02]' : 'border-gray-200 opacity-70 hover:opacity-100'"
                @click="activeImage = img"
              >
                <img :src="img" :alt="`${product?.name || 'Chè'} ${idx + 1}`" class="w-full h-full object-cover" />
              </button>
            </div>

            <!-- Quick Prep & Quality Tag -->
            <div class="bg-brand-cream/50 rounded-2xl p-4 flex items-center justify-around text-center text-xs text-brand-dark-green border border-brand-gold/15">
              <div class="flex flex-col items-center">
                <AppIcon name="timer" class="text-base mb-1 text-brand-gold" />
                <span class="font-bold">Chuẩn bị</span>
                <span class="text-gray-500 text-[11px]">{{ product?.prepTime || '5 phút' }}</span>
              </div>
              <div class="w-px h-8 bg-gray-200"></div>
              <div class="flex flex-col items-center">
                <AppIcon name="snowflake" class="text-base mb-1 text-brand-gold" />
                <span class="font-bold">Bảo quản</span>
                <span class="text-gray-500 text-[11px]">Đá riêng mát lạnh</span>
              </div>
              <div class="w-px h-8 bg-gray-200"></div>
              <div class="flex flex-col items-center">
                <AppIcon name="leaf" class="text-base mb-1 text-brand-gold" />
                <span class="font-bold">Nguyên liệu</span>
                <span class="text-gray-500 text-[11px]">100% Tự nhiên</span>
              </div>
            </div>
          </div>

          <!-- Column Right: Product Info & Customization Builder (7 cols) -->
          <div class="lg:col-span-7 flex flex-col">
            <!-- Header Info -->
            <div class="border-b border-gray-100 pb-5 mb-5">
              <div class="flex items-center gap-2 text-xs font-semibold text-brand-gold mb-2">
                <span>{{ product?.categoryName }}</span>
              </div>

              <h1 class="font-heading text-2xl sm:text-4xl font-bold text-brand-dark-green mb-3 leading-tight">
                {{ product?.name }}
              </h1>

              <!-- Price breakdown -->
              <div class="flex items-baseline gap-3 mb-3">
                <span class="font-heading font-bold text-3xl sm:text-4xl text-brand-gold">
                  {{ unitPrice.toLocaleString('vi-VN') }}đ
                </span>
                <span v-if="product?.originalPrice" class="text-base text-gray-400 line-through">
                  {{ product?.originalPrice?.toLocaleString('vi-VN') }}đ
                </span>
                <span v-if="product?.originalPrice" class="bg-red-50 text-red-600 font-bold text-xs px-2 py-0.5 rounded-full">
                  Tiết kiệm {{ ((product?.originalPrice || 0) - (product?.price || 0)).toLocaleString('vi-VN') }}đ
                </span>
              </div>

              <p class="text-gray-600 text-sm leading-relaxed">
                {{ product?.description }}
              </p>
            </div>

            <!-- Customization Form -->
            <div class="space-y-6 mb-8">
              <!-- 1. Sugar Level -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-brand-dark-green">
                    1. Mức ngọt
                  </label>
                  <span class="text-xs text-brand-gold font-bold">{{ selectedSugar.label }}</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button 
                    v-for="opt in sugarOptions" 
                    :key="opt.id"
                    type="button"
                    class="p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer flex flex-col justify-center"
                    :class="selectedSugar.id === opt.id 
                      ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-gold/40 hover:bg-brand-cream/30'"
                    @click="selectedSugar = opt"
                  >
                    <span class="font-bold">{{ opt.shortLabel }}</span>
                    <span class="text-[10px] opacity-80 mt-0.5 truncate">{{ opt.label.replace(opt.shortLabel, '').trim() || 'Tiêu chuẩn' }}</span>
                  </button>
                </div>
              </div>

              <!-- 2. Ice Level -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-brand-dark-green">
                    2. Lượng đá
                  </label>
                  <span class="text-xs text-brand-gold font-bold">{{ selectedIce.label }}</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button 
                    v-for="opt in iceOptions" 
                    :key="opt.id"
                    type="button"
                    class="p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer flex flex-col justify-center"
                    :class="selectedIce.id === opt.id 
                      ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-gold/40 hover:bg-brand-cream/30'"
                    @click="selectedIce = opt"
                  >
                    <span class="font-bold">{{ opt.shortLabel }}</span>
                    <span class="text-[10px] opacity-80 mt-0.5 truncate">{{ opt.label.replace(opt.shortLabel, '').trim() || 'Đá chuẩn' }}</span>
                  </button>
                </div>
              </div>

              <!-- 3. Toppings Selection -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-brand-dark-green">
                    3. Thêm Topping tự chọn (Tùy thích)
                  </label>
                  <span v-if="selectedToppings.length > 0" class="text-xs text-brand-gold font-semibold">
                    Đã chọn {{ selectedToppings.length }} món
                  </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label 
                    v-for="top in extraToppings" 
                    :key="top.id"
                    class="flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs"
                    :class="isToppingSelected(top.name) 
                      ? 'bg-brand-cream/80 border-brand-gold font-semibold shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-brand-gold/30 hover:bg-gray-50'"
                  >
                    <div class="flex items-center gap-2.5">
                      <input 
                        v-model="selectedToppings" 
                        type="checkbox" 
                        :value="top"
                        class="w-4 h-4 rounded text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green cursor-pointer"
                      />
                      <span>{{ top.name }}</span>
                    </div>
                    <span class="text-brand-gold font-bold shrink-0">+{{ top.price.toLocaleString('vi-VN') }}đ</span>
                  </label>
                </div>
              </div>

              <!-- 4. Special Note -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                  4. Ghi chú thêm cho quán
                </label>
                <input 
                  v-model="specialNote" 
                  type="text" 
                  placeholder="VD: Để đá riêng túi zip, không lấy dừa nạo, cho thêm thìa..."
                  class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-brand-dark-green focus:outline-none focus:ring-2 focus:ring-brand-gold placeholder-gray-400"
                />
              </div>

              <!-- 5. Quantity & Total Counter -->
              <div class="p-4 bg-brand-cream/30 rounded-2xl border border-brand-gold/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span class="text-xs text-gray-500 font-medium block">Tổng tiền cốc này:</span>
                  <span class="font-heading text-2xl font-bold text-brand-dark-green">
                    {{ (unitPrice * quantity).toLocaleString('vi-VN') }}đ
                  </span>
                </div>

                <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                  <button 
                    type="button"
                    class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-brand-dark-green font-bold text-base hover:bg-gray-200 transition-colors" 
                    @click="quantity > 1 ? quantity-- : null"
                  >
                    -
                  </button>
                  <span class="font-bold w-6 text-center text-sm">{{ quantity }}</span>
                  <button 
                    type="button"
                    class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-brand-dark-green font-bold text-base hover:bg-gray-200 transition-colors" 
                    @click="quantity++"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Buttons (Desktop / Tablet) -->
            <div class="mt-auto hidden sm:flex items-center gap-4">
              <button 
                class="flex-1 bg-brand-dark-green text-brand-cream py-4 px-6 rounded-2xl font-bold hover:bg-[#1a4132] transition-all transform active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 cursor-pointer" 
                @click="addToCart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <span>Thêm vào giỏ hàng • {{ (unitPrice * quantity).toLocaleString('vi-VN') }}đ</span>
              </button>

              <button 
                class="bg-brand-peach text-brand-dark-green py-4 px-8 rounded-2xl font-bold hover:bg-[#f3a886] transition-all transform active:scale-[0.99] shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0" 
                @click="buyNow"
              >
                <span>Mua ngay</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Tabs & Accordion (Ingredients, Nutrition, Storage) -->
      <div class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100/80 mb-12">
        <h3 class="font-heading text-2xl font-bold text-brand-dark-green mb-6 pb-3 border-b border-gray-100">
          Thông tin chi tiết & Công thức
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Ingredients -->
          <div>
            <h4 class="font-bold text-sm text-brand-dark-green mb-3 flex items-center gap-2">
              <AppIcon name="leaf" class="text-green-600" /> Thành phần nguyên liệu
            </h4>
            <ul class="space-y-2 text-xs text-gray-600">
              <li v-for="(item, idx) in (product?.ingredients || [])" :key="idx" class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Nutrition -->
          <div>
            <h4 class="font-bold text-sm text-brand-dark-green mb-3 flex items-center gap-2">
              <AppIcon name="chart" class="text-amber-500" /> Bảng dinh dưỡng ước tính
            </h4>
            <div class="bg-brand-cream/40 rounded-xl p-3.5 space-y-2 text-xs text-gray-600 border border-brand-gold/10">
              <div class="flex justify-between">
                <span>Năng lượng:</span>
                <strong class="text-brand-dark-green">{{ product?.nutrition?.calories || '280 kcal' }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Lượng đường:</span>
                <strong class="text-brand-dark-green">{{ product?.nutrition?.sugar || '18g' }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Chất béo tự nhiên:</span>
                <strong class="text-brand-dark-green">{{ product?.nutrition?.fat || '5g' }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Quy cách cốc:</span>
                <strong class="text-brand-dark-green">{{ product?.nutrition?.serving || '450ml' }}</strong>
              </div>
            </div>
          </div>

          <!-- Storage guide -->
          <div>
            <h4 class="font-bold text-sm text-brand-dark-green mb-3 flex items-center gap-2">
              <AppIcon name="snowflake" class="text-blue-500" /> Cách thưởng thức & Bảo quản
            </h4>
            <p class="text-xs text-gray-600 leading-relaxed mb-3">
              Ngon nhất khi dùng ngay sau khi nhận hàng. Nếu chưa ăn liền, vui lòng để chè trong ngăn mát tủ lạnh (dưới 5°C) và không trộn đá trước.
            </p>
            <div class="text-[11px] text-brand-gold font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex gap-1.5">
              <AppIcon name="lightbulb" class="text-sm mt-px" />
              Mẹo nhỏ: Đổ đá vào từ từ và trộn đều để chè đạt độ thanh mát lý tưởng nhất!
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <div v-if="relatedProducts.length > 0">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-heading text-2xl font-bold text-brand-dark-green">
            Món ngon cùng loại
          </h3>
          <NuxtLink to="/products" class="text-xs text-brand-gold font-bold hover:underline">
            Xem thêm →
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <ProductCard 
            v-for="rel in relatedProducts" 
            :key="rel.id" 
            :product="rel" 
          />
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Floating Order Bar -->
    <div 
      v-if="product" 
      class="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md shadow-2xl z-40 border-t border-gray-200 sm:hidden flex items-center justify-between gap-3"
    >
      <div>
        <div class="text-[10px] text-gray-500 uppercase font-semibold">Tạm tính</div>
        <div class="font-heading font-bold text-lg text-brand-dark-green">
          {{ (unitPrice * quantity).toLocaleString('vi-VN') }}đ
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          class="bg-brand-peach text-brand-dark-green font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm" 
          @click="addToCart"
        >
          Thêm giỏ
        </button>
        <button 
          class="bg-brand-dark-green text-brand-cream font-bold text-xs px-4 py-2.5 rounded-xl shadow-md" 
          @click="buyNow"
        >
          Đặt ngay
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CustomOption, ToppingOption } from '#shared/types/catalog'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import ProductCard from '~/components/product/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const uiStore = useUiStore()

const slug = computed(() => route.params.slug as string)
const [{ data: detail, error }, { data: productOptions }] = await Promise.all([
  useProductDetail(slug),
  useProductOptions()
])

if (error.value || !detail.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
}

const product = computed(() => detail.value?.product)
const sugarOptions = computed(() => productOptions.value.sugar)
const iceOptions = computed(() => productOptions.value.ice)
const extraToppings = computed(() => productOptions.value.toppings)

const pickDefault = (list: CustomOption[], fallback: string): CustomOption =>
  list.find(o => o.default) ?? list[0] ?? { id: fallback, label: fallback, shortLabel: fallback }
const defaultSugar = pickDefault(sugarOptions.value, '100% đường')
const defaultIce = pickDefault(iceOptions.value, 'Đá riêng')

const activeImage = ref('')
const quantity = ref(1)
const selectedSugar = ref<CustomOption>(defaultSugar)
const selectedIce = ref<CustomOption>(defaultIce)
const selectedToppings = ref<ToppingOption[]>([])
const specialNote = ref('')

const galleryList = computed(() => {
  if (!product.value) return []
  return product.value.galleryImages?.length ? product.value.galleryImages : [product.value.image]
})

watch(product, (newP) => {
  if (newP) {
    activeImage.value = newP.image
    quantity.value = 1
    selectedSugar.value = defaultSugar
    selectedIce.value = defaultIce
    selectedToppings.value = []
    specialNote.value = ''
  }
}, { immediate: true })

// SEO: meta + schema.org Product. Ratings are left out on purpose: they are not
// collected from real buyers yet, and search engines penalise unverifiable reviews.
const origin = useSiteOrigin()
const seoDescription = computed(() => product.value?.shortDescription || product.value?.description || SHOP.description)
const productImages = computed(() =>
  product.value
    ? [...new Set([product.value.image, ...product.value.galleryImages])].filter(Boolean).map(src => absoluteUrl(origin, src))
    : [],
)
useSeoMeta({
  title: () => (product.value ? `${product.value.name} — Chè Cốc` : 'Món ăn không tồn tại — Chè Cốc'),
  description: seoDescription,
  ogTitle: () => product.value?.name,
  ogDescription: seoDescription,
  ogImage: () => productImages.value[0],
})
useJsonLd(() =>
  product.value
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.value.name,
        description: seoDescription.value,
        image: productImages.value,
        category: product.value.categoryName,
        brand: { '@type': 'Brand', name: SHOP.name },
        offers: {
          '@type': 'Offer',
          url: absoluteUrl(origin, `/products/${product.value.slug}`),
          price: product.value.price,
          priceCurrency: 'VND',
          availability: product.value.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: SHOP.name },
        },
      }
    : null,
)

const isToppingSelected = (name: string) => {
  return selectedToppings.value.some(t => t.name === name)
}

const unitPrice = computed(() => {
  if (!product.value) return 0
  const toppingsTotal = selectedToppings.value.reduce((sum, t) => sum + (t.price || 0), 0)
  return (product.value.price || 0) + toppingsTotal
})

const relatedProducts = computed(() => {
  if (!product.value) return []
  return detail.value?.related ?? []
})

const addToCart = () => {
  if (!product.value) return
  cartStore.addItem(product.value, quantity.value, {
    sugar: selectedSugar.value.shortLabel,
    ice: selectedIce.value.shortLabel,
    toppings: selectedToppings.value.map(t => ({ name: t.name, price: t.price })),
    note: specialNote.value
  })
  uiStore.showToast(`Đã thêm ${quantity.value} ${product.value.name} vào giỏ hàng!`)
  uiStore.toggleCartDrawer(true)
}

const buyNow = () => {
  if (!product.value) return
  cartStore.addItem(product.value, quantity.value, {
    sugar: selectedSugar.value.shortLabel,
    ice: selectedIce.value.shortLabel,
    toppings: selectedToppings.value.map(t => ({ name: t.name, price: t.price })),
    note: specialNote.value
  })
  router.push('/checkout')
}
</script>
