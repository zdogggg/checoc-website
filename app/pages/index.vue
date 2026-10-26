<template>
  <div>
    <HeroSection @explore="scrollToProducts" />
    
    <BestSellerHighlight v-if="bestSeller" @add-to-cart="handleAddToCart(bestSeller)" />

    <div id="products-section">
      <CategorySection 
        :active-category-id="activeCategoryId"
        @select="activeCategoryId = $event"
      />
      
      <FeaturedProducts 
        :products="filteredProducts"
        @add-to-cart="handleAddToCart"
      />
    </div>

    <BrandStory />
    
    <WhyChooseUs />
    
    <GallerySection />
    
    <ReviewSection />
    
    <OrderCTA @order="uiStore.toggleCartDrawer" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HeroSection from '~/components/home/HeroSection.vue'
import BestSellerHighlight from '~/components/home/BestSellerHighlight.vue'
import CategorySection from '~/components/home/CategorySection.vue'
import FeaturedProducts from '~/components/home/FeaturedProducts.vue'
import BrandStory from '~/components/home/BrandStory.vue'
import WhyChooseUs from '~/components/home/WhyChooseUs.vue'
import GallerySection from '~/components/home/GallerySection.vue'
import ReviewSection from '~/components/home/ReviewSection.vue'
import OrderCTA from '~/components/home/OrderCTA.vue'
import { ALL_CATEGORY_ID, type Product } from '#shared/types/catalog'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

const cartStore = useCartStore()
const uiStore = useUiStore()

const { data: products } = await useProducts()

const activeCategoryId = ref(ALL_CATEGORY_ID)

const bestSeller = computed(() => products.value.find(p => p.badge === 'best-seller') ?? products.value[0])

const filteredProducts = computed(() => {
  if (activeCategoryId.value === ALL_CATEGORY_ID) return products.value
  return products.value.filter(p => p.categoryId === activeCategoryId.value)
})

const scrollToProducts = () => {
  const el = document.getElementById('products-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleAddToCart = (product: Product) => {
  cartStore.addItem(product)
  uiStore.isCartDrawerOpen = true
  uiStore.showToast(`Đã thêm 1 ${product.name} vào giỏ hàng!`)
}
</script>
