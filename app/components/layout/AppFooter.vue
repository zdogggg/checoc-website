<template>
  <footer class="bg-brand-dark-green text-brand-white py-16 border-t border-white/10">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

        <!-- Brand & socials -->
        <div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-brand-white rounded-full flex items-center justify-center">
              <AppIcon name="cup" class="text-brand-dark-green text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="font-heading text-2xl font-bold leading-none">Chè Cốc</span>
              <span class="text-[10px] opacity-80 tracking-widest font-medium uppercase mt-1">Ngọt lành từ thiên nhiên</span>
            </div>
          </div>
          <p class="text-sm text-brand-white/70 leading-relaxed max-w-xs">
            Chè truyền thống và đồ ăn vặt nấu mới mỗi ngày, giao tận nơi trong nội thành TP.HCM.
          </p>
          <!-- Only the pages the shop actually has (SHOP.social) -->
          <div v-if="socials.length" class="flex gap-3 mt-6">
            <a
              v-for="s in socials"
              :key="s.label"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold hover:bg-brand-peach hover:text-brand-dark-green transition-colors"
            >
              {{ s.label }}
            </a>
          </div>
        </div>

        <!-- Links -->
        <div>
          <h4 class="font-bold text-sm mb-6 uppercase tracking-wider text-white/80">Liên kết nhanh</h4>
          <ul class="space-y-3 text-sm text-brand-white/70">
            <li><NuxtLink to="/" class="hover:text-brand-peach transition-colors">Trang chủ</NuxtLink></li>
            <li><NuxtLink to="/products" class="hover:text-brand-peach transition-colors">Thực đơn</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-brand-peach transition-colors">Về chúng tôi</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:text-brand-peach transition-colors">Liên hệ</NuxtLink></li>
            <li><NuxtLink to="/orders" class="hover:text-brand-peach transition-colors">Tra cứu đơn hàng</NuxtLink></li>
            <li><NuxtLink to="/account" class="hover:text-brand-peach transition-colors">Tài khoản & điểm thưởng</NuxtLink></li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="font-bold text-sm mb-6 uppercase tracking-wider text-white/80">Thông tin liên hệ</h4>
          <ul class="space-y-4 text-sm text-brand-white/70">
            <li class="flex items-start gap-3">
              <AppIcon name="pin" class="mt-0.5 shrink-0" />
              <a :href="SHOP_MAP_URL" target="_blank" rel="noopener" class="hover:text-brand-peach transition-colors">{{ SHOP_ADDRESS_LINE }}</a>
            </li>
            <li class="flex items-center gap-3">
              <AppIcon name="phone" class="shrink-0" />
              <a :href="`tel:${SHOP.phone}`" class="hover:text-brand-peach transition-colors">{{ SHOP.phone }}</a>
              <span class="text-brand-white/40">·</span>
              <a :href="SHOP_ZALO_URL" target="_blank" rel="noopener" class="hover:text-brand-peach transition-colors">Zalo</a>
            </li>
            <li class="flex items-center gap-3">
              <AppIcon name="clock" class="shrink-0" />
              <span>{{ SHOP.opens }} – {{ SHOP.closes }} (hằng ngày)</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-brand-white/50">
        <p>© {{ year }} Chè Cốc. All rights reserved.</p>
        <div class="flex items-center gap-2 mt-4 md:mt-0 font-handwriting text-lg text-brand-white/70">
          Ngọt lành từ thiên nhiên
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const SOCIAL_LABELS = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' } as const

const socials = Object.entries(SHOP.social)
  .filter(([, url]) => url)
  .map(([key, url]) => ({ label: SOCIAL_LABELS[key as keyof typeof SOCIAL_LABELS], url }))

const year = new Date().getFullYear()
</script>
