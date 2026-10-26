<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Khách hàng</h1>
        <p class="text-gray-500 text-sm">Tự tạo theo số điện thoại mỗi khi có đơn. {{ data?.total ?? 0 }} khách phù hợp bộ lọc.</p>
      </div>
      <a v-if="canExport" :href="exportUrl" class="admin-btn-secondary">⬇ Xuất CSV</a>
    </div>

    <div class="flex flex-wrap gap-2 mb-4">
      <input v-model="search" type="search" class="admin-input w-full sm:w-64" placeholder="Tên, SĐT, email...">
      <select v-model="tier" class="admin-input w-auto">
        <option value="all">Mọi hạng</option>
        <option v-for="(label, value) in TIER_LABELS" :key="value" :value="value">Hạng {{ label }}</option>
      </select>
      <select v-model="sort" class="admin-input w-auto">
        <option value="recent">Mua gần đây</option>
        <option value="spent">Chi tiêu nhiều</option>
        <option value="orders">Nhiều đơn</option>
        <option value="points">Nhiều điểm</option>
      </select>
      <label class="inline-flex items-center gap-2 text-sm px-3">
        <input v-model="birthdayMonth" type="checkbox" class="w-4 h-4 accent-brand-dark-green">
        <AppIcon name="cake" class="text-brand-gold" /> Sinh nhật tháng này
      </label>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
        :class="segment === tab.value ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green' : 'bg-white text-brand-dark-green border-gray-200 hover:border-brand-gold'"
        :title="tab.hint"
        @click="segment = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count != null" class="ml-1 text-xs opacity-70 tabular-nums">{{ tab.count }}</span>
      </button>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Hạng · Phân khúc</th>
            <th class="text-right">Đơn xong</th>
            <th class="text-right">Chi tiêu</th>
            <th class="text-right">Điểm</th>
            <th>Mua gần nhất</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in data?.items" :key="c.id" class="hover:bg-gray-50/60">
            <td>
              <NuxtLink :to="`/admin/customers/${c.id}`" class="font-semibold hover:underline">{{ c.name || 'Chưa có tên' }}</NuxtLink>
              <span class="block text-xs text-gray-500 font-mono">{{ c.phone }}</span>
              <span v-for="t in c.tags" :key="t" class="inline-block text-[10px] bg-gray-100 rounded-full px-2 py-0.5 mr-1 mt-1">{{ t }}</span>
            </td>
            <td class="whitespace-nowrap">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="TIER_BADGE[c.tier]">{{ TIER_LABELS[c.tier] }}</span>
              <span class="block text-xs text-gray-500 mt-1">{{ SEGMENT_LABELS[c.segment] }}</span>
            </td>
            <td class="text-right tabular-nums">{{ c.completedOrders }}</td>
            <td class="text-right tabular-nums">{{ formatVnd(c.totalSpent) }}</td>
            <td class="text-right tabular-nums">{{ c.points.toLocaleString('vi-VN') }}</td>
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—' }}</td>
          </tr>
          <tr v-if="!data?.items.length">
            <td colspan="6" class="text-center text-gray-500 py-10">Không có khách hàng nào phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="data && data.total > data.pageSize" class="flex items-center justify-center gap-3 mt-6 text-sm">
      <button type="button" class="admin-btn-secondary !py-1.5" :disabled="page <= 1" @click="page--">← Trước</button>
      <span class="tabular-nums">Trang {{ page }} / {{ Math.ceil(data.total / data.pageSize) }}</span>
      <button type="button" class="admin-btn-secondary !py-1.5" :disabled="page * data.pageSize >= data.total" @click="page++">Sau →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminCustomerListItem } from '#shared/types/customers'
import type { CustomerSegment } from '#shared/utils/loyalty'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Khách hàng' })

const route = useRoute()
const router = useRouter()
const canExport = useCanEditCatalog()

const segment = ref<'all' | CustomerSegment>((route.query.segment as CustomerSegment) || 'all')
const tier = ref(String(route.query.tier ?? 'all'))
const sort = ref(String(route.query.sort ?? 'recent'))
const birthdayMonth = ref(route.query.birthdayMonth === '1')
const search = ref(String(route.query.q ?? ''))
const debouncedSearch = refDebounced(search, 300)
const page = ref(Number(route.query.page ?? 1) || 1)

const filters = computed(() => ({
  segment: segment.value,
  tier: tier.value,
  sort: sort.value,
  birthdayMonth: birthdayMonth.value ? '1' : '0',
  q: debouncedSearch.value || undefined,
}))

watch(filters, () => (page.value = 1))
watch([filters, page], () => {
  const f = filters.value
  router.replace({
    query: {
      segment: f.segment === 'all' ? undefined : f.segment,
      tier: f.tier === 'all' ? undefined : f.tier,
      sort: f.sort === 'recent' ? undefined : f.sort,
      birthdayMonth: f.birthdayMonth === '1' ? '1' : undefined,
      q: f.q,
      page: page.value > 1 ? page.value : undefined,
    },
  })
})

const { data } = await useFetch<{
  items: AdminCustomerListItem[]
  total: number
  page: number
  pageSize: number
  counts: Record<CustomerSegment, number>
}>('/api/admin/customers', { query: computed(() => ({ ...filters.value, page: page.value })) })

const exportUrl = computed(() => {
  const params = new URLSearchParams(
    Object.entries(filters.value).filter((e): e is [string, string] => !!e[1]) as [string, string][]
  )
  return `/api/admin/customers/export.csv?${params}`
})

const TIER_BADGE = {
  member: 'bg-gray-100 text-gray-600',
  silver: 'bg-slate-200 text-slate-800',
  gold: 'bg-brand-gold/30 text-brand-dark-green',
} as const

const tabs = computed(() => [
  { value: 'all' as const, label: 'Tất cả', count: undefined as number | undefined, hint: '' },
  ...(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map((s) => ({
    value: s,
    label: SEGMENT_LABELS[s],
    count: data.value?.counts[s],
    hint: SEGMENT_HINTS[s],
  })),
])
</script>
