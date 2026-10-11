<template>
  <section class="py-24 bg-brand-peach text-brand-dark-green relative overflow-hidden">
    <!-- Decor bg -->
    <div class="absolute -right-20 -top-20 w-64 h-64 bg-brand-white/20 rounded-full blur-3xl"></div>
    <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-white/20 rounded-full blur-3xl"></div>
    
    <div class="container mx-auto px-6 text-center relative z-10" v-motion-slide-visible-once-bottom>
      <h2 class="font-heading text-4xl md:text-5xl mb-6 leading-tight">Một cốc chè,<br/>một chút hạnh phúc.</h2>
      <p class="text-xl mb-10 text-brand-dark-green/80">Đặt món yêu thích ngay hôm nay.</p>
      <button @click="$emit('order')" class="bg-brand-dark-green text-brand-cream px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-dark-green/90 transition-transform hover:scale-105 shadow-xl hover:shadow-2xl">
        Đặt hàng ngay
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits(['order'])
</script>
