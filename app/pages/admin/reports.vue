<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        <h1 class="font-heading text-3xl font-bold">Báo cáo bán hàng</h1>
        <p class="text-gray-500 text-sm">Theo ngày đặt đơn; tiền tính trên đơn đã hoàn tất (không gồm phí ship).</p>
      </div>
      <div class="flex gap-2">
        <a :href="exportUrl('orders')" class="admin-btn-secondary !py-2 !text-xs">Xuất CSV đơn hàng</a>
        <a :href="exportUrl('products')" class="admin-btn-secondary !py-2 !text-xs">Xuất CSV theo món</a>
      </div>
    </div>

    <!-- One filter row scopes everything below -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button
        v-for="opt in RANGE_PRESETS"
        :key="opt.value"
        type="button"
        class="px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors inline-flex items-center gap-1"
        :class="preset === opt.value ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green' : 'bg-white border-gray-200 hover:border-brand-gold'"
        @click="choosePreset(opt.value)"
      >
        <AppIcon v-if="preset === opt.value" name="check" :stroke-width="3" />{{ opt.label }}
      </button>
      <span class="text-gray-300 mx-1" aria-hidden="true">|</span>
      <input v-model="customFrom" type="date" class="admin-input !w-auto !py-1.5" aria-label="Từ ngày" :max="customTo">
      <span class="text-gray-400 text-sm">→</span>
      <input v-model="customTo" type="date" class="admin-input !w-auto !py-1.5" aria-label="Đến ngày" :min="customFrom">
      <button type="button" class="admin-btn-secondary !py-1.5 !text-xs" @click="applyCustom">Xem</button>
      <span v-if="rangeError" class="text-xs text-red-600">{{ rangeError }}</span>
    </div>

    <!-- Refetch keeps the frame: previous render stays, dimmed -->
    <div v-if="report" class="space-y-6 transition-opacity" :class="{ 'opacity-60': pending }">
      <p class="text-xs text-gray-500 -mt-3">
        {{ formatDay(report.range.from) }} – {{ formatDay(report.range.to) }}, so với {{ formatDay(report.previousRange.from) }} – {{ formatDay(report.previousRange.to) }}
      </p>

      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile label="Doanh thu" :value="formatVnd(k.revenue)" :delta="pctChange(k.revenue, p.revenue)" />
        <StatTile label="Đơn hoàn tất" :value="k.completedOrders.toLocaleString('vi-VN')" :delta="pctChange(k.completedOrders, p.completedOrders)" />
        <StatTile label="Giá trị trung bình / đơn" :value="formatVnd(k.avgOrderValue)" :delta="pctChange(k.avgOrderValue, p.avgOrderValue)" />
        <StatTile
          label="Lãi gộp"
          :value="formatVnd(k.grossProfit)"
          :delta="pctChange(k.grossProfit, p.grossProfit)"
          :hint="k.revenue ? `${Math.round((k.grossProfit / k.revenue) * 100)}% doanh thu` : ''"
        />
        <StatTile
          label="Tỉ lệ huỷ đơn"
          :value="`${Math.round(cancelRate(k) * 100)}%`"
          :delta="pctChange(cancelRate(k), cancelRate(p))"
          :up-is-good="false"
          :hint="`${k.cancelledOrders} / ${k.placedOrders} đơn`"
        />
        <StatTile
          label="Khách mới · quay lại"
          :value="`${k.newCustomers} · ${k.returningCustomers}`"
          :hint="k.newCustomers + k.returningCustomers ? `${Math.round((k.returningCustomers / (k.newCustomers + k.returningCustomers)) * 100)}% khách quay lại` : ''"
        />
      </div>

      <p v-if="k.ordersWithoutCost" class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex gap-2">
        <AppIcon name="alert" class="mt-0.5" />
        <span>{{ k.ordersWithoutCost }} đơn chưa có giá vốn (món chưa khai báo định mức), nên lãi gộp đang cao hơn thực tế.</span>
      </p>

      <div class="grid xl:grid-cols-5 gap-6">
        <section class="admin-card p-5 xl:col-span-3">
          <ColumnChart
            title="Doanh thu theo ngày"
            :subtitle="`Tổng ${formatVnd(k.revenue)} · ${k.completedOrders} đơn`"
            :data="dailyBars"
            :table="dailyTable"
            :format-tick="compactVnd"
          />
        </section>
        <section class="admin-card p-5 xl:col-span-2">
          <ColumnChart
            title="Số đơn theo giờ trong ngày"
            :subtitle="peakHour ? `Cao điểm: ${peakHour}` : 'Chưa có đơn'"
            :data="hourlyBars"
            :table="hourlyTable"
            integer
          />
        </section>
      </div>

      <div class="grid xl:grid-cols-5 gap-6 items-start">
        <section class="admin-card overflow-x-auto xl:col-span-3">
          <h3 class="font-bold px-5 pt-5 pb-3">Món bán chạy</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Món</th>
                <th class="text-right">Số lượng</th>
                <th class="text-right">Doanh thu</th>
                <th class="text-right">Lãi gộp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prod, i) in report.topProducts" :key="prod.name">
                <td class="min-w-[12rem]">
                  <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-4 tabular-nums">{{ i + 1 }}</span>{{ prod.name }}</div>
                  <div class="h-1.5 rounded-full bg-gray-100 mt-1.5 ml-6 overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: `${(prod.quantity / maxQty) * 100}%`, background: BAR }" />
                  </div>
                </td>
                <td class="text-right tabular-nums">{{ prod.quantity }}</td>
                <td class="text-right tabular-nums">{{ formatVnd(prod.revenue) }}</td>
                <td class="text-right tabular-nums text-sm">
                  <template v-if="prod.cost">{{ formatVnd(prod.revenue - prod.cost) }}<span class="block text-xs text-gray-500">{{ Math.round(((prod.revenue - prod.cost) / prod.revenue) * 100) }}%</span></template>
                  <span v-else class="text-xs text-gray-400">chưa có giá vốn</span>
                </td>
              </tr>
              <tr v-if="!report.topProducts.length"><td colspan="4" class="text-center text-gray-500 py-8">Chưa có đơn hoàn tất trong khoảng này.</td></tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-400 px-5 py-3">Doanh thu theo món tính trước giảm giá của đơn.</p>
        </section>

        <div class="xl:col-span-2 space-y-6">
          <section class="admin-card p-5">
            <h3 class="font-bold mb-3">Theo danh mục</h3>
            <ul v-if="report.categories.length" class="space-y-2.5 text-sm">
              <li v-for="c in report.categories" :key="c.name">
                <div class="flex justify-between gap-2">
                  <span>{{ c.name }}</span>
                  <span class="tabular-nums">{{ formatVnd(c.revenue) }} <span class="text-gray-400 text-xs">· {{ share(c.revenue, categoryTotal) }}</span></span>
                </div>
                <div class="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                  <div class="h-full rounded-full" :style="{ width: share(c.revenue, categoryTotal), background: BAR }" />
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Chưa có dữ liệu.</p>
          </section>

          <section class="admin-card p-5">
            <h3 class="font-bold mb-3">Thanh toán</h3>
            <ul v-if="report.payments.length" class="space-y-1.5 text-sm">
              <li v-for="pm in report.payments" :key="pm.method" class="flex justify-between gap-2">
                <span>{{ PAYMENT_METHOD_LABELS[pm.method] }}</span>
                <span class="tabular-nums">{{ pm.orders }} đơn · {{ formatVnd(pm.revenue) }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Chưa có dữ liệu.</p>
            <dl class="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-sm text-gray-600">
              <div class="flex justify-between"><dt>Giảm giá (mã + điểm)</dt><dd class="tabular-nums">{{ formatVnd(k.discounts) }}</dd></div>
              <div class="flex justify-between"><dt>Phí ship đã thu</dt><dd class="tabular-nums">{{ formatVnd(k.shippingCollected) }}</dd></div>
            </dl>
          </section>

          <section class="admin-card p-5">
            <h3 class="font-bold mb-3">Khách mua nhiều nhất</h3>
            <ol v-if="report.topCustomers.length" class="space-y-2 text-sm">
              <li v-for="c in report.topCustomers" :key="c.id" class="flex justify-between gap-2">
                <NuxtLink :to="`/admin/customers/${c.id}`" class="hover:underline truncate">{{ c.name || c.phone }}</NuxtLink>
                <span class="tabular-nums whitespace-nowrap">{{ c.orders }} đơn · {{ formatVnd(c.revenue) }}</span>
              </li>
            </ol>
            <p v-else class="text-sm text-gray-500">Chưa có dữ liệu.</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDatum, ReportKpis, SalesReport } from '#shared/types/reports'
import type { RangePreset } from '#shared/utils/reports'
import ColumnChart from '~/components/admin/ColumnChart.vue'
import StatTile from '~/components/admin/StatTile.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Báo cáo' })

const BAR = '#3B8B63'
const route = useRoute()
const router = useRouter()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE }).format(new Date())

// Range lives in the URL (?preset=30d or ?from=&to=)
const preset = ref<RangePreset | 'custom'>((route.query.preset as RangePreset) || (route.query.from ? 'custom' : '7d'))
const range = ref(
  preset.value === 'custom'
    ? { from: String(route.query.from), to: String(route.query.to ?? today) }
    : presetRange(preset.value, today)
)
const customFrom = ref(range.value.from)
const customTo = ref(range.value.to)
const rangeError = ref('')

function choosePreset(p: RangePreset) {
  preset.value = p
  range.value = presetRange(p, today)
  customFrom.value = range.value.from
  customTo.value = range.value.to
  rangeError.value = ''
}

function applyCustom() {
  rangeError.value = ''
  if (!customFrom.value || !customTo.value || customFrom.value > customTo.value) {
    rangeError.value = 'Khoảng ngày không hợp lệ'
    return
  }
  if (rangeDays(customFrom.value, customTo.value) > MAX_RANGE_DAYS) {
    rangeError.value = `Tối đa ${MAX_RANGE_DAYS} ngày`
    return
  }
  preset.value = 'custom'
  range.value = { from: customFrom.value, to: customTo.value }
}

watch([preset, range], () => {
  router.replace({ query: preset.value === 'custom' ? { ...range.value } : preset.value === '7d' ? {} : { preset: preset.value } })
})

const { data: report, pending, error } = await useFetch<SalesReport>('/api/admin/reports/sales', {
  query: range,
})
watch(error, (e) => (rangeError.value = e ? apiErrorMessage(e, 'Không tải được báo cáo') : ''))

const emptyKpis: ReportKpis = {
  revenue: 0, completedOrders: 0, placedOrders: 0, cancelledOrders: 0, avgOrderValue: 0, cogs: 0,
  grossProfit: 0, discounts: 0, shippingCollected: 0, newCustomers: 0, returningCustomers: 0, ordersWithoutCost: 0,
}
const k = computed(() => report.value?.kpis ?? emptyKpis)
const p = computed(() => report.value?.previous ?? emptyKpis)
const cancelRate = (x: ReportKpis) => (x.placedOrders ? x.cancelledOrders / x.placedOrders : 0)

const formatDay = (d: string) => d.split('-').reverse().join('/')
const dayLabel = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const weekdayFmt = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'UTC' })

const dailyBars = computed<ColumnDatum[]>(() =>
  (report.value?.daily ?? []).map((d) => ({
    key: d.day,
    label: `${weekdayFmt.format(new Date(`${d.day}T00:00:00Z`))}, ${formatDay(d.day)}`,
    shortLabel: dayLabel(d.day),
    value: d.revenue,
    tooltip: [formatVnd(d.revenue), `${d.orders} đơn hoàn tất`],
  }))
)
const dailyTable = computed(() => ({
  headers: ['Ngày', 'Số đơn', 'Doanh thu'],
  rows: (report.value?.daily ?? []).map((d) => [formatDay(d.day), d.orders, formatVnd(d.revenue)]),
}))

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}h`
const hourlyBars = computed<ColumnDatum[]>(() =>
  (report.value?.hourly ?? []).map((h) => ({
    key: String(h.hour),
    label: `${hourLabel(h.hour)} – ${hourLabel(h.hour + 1)}`,
    shortLabel: hourLabel(h.hour),
    value: h.orders,
    tooltip: [`${h.orders} đơn`, formatVnd(h.revenue)],
  }))
)
const hourlyTable = computed(() => ({
  headers: ['Khung giờ', 'Số đơn', 'Doanh thu'],
  rows: (report.value?.hourly ?? []).filter((h) => h.orders).map((h) => [`${hourLabel(h.hour)} – ${hourLabel(h.hour + 1)}`, h.orders, formatVnd(h.revenue)]),
}))
const peakHour = computed(() => {
  const best = [...(report.value?.hourly ?? [])].sort((a, b) => b.orders - a.orders)[0]
  return best?.orders ? `${hourLabel(best.hour)} – ${hourLabel(best.hour + 1)}` : ''
})

const maxQty = computed(() => Math.max(1, ...(report.value?.topProducts ?? []).map((x) => x.quantity)))
const categoryTotal = computed(() => (report.value?.categories ?? []).reduce((s, c) => s + c.revenue, 0))
const share = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%')

const exportUrl = (kind: 'orders' | 'products') =>
  `/api/admin/reports/export.csv?${new URLSearchParams({ kind, from: range.value.from, to: range.value.to })}`
</script>
