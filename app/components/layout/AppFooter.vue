<template>
  <footer class="bg-brand-dark-green text-brand-white py-16 border-t border-white/10">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        <!-- Brand & Socials -->
        <div class="col-span-1">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-brand-white rounded-full flex items-center justify-center">
              <span class="text-brand-dark-green text-xl">🍵</span>
            </div>
            <div class="flex flex-col">
              <span class="font-heading text-2xl font-bold leading-none">Chè Cốc</span>
              <span class="text-[10px] opacity-80 tracking-widest font-medium uppercase mt-1">Ngọt lành từ thiên nhiên</span>
            </div>
          </div>
          <div class="flex gap-4">
            <a href="#" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-peach hover:text-brand-dark-green transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-peach hover:text-brand-dark-green transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-peach hover:text-brand-dark-green transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
          </div>
        </div>
        
        <!-- Links -->
        <div>
          <h4 class="font-bold text-sm mb-6 uppercase tracking-wider text-white/80">Liên kết nhanh</h4>
          <ul class="space-y-3 text-sm text-brand-white/70">
            <li><NuxtLink to="/" class="hover:text-brand-peach transition-colors">Trang chủ</NuxtLink></li>
            <li><NuxtLink to="/products" class="hover:text-brand-peach transition-colors">Sản phẩm</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-brand-peach transition-colors">Về chúng tôi</NuxtLink></li>
            <li><NuxtLink to="/news" class="hover:text-brand-peach transition-colors">Tin tức</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:text-brand-peach transition-colors">Liên hệ</NuxtLink></li>
            <li><NuxtLink to="/orders" class="hover:text-brand-peach transition-colors">Tra cứu đơn hàng</NuxtLink></li>
          </ul>
        </div>
        
        <!-- Info -->
        <div>
          <h4 class="font-bold text-sm mb-6 uppercase tracking-wider text-white/80">Thông tin liên hệ</h4>
          <ul class="space-y-4 text-sm text-brand-white/70">
            <li class="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>394/21 Nguyễn Tri Phương, Vườn Lài, Hồ Chí Minh</span>
            </li>
            <li class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>0778142044</span>
            </li>
            <li class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>8:00 - 22:00 (Hàng ngày)</span>
            </li>
          </ul>
        </div>
        
        <!-- Newsletter & App -->
        <div>
          <h4 class="font-bold text-sm mb-6 uppercase tracking-wider text-white/80">Đăng ký nhận ưu đãi</h4>
          <div class="flex mb-8">
            <input type="email" placeholder="Nhập email của bạn..." class="bg-white/10 px-4 py-3 rounded-l-full outline-none w-full placeholder:text-brand-white/50 text-sm border border-transparent focus:border-brand-peach transition-colors" />
            <button class="bg-brand-white text-brand-dark-green px-4 py-3 rounded-r-full hover:bg-brand-peach transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
          
          <h4 class="font-bold text-sm mb-3 uppercase tracking-wider text-white/80">Tải app Chè Cốc</h4>
          <div class="flex gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" class="h-8 cursor-pointer hover:opacity-80 transition-opacity" alt="App Store">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" class="h-8 cursor-pointer hover:opacity-80 transition-opacity" alt="Google Play">
          </div>
        </div>
      </div>
      
      <!-- Copyright -->
      <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-brand-white/50">
        <p>© 2026 Chè Cốc. All rights reserved.</p>
        <div class="flex items-center gap-2 mt-4 md:mt-0 font-handwriting text-lg text-brand-white/70">
          Ngọt lành từ thiên nhiên 🍃
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
