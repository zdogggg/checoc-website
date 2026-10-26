<template>
  <section class="py-20 bg-[#FBF5F1] text-brand-dark-green relative overflow-hidden">
    <div v-motion-slide-visible-once-bottom class="container mx-auto px-6 relative z-10">
      
      <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <div class="inline-flex items-center gap-2 text-brand-dark-green/70 font-bold text-sm tracking-widest uppercase mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            Khách hàng nói gì về Chè Cốc?
          </div>
          <p class="text-brand-dark-green/70">Cảm nhận thật từ những người đã trải nghiệm</p>
        </div>
        <NuxtLink to="/" class="text-brand-dark-green font-medium hover:text-brand-peach transition-colors flex items-center gap-2">
          Xem tất cả đánh giá <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        <!-- Review 1 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div class="flex gap-4 mb-4">
            <img src="https://i.pravatar.cc/150?u=1" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <div class="font-bold text-sm">Ngọc Anh</div>
              <div class="flex text-[#D9A441] text-xs">
                ★★★★★
              </div>
            </div>
          </div>
          <p class="text-sm text-brand-dark-green/80 italic line-clamp-3">
            "Chè ngon, mát, vị thanh, topping nhiều. Mình rất thích chè khúc bạch ở đây!"
          </p>
          <div class="text-[10px] text-gray-400 mt-4">12/05/2025</div>
        </div>

        <!-- Review 2 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div class="flex gap-4 mb-4">
            <img src="https://i.pravatar.cc/150?u=2" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <div class="font-bold text-sm">Minh Tuấn</div>
              <div class="flex text-[#D9A441] text-xs">
                ★★★★★
              </div>
            </div>
          </div>
          <p class="text-sm text-brand-dark-green/80 italic line-clamp-3">
            "Nguyên liệu tươi, sạch, vị rất tự nhiên. Giao hàng nhanh, đóng gói cẩn thận."
          </p>
          <div class="text-[10px] text-gray-400 mt-4">08/05/2025</div>
        </div>

        <!-- Review 3 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div class="flex gap-4 mb-4">
            <img src="https://i.pravatar.cc/150?u=3" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <div class="font-bold text-sm">Thu Hà</div>
              <div class="flex text-[#D9A441] text-xs">
                ★★★★★
              </div>
            </div>
          </div>
          <p class="text-sm text-brand-dark-green/80 italic line-clamp-3">
            "Chè trái cây cực ngon, hoa quả tươi, không bị ngọt gắt. Sẽ ủng hộ dài dài!"
          </p>
          <div class="text-[10px] text-gray-400 mt-4">02/05/2025</div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute -right-20 -bottom-10 font-handwriting text-3xl text-brand-dark-green/40 rotate-[-10deg] hidden lg:block text-center">
          Cảm ơn bạn <br/>đã luôn ủng hộ<br/>Chè Cốc! 🍵
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
