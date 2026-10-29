<template>
  <div class="pt-28 sm:pt-32 pb-20 min-h-screen bg-[var(--color-cream)]">
    <div class="container mx-auto max-w-5xl px-4 sm:px-6">
      <h1 class="font-heading text-3xl sm:text-4xl text-brand-dark-green font-bold mb-2">Liên hệ</h1>
      <p class="text-gray-600 mb-8">Đặt hàng, hỏi món hay góp ý, quán luôn sẵn lòng.</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Ways to reach the shop -->
        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 text-brand-dark-green space-y-5">
          <a :href="`tel:${SHOP.phone}`" class="flex items-start gap-4 group">
            <span class="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center shrink-0"><AppIcon name="phone" :size="20" /></span>
            <span>
              <span class="block text-xs uppercase tracking-wider text-gray-500 font-bold">Gọi đặt hàng</span>
              <span class="block text-xl font-bold group-hover:underline">{{ SHOP.phone }}</span>
            </span>
          </a>

          <a :href="SHOP_ZALO_URL" target="_blank" rel="noopener" class="flex items-start gap-4 group">
            <span class="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center shrink-0"><AppIcon name="message" :size="20" /></span>
            <span>
              <span class="block text-xs uppercase tracking-wider text-gray-500 font-bold">Nhắn Zalo</span>
              <span class="block font-semibold group-hover:underline">{{ SHOP.phone }}</span>
            </span>
          </a>

          <a :href="SHOP_MAP_URL" target="_blank" rel="noopener" class="flex items-start gap-4 group">
            <span class="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center shrink-0"><AppIcon name="pin" :size="20" /></span>
            <span>
              <span class="block text-xs uppercase tracking-wider text-gray-500 font-bold">Địa chỉ quán</span>
              <span class="block font-semibold group-hover:underline">{{ SHOP_ADDRESS_LINE }}</span>
              <span class="block text-xs text-gray-500 mt-0.5">Mở Google Maps để chỉ đường</span>
            </span>
          </a>

          <div class="flex items-start gap-4">
            <span class="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center shrink-0"><AppIcon name="clock" :size="20" /></span>
            <span>
              <span class="block text-xs uppercase tracking-wider text-gray-500 font-bold">Giờ mở cửa</span>
              <span class="block font-semibold">{{ SHOP.opens }} – {{ SHOP.closes }}, tất cả các ngày</span>
            </span>
          </div>
        </section>

        <!-- Delivery and orders -->
        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 text-brand-dark-green">
          <h2 class="font-heading text-xl font-bold mb-3">Giao hàng</h2>
          <p class="text-sm text-gray-600 mb-3">Quán giao trong các khu vực sau của {{ DELIVERY_CITY }}:</p>
          <ul class="flex flex-wrap gap-2 mb-6">
            <li v-for="area in DELIVERY_AREAS" :key="area" class="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-cream/70">{{ area }}</li>
          </ul>
          <p class="text-sm text-gray-600 mb-6">
            Ở ngoài các khu vực trên? Gọi
            <a :href="`tel:${SHOP.phone}`" class="font-semibold underline">{{ SHOP.phone }}</a> để quán xem có sắp xếp được không.
          </p>

          <h2 class="font-heading text-xl font-bold mb-3">Đơn hàng của bạn</h2>
          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/orders" class="inline-flex items-center gap-2 bg-brand-dark-green text-brand-cream font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1a4132] transition-colors">
              Tra cứu đơn hàng
            </NuxtLink>
            <NuxtLink to="/products" class="inline-flex items-center gap-2 bg-[#F6B99F] text-brand-dark-green font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#f3a886] transition-colors">
              Xem thực đơn
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Liên hệ — Chè Cốc',
  description: `Gọi ${SHOP.phone} hoặc nhắn Zalo để đặt chè. Địa chỉ: ${SHOP_ADDRESS_LINE}. Mở cửa ${SHOP.opens}–${SHOP.closes} hằng ngày.`,
})
</script>
