<template>
  <div>
    <h1 class="font-heading text-3xl font-bold mb-1">Xin chào, {{ user?.name }}</h1>
    <p class="text-gray-500 mb-8">Tổng quan thực đơn của Chè Cốc.</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      <NuxtLink v-for="card in cards" :key="card.label" :to="card.to" class="admin-card p-5 hover:border-brand-gold transition-colors">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ card.label }}</div>
        <div class="font-heading text-3xl font-bold mt-2 tabular-nums">{{ card.value }}</div>
        <div v-if="card.hint" class="text-xs mt-1" :class="card.hintClass">{{ card.hint }}</div>
      </NuxtLink>
    </div>

    <div class="admin-card p-6">
      <h2 class="font-bold mb-3">Sắp có</h2>
      <p class="text-sm text-gray-500">
        Doanh thu, đơn hàng hôm nay và món bán chạy sẽ hiển thị ở đây khi đơn hàng được lưu vào hệ thống (Phase C).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Tổng quan' })

const { user } = useUserSession()
const { data: stats } = await useFetch('/api/admin/stats')

const cards = computed(() => [
  {
    label: 'Món ăn',
    value: stats.value?.products ?? 0,
    to: '/admin/products',
    hint: stats.value?.unavailableProducts ? `${stats.value.unavailableProducts} món đang tạm hết` : 'Tất cả đang bán',
    hintClass: stats.value?.unavailableProducts ? 'text-amber-600' : 'text-emerald-600',
  },
  { label: 'Danh mục', value: stats.value?.categories ?? 0, to: '/admin/categories' },
  { label: 'Mã giảm giá đang bật', value: stats.value?.activeCoupons ?? 0, to: '/admin/coupons' },
  { label: 'Đơn hàng hôm nay', value: '—', to: '/admin', hint: 'Có ở Phase C', hintClass: 'text-gray-400' },
])
</script>
