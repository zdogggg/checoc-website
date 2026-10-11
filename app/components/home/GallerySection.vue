<template>
  <section class="py-24 bg-[#0D241B] overflow-hidden">
    <div class="container mx-auto px-4 max-w-7xl">
      <div 
        class="text-center mb-16 flex flex-col items-center"
        v-motion
        :initial="{ opacity: 0, y: 30 }"
        :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      >
        <span class="text-[#D9A441] font-medium tracking-[0.2em] uppercase text-sm mb-3 block">Thư viện hình ảnh</span>
        <h2 class="text-4xl md:text-5xl font-serif text-[#FFFDF8] font-bold">Khám Phá Chè Cốc</h2>
        <p class="text-[#F7F1E5] opacity-80 mt-4 max-w-2xl font-light">Từng góc nhỏ, từng nguyên liệu đều được chuẩn bị với trọn vẹn tâm huyết để mang đến cho bạn trải nghiệm tuyệt vời nhất.</p>
      </div>

      <!-- Masonry Grid Alternative with Tailwind Columns -->
      <div class="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        <div 
          v-for="(image, index) in images" 
          :key="index"
          class="relative group overflow-hidden rounded-2xl break-inside-avoid"
          v-motion
          :initial="{ opacity: 0, scale: 0.95 }"
          :visibleOnce="{ opacity: 1, scale: 1, transition: { duration: 600, delay: index * 100 } }"
        >
          <img :src="image.url" :alt="image.title" class="w-full object-cover transform transition-transform duration-700 group-hover:scale-110" />
          
          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-[#0D241B]/90 via-[#0D241B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
            <h3 class="text-xl font-serif text-[#F7F1E5] font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{{ image.title }}</h3>
            <p class="text-[#D9A441] text-sm mt-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">@checoc.vn</p>
          </div>
        </div>
      </div>
      
      <div class="mt-16 text-center">
        <button class="px-8 py-3 bg-transparent border border-[#D9A441] text-[#D9A441] rounded-full hover:bg-[#D9A441] hover:text-[#0D241B] transition-colors duration-300 font-medium tracking-wide">
          Theo dõi Instagram của chúng tôi
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const images = [
  {
    url: 'https://images.unsplash.com/photo-1563805042-7684c8e9e533?q=80&w=600&auto=format&fit=crop',
    title: 'Cốt dừa béo ngậy'
  },
  {
    url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop',
    title: 'Hương vị tuổi thơ'
  },
  {
    url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
    title: 'Tươi mát ngày hè'
  },
  {
    url: 'https://images.unsplash.com/photo-1601000676229-23f2f01f81d1?q=80&w=600&auto=format&fit=crop',
    title: 'Lá dứa thơm lừng'
  },
  {
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=600&auto=format&fit=crop',
    title: 'Chỉn chu từng chi tiết'
  },
  {
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600&auto=format&fit=crop',
    title: 'Trải nghiệm khác biệt'
  }
]
</script>
