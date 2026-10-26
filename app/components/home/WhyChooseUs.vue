<template>
  <section class="py-24 bg-[#FFFDF8] relative overflow-hidden">
    <!-- Floating leaves decoration -->
    <div 
      v-motion
      class="absolute top-20 right-20 w-32 h-32 opacity-10 pointer-events-none"
      :initial="{ y: 0, rotate: 0 }"
      :enter="{ y: [0, 15, 0], rotate: [0, 5, 0], transition: { duration: 5000, repeat: Infinity } }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="w-full h-full text-[#0D241B]">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.996 4.708l.192.146c2.518 1.942 4.148 4.767 4.568 7.848.42 3.082-.505 6.22-2.593 8.784-2.532-2.022-4.148-4.992-4.526-8.232-.377-3.24.597-6.522 2.735-9.141l-.376.595z" />
      </svg>
    </div>
    
    <div class="container mx-auto px-4 relative z-10 max-w-7xl">
      <div 
        v-motion
        class="text-center mb-16"
        :initial="{ opacity: 0, y: 30 }"
        :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      >
        <span class="text-[#D9A441] font-medium tracking-[0.2em] uppercase text-sm mb-3 block">Cam kết chất lượng</span>
        <h2 class="text-4xl md:text-5xl font-serif text-[#0D241B] font-bold">Lý do chọn Chè Cốc</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          v-motion
          class="flex flex-col items-center text-center group"
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 600, delay: index * 150 } }"
        >
          <!-- Icon Circle -->
          <div class="w-24 h-24 rounded-full bg-[#F7F1E5] flex items-center justify-center mb-6 text-[#0D241B] group-hover:-translate-y-2 group-hover:shadow-lg group-hover:bg-[#DDE8D6] transition-all duration-500 ease-out relative">
             <div class="absolute inset-0 rounded-full border border-[#D9A441] opacity-0 group-hover:opacity-30 scale-90 group-hover:scale-110 transition-all duration-500"></div>
             <div class="w-10 h-10" v-html="feature.icon"></div>
          </div>
          <h3 class="text-xl font-serif font-semibold text-[#0D241B] mb-3">{{ feature.title }}</h3>
          <p class="text-gray-600 leading-relaxed max-w-xs">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: '100% Nguyên liệu tươi',
    desc: 'Tuyển chọn khắt khe nguyên liệu tự nhiên, chuẩn bị tươi mới mỗi ngày để giữ trọn vị thanh tao.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.996 4.708l.192.146c2.518 1.942 4.148 4.767 4.568 7.848.42 3.082-.505 6.22-2.593 8.784-2.532-2.022-4.148-4.992-4.526-8.232-.377-3.24.597-6.522 2.735-9.141l-.376.595z" /></svg>'
  },
  {
    title: 'Chế biến sạch',
    desc: 'Quy trình nấu tuân thủ nghiêm ngặt chuẩn an toàn vệ sinh, hoàn toàn không chất bảo quản.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>'
  },
  {
    title: 'Hương vị truyền thống',
    desc: 'Công thức gia truyền độc bản, lưu giữ nét đẹp tinh túy của ẩm thực chè Việt Nam.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>'
  },
  {
    title: 'Giao hàng nhanh',
    desc: 'Đảm bảo mỗi cốc chè đến tay bạn luôn trong trạng thái mát lạnh và hoàn hảo nhất.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>'
  }
]
</script>
