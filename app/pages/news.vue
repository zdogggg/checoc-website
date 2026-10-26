<template>
  <div class="pt-32 pb-20 container mx-auto px-6 min-h-screen">
    <h1 class="font-heading text-4xl text-brand-dark-green font-bold mb-6">Tin tức & Khuyến mãi</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div class="aspect-video bg-gray-100 flex items-center justify-center">
          <AppIcon name="newspaper" class="text-4xl text-gray-400" />
        </div>
        <div class="p-6">
          <p class="text-xs text-brand-gold font-bold uppercase tracking-wider mb-2">Tin tức</p>
          <h3 class="font-bold text-xl text-brand-dark-green mb-3">Chè Cốc sắp ra mắt chi nhánh mới tại Quận 1</h3>
          <p class="text-gray-600 line-clamp-2">Nội dung bài viết đang được cập nhật. Cùng đón chờ những ưu đãi hấp dẫn trong tuần lễ khai trương...</p>
        </div>
      </div>
    </div>
  </div>
</template>
