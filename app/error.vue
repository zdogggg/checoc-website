<template>
  <NuxtLayout>
    <div class="pt-32 pb-20 px-4">
      <div class="container mx-auto max-w-lg text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div class="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🥣
        </div>
        <h1 class="font-heading text-2xl font-bold text-brand-dark-green mb-2">
          {{ is404 ? 'Không tìm thấy trang này' : 'Đã có lỗi xảy ra' }}
        </h1>
        <p class="text-sm text-gray-500 mb-6 px-6">
          {{ is404
            ? 'Món bạn đang tìm có thể đã tạm hết hoặc không còn trong thực đơn.'
            : 'Xin lỗi bạn, vui lòng thử lại sau ít phút.' }}
        </p>
        <button
          class="bg-brand-dark-green text-brand-cream font-bold px-6 py-3 rounded-full hover:bg-[#1a4132] transition-colors inline-block text-sm"
          @click="clearError({ redirect: '/products' })"
        >
          Xem toàn bộ thực đơn
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)

useHead({ title: () => (is404.value ? 'Không tìm thấy — Chè Cốc' : 'Lỗi — Chè Cốc') })
</script>
