<template>
  <!-- The shop's own dish photos; hidden until the menu has a few -->
  <section v-if="photos.length >= 3" class="py-24 bg-[#0D241B] overflow-hidden">
    <div class="container mx-auto px-4 max-w-7xl">
      <div 
        v-motion
        class="text-center mb-16 flex flex-col items-center"
        :initial="{ opacity: 0, y: 30 }"
        :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      >
        <span class="text-[#D9A441] font-medium tracking-[0.2em] uppercase text-sm mb-3 block">Thư viện hình ảnh</span>
        <h2 class="text-4xl md:text-5xl font-serif text-[#FFFDF8] font-bold">Khám Phá Chè Cốc</h2>
        <p class="text-[#F7F1E5] opacity-80 mt-4 max-w-2xl font-light">Vài món trong thực đơn của quán.</p>
      </div>

      <!-- Masonry Grid Alternative with Tailwind Columns -->
      <div class="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        <div
          v-for="(image, index) in photos"
          :key="image.slug"
          v-motion
          class="break-inside-avoid"
          :initial="{ opacity: 0, scale: 0.95 }"
          :visibleOnce="{ opacity: 1, scale: 1, transition: { duration: 600, delay: index * 100 } }"
        >
        <NuxtLink :to="`/products/${image.slug}`" class="block relative group overflow-hidden rounded-2xl">
          <img loading="lazy" decoding="async" :src="imageAt(image.url, 400)" :srcset="imageSrcset(image.url, [400, 800])" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" :alt="image.title" class="w-full object-cover transform transition-transform duration-700 group-hover:scale-110" />
          
          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-[#0D241B]/90 via-[#0D241B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
            <h3 class="text-xl font-serif text-[#F7F1E5] font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{{ image.title }}</h3>
          </div>
        </NuxtLink>
        </div>
      </div>
      
      <!-- Only once the shop's real Instagram page is filled in (SHOP.social in shared/utils/site.ts) -->
      <div v-if="SHOP.social.instagram" class="mt-16 text-center">
        <a
          :href="SHOP.social.instagram"
          target="_blank"
          rel="noopener"
          class="inline-block px-8 py-3 bg-transparent border border-[#D9A441] text-[#D9A441] rounded-full hover:bg-[#D9A441] hover:text-[#0D241B] transition-colors duration-300 font-medium tracking-wide"
        >
          Theo dõi Instagram của quán
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ photos?: { url: string; title: string; slug: string }[] }>(), { photos: () => [] })
</script>
