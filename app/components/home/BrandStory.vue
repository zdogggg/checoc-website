<template>
  <section class="py-24 bg-[#FFFDF8] text-brand-dark-green relative overflow-hidden">
    <div class="absolute top-0 right-0 w-64 h-64 opacity-30 pointer-events-none bg-[#DDE8D6] rounded-full blur-3xl" aria-hidden="true"></div>
    
    <div class="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      
      <!-- Left Content -->
      <div v-motion-fade-visible-once>
        <div class="inline-flex items-center gap-2 text-brand-dark-green/70 font-bold text-sm tracking-widest uppercase mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          VỀ CHÚNG TÔI
        </div>
        
        <h2 class="font-heading text-4xl md:text-5xl mb-6 font-bold leading-tight">
          Chè Cốc — Hương vị truyền thống trong từng ly hiện đại
        </h2>
        
        <p class="text-brand-dark-green/70 mb-8 text-lg leading-relaxed">
          Chè Cốc bán chè và đồ ăn vặt nấu mới mỗi ngày: những món chè truyền thống quen thuộc, chè Thái, chè khúc bạch, đựng trong cốc tiện mang đi. Ghé quán hoặc đặt online, quán giao tận nơi trong TP. Hồ Chí Minh.
        </p>
        
        <NuxtLink to="/about" class="bg-brand-dark-green text-brand-white px-8 py-3 rounded-full font-bold hover:bg-brand-dark-green/90 transition-colors inline-flex items-center gap-2 mb-12">
          Tìm hiểu thêm
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </NuxtLink>

        <div class="grid grid-cols-3 gap-6 pt-8 border-t border-brand-dark-green/10">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <div class="font-heading text-2xl font-bold">5+</div>
            </div>
            <div class="text-xs text-brand-dark-green/70 font-medium">Năm kinh nghiệm</div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/></svg>
              <div class="font-heading text-2xl font-bold">Mỗi ngày</div>
            </div>
            <div class="text-xs text-brand-dark-green/70 font-medium">Nấu mới tại quán</div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <div class="font-heading text-2xl font-bold">Tuỳ chọn</div>
            </div>
            <div class="text-xs text-brand-dark-green/70 font-medium">Độ ngọt, đá, topping</div>
          </div>
        </div>
      </div>

      <!-- Right Content: the shop's own dish photos, only when there are some -->
      <div v-if="photos.length" v-motion-fade-visible-once class="relative min-h-[500px] hidden lg:block">
        <!-- Circular Main Image -->
        <div class="absolute right-10 top-0 w-[450px] h-[450px] rounded-full overflow-hidden shadow-2xl">
          <img loading="lazy" decoding="async" :src="photos[0]!.url" class="w-full h-full object-cover" :alt="photos[0]!.title" />
        </div>
        
        <!-- Polaroid 1 -->
        <div v-if="photos[1]" class="absolute right-[320px] top-10 w-48 bg-white p-3 pb-8 rounded-sm shadow-2xl rotate-[-12deg] hover:rotate-0 transition-transform duration-300 z-20">
          <img loading="lazy" decoding="async" :src="photos[1].url" class="w-full h-32 object-cover bg-gray-100" :alt="photos[1].title" />
        </div>
        
        <!-- Polaroid 2 -->
        <div v-if="photos[2]" class="absolute right-20 bottom-0 w-56 bg-white p-3 pb-8 rounded-sm shadow-2xl rotate-[8deg] hover:rotate-0 transition-transform duration-300 z-20">
          <img loading="lazy" decoding="async" :src="photos[2].url" class="w-full h-40 object-cover bg-gray-100" :alt="photos[2].title" />
          <div class="mt-2 font-handwriting text-center text-gray-500 text-lg">{{ photos[2].title }}</div>
        </div>
        
        <!-- Handwritten Text Overlay -->
        <div class="absolute left-0 lg:-left-8 top-1/2 -translate-y-1/2 z-30 font-handwriting text-4xl lg:text-5xl text-brand-dark-green rotate-[-5deg] text-center leading-[1.3] max-w-[280px]">
          Chè ngon không chỉ ở vị mà còn ở cảm xúc
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ photos?: { url: string; title: string }[] }>(), { photos: () => [] })
</script>
