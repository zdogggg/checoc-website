<template>
  <section class="py-24 bg-[#F7F1E5] relative overflow-hidden flex items-center min-h-[80vh]">
    <!-- Background Decor -->
    <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
      <h2 class="text-[20vw] font-serif font-bold whitespace-nowrap text-[#0D241B]">BEST SELLER</h2>
    </div>

    <div class="container mx-auto px-4 max-w-7xl relative z-10">
      <div class="flex flex-col lg:flex-row items-center gap-16">
        
        <!-- Text Content -->
        <div
v-motion
             class="flex-1 lg:pl-10 text-center lg:text-left order-1"
             :initial="{ opacity: 0, x: -50 }"
             :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 800 } }"
        >
          <div class="inline-flex items-center space-x-2 bg-[#F6B99F] px-4 py-1.5 rounded-full mb-6">
             <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span class="text-[#0D241B] text-xs font-bold uppercase tracking-wider">Must Try</span>
          </div>
          
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-serif text-[#0D241B] font-bold mb-6 leading-tight">
            Chè Khúc Bạch <br />
            <span class="text-[#D9A441] italic font-light">Hạnh Nhân</span>
          </h2>
          
          <p class="text-gray-700 text-lg mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Sự thanh mát của những viên khúc bạch núng nính, hòa quyện cùng nước nhãn trong vắt và hạnh nhân lát rang thơm bùi. Đỉnh cao của nghệ thuật chè hiện đại.
          </p>

          <div class="flex items-center justify-center lg:justify-start gap-4">
             <button class="px-8 py-4 bg-[#0D241B] text-[#FFFDF8] rounded-full hover:bg-[#1a4132] transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1" @click="$emit('add-to-cart')">
               Thêm vào giỏ - 35.000đ
             </button>
          </div>
          
          <!-- Annotations (Features) -->
          <div class="mt-12 grid grid-cols-2 gap-6 text-left border-t border-[#0D241B]/10 pt-8">
            <div class="flex flex-col">
              <span class="text-[#D9A441] text-2xl font-serif mb-1">01</span>
              <h4 class="text-[#0D241B] font-semibold mb-1">Khúc bạch núng nính</h4>
              <p class="text-sm text-gray-600">Làm từ kem sữa tươi cao cấp.</p>
            </div>
            <div class="flex flex-col">
              <span class="text-[#D9A441] text-2xl font-serif mb-1">02</span>
              <h4 class="text-[#0D241B] font-semibold mb-1">Hạnh nhân rang</h4>
              <p class="text-sm text-gray-600">Giòn rụm, bùi béo tự nhiên.</p>
            </div>
          </div>
        </div>

        <!-- Huge Image -->
        <div
v-motion
             class="flex-1 relative order-2 mt-12 lg:mt-0"
             :initial="{ opacity: 0, scale: 0.8, rotate: -5 }"
             :visibleOnce="{ opacity: 1, scale: 1, rotate: 0, transition: { duration: 1000, type: 'spring' } }"
        >
          <!-- Blob background -->
          <div class="absolute inset-0 bg-[#DDE8D6] rounded-full blur-3xl opacity-50 scale-110 mix-blend-multiply"></div>
          
          <img 
            src="https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop" 
            alt="Chè Khúc Bạch" 
            class="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl object-cover aspect-[4/5] transform hover:scale-[1.02] transition-transform duration-700"
          />
          
          <!-- Floating badge -->
          <div
v-motion
               class="absolute right-0 md:-right-4 top-1/4 md:top-1/4 bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-xl z-20 scale-90 md:scale-100 origin-right"
               :initial="{ y: 0 }"
               :enter="{ y: [-10, 10, -10], transition: { duration: 4000, repeat: Infinity } }"
          >
            <div class="flex items-center gap-2 md:gap-3">
              <div class="w-8 h-8 md:w-12 md:h-12 bg-[#F7F1E5] rounded-full flex items-center justify-center text-sm md:text-xl shrink-0 text-brand-gold"><AppIcon name="sparkles" /></div>
              <div>
                <p class="text-[10px] md:text-xs text-gray-500 font-medium whitespace-nowrap">Bán chạy nhất</p>
                <p class="text-xs md:text-sm font-bold text-[#0D241B] whitespace-nowrap">1,200+ cốc/tháng</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits(['add-to-cart'])
</script>
