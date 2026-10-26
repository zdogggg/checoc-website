<template>
  <section class="py-24 bg-[#FFFDF8] text-brand-dark-green relative overflow-hidden">
    <!-- Decorative Leaves (Placeholders) -->
    <div class="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none bg-[url('https://placehold.co/400x400/DDE8D6/0D241B?text=Leaf')] bg-cover bg-center rounded-full blur-2xl"></div>
    
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
          Chúng tôi mang đến những ly chè thơm ngon, được chế biến từ nguyên liệu tươi sạch, kết hợp công thức truyền thống và chút sáng tạo hiện đại. Mỗi cốc chè không chỉ là món ăn, mà còn là cả tâm huyết và tình yêu ẩm thực của chúng tôi.
        </p>
        
        <button class="bg-brand-dark-green text-brand-white px-8 py-3 rounded-full font-bold hover:bg-brand-dark-green/90 transition-colors flex items-center gap-2 mb-12">
          Tìm hiểu thêm
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>

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
              <div class="font-heading text-2xl font-bold">10+</div>
            </div>
            <div class="text-xs text-brand-dark-green/70 font-medium">Loại chè đặc sắc</div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <div class="font-heading text-2xl font-bold">100%</div>
            </div>
            <div class="text-xs text-brand-dark-green/70 font-medium">Nguyên liệu tự nhiên</div>
          </div>
        </div>
      </div>

      <!-- Right Content (Images) -->
      <!-- Right Content (Images) -->
      <div v-motion-fade-visible-once class="relative min-h-[500px] hidden lg:block">
        <!-- Circular Main Image -->
        <div class="absolute right-10 top-0 w-[450px] h-[450px] rounded-full overflow-hidden shadow-2xl">
          <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop" class="w-full h-full object-cover" alt="Chè Cốc" />
        </div>
        
        <!-- Polaroid 1 -->
        <div class="absolute right-[320px] top-10 w-48 bg-white p-3 pb-8 rounded-sm shadow-2xl rotate-[-12deg] hover:rotate-0 transition-transform duration-300 z-20">
          <img src="https://images.unsplash.com/photo-1600326145359-3a44909d1a39?q=80&w=300&auto=format&fit=crop" class="w-full h-32 object-cover bg-gray-100" />
        </div>
        
        <!-- Polaroid 2 -->
        <div class="absolute right-20 bottom-0 w-56 bg-white p-3 pb-8 rounded-sm shadow-2xl rotate-[8deg] hover:rotate-0 transition-transform duration-300 z-20">
          <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=300&auto=format&fit=crop" class="w-full h-40 object-cover bg-gray-100" />
          <div class="mt-2 font-handwriting text-center text-gray-500 text-lg">Nguyên liệu tươi mới</div>
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
</script>
