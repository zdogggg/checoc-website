<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Đơn hàng</h1>
        <p class="text-gray-500 text-sm">Tự cập nhật mỗi 15 giây.</p>
      </div>
      <div class="flex gap-2">
        <input v-model="search" type="search" class="admin-input w-48 sm:w-64" placeholder="Mã đơn, tên, SĐT...">
        <input v-model="day" type="date" class="admin-input w-40" aria-label="Lọc theo ngày">
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
        :class="status === tab.value ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green' : 'bg-white text-brand-dark-green border-gray-200 hover:border-brand-gold'"
        @click="status = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count != null" class="ml-1 text-xs opacity-70 tabular-nums">{{ tab.count }}</span>
      </button>
    </div>

    <div class="space-y-3">
      <article
        v-for="o in data?.items"
        :key="o.id"
        class="admin-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
        :class="{ 'ring-2 ring-amber-300': o.status === 'pending' }"
      >
        <NuxtLink :to="`/admin/orders/${o.id}`" class="flex-1 min-w-0 group">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="font-mono font-bold group-hover:underline">{{ o.code }}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="ORDER_STATUS_BADGE[o.status]">{{ ORDER_STATUS_LABELS[o.status] }}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="PAYMENT_STATUS_BADGE[o.paymentStatus]">
              {{ o.paymentMethod === 'cod' ? 'COD' : 'CK' }} · {{ PAYMENT_STATUS_LABELS[o.paymentStatus] }}
            </span>
            <span class="text-xs text-gray-400" :title="formatDateTime(o.createdAt)">
              <ClientOnly :fallback="formatTime(o.createdAt)">{{ timeAgo(o.createdAt, now) }}</ClientOnly>
            </span>
          </div>
          <p class="text-sm"><strong>{{ o.customerName }}</strong> · {{ o.customerPhone }} · {{ o.district }}</p>
          <p class="text-sm text-gray-500 truncate">{{ o.itemSummary }}</p>
        </NuxtLink>
        <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <span class="font-heading text-lg font-bold tabular-nums">{{ formatVnd(o.total) }}</span>
          <button
            v-if="nextForwardStatus(o.status)"
            type="button"
            class="admin-btn-primary !py-1.5 !px-4 !text-xs"
            :disabled="pendingId === o.id"
            @click="advance(o)"
          >
            {{ FORWARD_ACTION_LABELS[nextForwardStatus(o.status)!] }} →
          </button>
        </div>
      </article>

      <div v-if="!data?.items.length" class="admin-card p-10 text-center text-gray-500">
        Không có đơn hàng nào{{ status === 'active' ? ' đang cần xử lý' : '' }}.
      </div>
    </div>

    <div v-if="data && data.total > data.pageSize" class="flex items-center justify-center gap-3 mt-6 text-sm">
      <button type="button" class="admin-btn-secondary !py-1.5" :disabled="page <= 1" @click="page--">← Trước</button>
      <span class="tabular-nums">Trang {{ page }} / {{ Math.ceil(data.total / data.pageSize) }}</span>
      <button type="button" class="admin-btn-secondary !py-1.5" :disabled="page * data.pageSize >= data.total" @click="page++">Sau →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminOrderListItem } from '#shared/types/orders'
import type { OrderStatus } from '#shared/utils/orders'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Đơn hàng' })

type Tab = 'active' | OrderStatus | 'all'

const route = useRoute()
const router = useRouter()
const adminFetch = useAdminApi()
const uiStore = useUiStore()

// Filters live in the URL so a refresh or a shared link keeps them
const status = ref<Tab>((route.query.status as Tab) || 'active')
const search = ref(String(route.query.q ?? ''))
const debouncedSearch = refDebounced(search, 300)
const day = ref(String(route.query.day ?? ''))
const page = ref(Number(route.query.page ?? 1) || 1)

watch([status, debouncedSearch, day], () => (page.value = 1))
watch([status, debouncedSearch, day, page], () => {
  router.replace({
    query: {
      status: status.value === 'active' ? undefined : status.value,
      q: debouncedSearch.value || undefined,
      day: day.value || undefined,
      page: page.value > 1 ? page.value : undefined,
    },
  })
})

const { data, refresh } = await useFetch<{
  items: AdminOrderListItem[]
  total: number
  page: number
  pageSize: number
  counts: Partial<Record<OrderStatus, number>>
}>('/api/admin/orders', {
  query: computed(() => ({
    status: status.value,
    q: debouncedSearch.value || undefined,
    day: day.value || undefined,
    page: page.value,
  })),
})

const count = (s: OrderStatus) => data.value?.counts[s] ?? 0
const tabs = computed<{ value: Tab; label: string; count?: number }[]>(() => [
  { value: 'active', label: 'Đang xử lý', count: count('pending') + count('confirmed') + count('preparing') + count('shipping') },
  { value: 'pending', label: ORDER_STATUS_LABELS.pending, count: count('pending') },
  { value: 'confirmed', label: ORDER_STATUS_LABELS.confirmed, count: count('confirmed') },
  { value: 'preparing', label: ORDER_STATUS_LABELS.preparing, count: count('preparing') },
  { value: 'shipping', label: ORDER_STATUS_LABELS.shipping, count: count('shipping') },
  { value: 'completed', label: ORDER_STATUS_LABELS.completed, count: count('completed') },
  { value: 'cancelled', label: ORDER_STATUS_LABELS.cancelled, count: count('cancelled') },
  { value: 'all', label: 'Tất cả' },
])

const now = ref(Date.now())
useIntervalFn(() => {
  now.value = Date.now()
  refresh()
}, 15_000)

const pendingId = ref<number | null>(null)

async function advance(o: AdminOrderListItem) {
  const to = nextForwardStatus(o.status)
  if (!to) return
  pendingId.value = o.id
  try {
    await adminFetch(`/api/admin/orders/${o.id}/status`, { method: 'POST', body: { status: to } })
    uiStore.showToast(`${o.code}: ${ORDER_STATUS_LABELS[to]}`)
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  } finally {
    pendingId.value = null
    await Promise.all([refresh(), refreshNuxtData('admin:pulse')])
  }
}
</script>
