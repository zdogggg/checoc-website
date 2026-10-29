<template>
  <section class="relative min-h-screen flex items-center bg-brand-dark-green overflow-hidden pt-32 pb-12">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1920&auto=format&fit=crop" class="w-full h-full object-cover opacity-40" alt="Background" />
      <div class="absolute inset-0 bg-gradient-to-r from-brand-dark-green via-brand-dark-green/80 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-brand-dark-green via-transparent to-transparent"></div>
    </div>

    <div class="container mx-auto px-8 pb-24 md:pb-32 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <!-- Left Content -->
      <div v-motion-fade-visible class="text-white">
        <div class="inline-block border border-white/30 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-6">
          CHÈ CỐC – MÓN NGON MỖI NGÀY
        </div>
        
        <h1 class="font-heading text-5xl sm:text-6xl md:text-8xl font-bold mb-6 leading-[1.1] relative z-10">
          Ngọt lành<br/>
          <span class="font-handwriting text-brand-peach text-6xl sm:text-7xl md:text-9xl font-normal block mt-1 sm:-mt-4">từ thiên nhiên</span>
        </h1>
        
        <p class="text-lg md:text-xl text-white/80 max-w-md mb-10 leading-relaxed font-light mt-4">
          Mỗi cốc chè là sự kết hợp tinh tế giữa nguyên liệu tươi ngon, truyền thống và tình yêu ẩm thực Việt.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 mb-16">
          <button class="bg-[#F6B99F] text-brand-dark-green px-8 py-4 rounded-full font-bold hover:bg-[#f3a886] transition-colors flex items-center justify-center gap-2" @click="$emit('explore')">
            Khám phá thực đơn
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
          
          <button class="bg-transparent text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
            <div class="w-10 h-10 rounded-full border border-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            Xem video giới thiệu
          </button>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/20 pt-8 mt-12">
          <div class="flex items-center sm:items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-brand-peach shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p class="text-xs text-white/80 leading-tight">Nguyên liệu tươi sạch<br/><span class="font-bold text-white">100% tự nhiên</span></p>
          </div>
          <div class="flex items-center sm:items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-brand-peach shrink-0"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
            <p class="text-xs text-white/80 leading-tight">Chế biến an toàn<br/><span class="font-bold text-white">vệ sinh</span></p>
          </div>
          <div class="flex items-center sm:items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-brand-peach shrink-0"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p class="text-xs text-white/80 leading-tight">Giao tận nơi<br/><span class="font-bold text-white">nội thành TP.HCM</span></p>
          </div>
        </div>
      </div>
      
      <!-- Right Image Area -->
      <div class="relative hidden lg:flex justify-center items-center h-full">
         <img src="https://images.unsplash.com/photo-1589367920969-19611eb2021c?q=80&w=800&auto=format&fit=crop" class="w-[500px] h-[600px] object-cover rounded-full border-[12px] border-brand-dark-green shadow-2xl relative z-10" alt="Chè Cốc" />
         <!-- Decorative handwritten text -->
         <div class="absolute -right-10 top-20 text-brand-peach font-handwriting text-4xl rotate-12 z-20 max-w-[200px] text-center">
            Một cốc chè là một chút hạnh phúc!
         </div>
      </div>
    </div>
    
    <!-- Bottom Curve Divider (SVG) -->
    <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
      <svg class="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C73.2,16.8,145.4,34.2,216.5,50.1,251.6,58,286.7,63,321.39,56.44Z" fill="#FFFDF8"></path>
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits(['explore'])
</script>
