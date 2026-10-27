<template>
  <div>
    <h1 class="font-heading text-3xl font-bold mb-1">Xin chào, {{ user?.name }}</h1>
    <p class="text-gray-500 mb-8">Tình hình hôm nay ở Chè Cốc.</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <NuxtLink v-for="card in cards" :key="card.label" :to="card.to" class="admin-card p-5 hover:border-brand-gold transition-colors">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ card.label }}</div>
        <div class="text-2xl sm:text-3xl font-semibold mt-2">{{ card.value }}</div>
        <div v-if="card.hint" class="text-xs mt-1" :class="card.hintClass">{{ card.hint }}</div>
      </NuxtLink>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <section class="admin-card p-6">
        <ColumnChart
          title="Doanh thu 7 ngày gần nhất"
          subtitle="Mọi đơn không bị huỷ, theo ngày đặt"
          :data="dayBars"
          :table="dayTable"
          :format-tick="compactVnd"
          :height="220"
        />
        <NuxtLink v-if="canSeeReports" to="/admin/reports" class="inline-block text-sm font-semibold underline mt-3">Xem báo cáo chi tiết →</NuxtLink>
      </section>

      <section class="admin-card p-6">
        <h2 class="font-bold mb-4">Món bán chạy (7 ngày)</h2>
        <ol v-if="stats?.topProducts.length" class="space-y-3">
          <li v-for="(p, i) in stats.topProducts" :key="p.name" class="flex items-center gap-3 text-sm">
            <span class="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center text-xs font-bold shrink-0">{{ i + 1 }}</span>
            <span class="flex-1 truncate">{{ p.name }}</span>
            <span class="tabular-nums font-semibold">{{ p.quantity }} cốc</span>
          </li>
        </ol>
        <p v-else class="text-sm text-gray-500">Chưa có đơn hàng nào trong 7 ngày qua.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDatum } from '#shared/types/reports'
import ColumnChart from '~/components/admin/ColumnChart.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Tổng quan' })

const { user } = useUserSession()
const { data: stats, refresh } = await useFetch('/api/admin/stats')
useIntervalFn(refresh, 60_000)
// The layout polls for new orders; reload the numbers as soon as one arrives
const { data: pulse } = useNuxtData<{ pending: number; latestId: number }>('admin:pulse')
watch(() => [pulse.value?.latestId, pulse.value?.pending], () => refresh())

const cards = computed(() => {
  const s = stats.value
  return [
    { label: 'Doanh thu hôm nay', value: formatVnd(s?.todayRevenue ?? 0), to: '/admin/orders?status=all', hint: `${s?.todayOrders ?? 0} đơn chưa huỷ · tiền món`, hintClass: 'text-gray-500' },
    {
      label: 'Đơn đang xử lý',
      value: s?.activeOrders ?? 0,
      to: '/admin/orders',
      hint: s?.pendingOrders ? `${s.pendingOrders} đơn chờ xác nhận` : 'Không có đơn chờ',
      hintClass: s?.pendingOrders ? 'text-amber-600 font-semibold' : 'text-emerald-600',
    },
    {
      label: 'Món ăn',
      value: s?.products ?? 0,
      to: '/admin/products',
      hint: s?.unavailableProducts ? `${s.unavailableProducts} món đang tạm hết` : 'Tất cả đang bán',
      hintClass: s?.unavailableProducts ? 'text-amber-600' : 'text-emerald-600',
    },
    {
      label: 'Nguyên liệu sắp hết',
      value: s?.lowStockIngredients ?? 0,
      to: '/admin/inventory?low=1',
      hint: s?.lowStockIngredients ? 'Cần nhập thêm hàng' : 'Kho đủ dùng',
      hintClass: s?.lowStockIngredients ? 'text-red-600 font-semibold' : 'text-emerald-600',
    },
  ]
})

// Fill in days without orders so the table always shows 7 rows (shop time)
const dayFmt = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: SHOP_TIME_ZONE })
const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE })
const days = computed(() => {
  const byDay = new Map((stats.value?.last7Days ?? []).map((d) => [d.day, d]))
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86_400_000)
    const key = isoDay.format(date)
    return { day: key, label: dayFmt.format(date), orders: byDay.get(key)?.orders ?? 0, revenue: byDay.get(key)?.revenue ?? 0 }
  })
})

// Oldest to newest, left to right
const dayBars = computed<ColumnDatum[]>(() =>
  days.value.map((d) => ({
    key: d.day,
    label: d.label,
    shortLabel: `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`,
    value: d.revenue,
    tooltip: [formatVnd(d.revenue), `${d.orders} đơn`],
  }))
)
const dayTable = computed(() => ({
  headers: ['Ngày', 'Số đơn', 'Doanh thu'],
  rows: [...days.value].reverse().map((d) => [d.label, d.orders, formatVnd(d.revenue)]),
}))
const canSeeReports = useCanEditCatalog()
</script>
