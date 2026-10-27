<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Nhập hàng</h1>
        <p class="text-gray-500 text-sm">Lập phiếu khi đặt hàng nhà cung cấp; bấm "Đã nhận hàng" khi hàng về để cộng vào kho.</p>
      </div>
      <NuxtLink v-if="canEdit" to="/admin/purchases/new" class="admin-btn-primary"><AppIcon name="plus" /> Phiếu nhập</NuxtLink>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
        :class="status === tab.value ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green' : 'bg-white border-gray-200 hover:border-brand-gold'"
        @click="status = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Phiếu</th>
            <th>Nhà cung cấp</th>
            <th>Trạng thái</th>
            <th class="text-right">Số dòng</th>
            <th class="text-right">Tổng tiền</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in purchases" :key="p.id">
            <td>
              <NuxtLink :to="`/admin/purchases/${p.id}`" class="font-mono font-bold hover:underline">{{ p.code }}</NuxtLink>
              <span v-if="p.note" class="block text-xs text-gray-500 max-w-[16rem] truncate">{{ p.note }}</span>
            </td>
            <td>{{ p.supplierName ?? '—' }}</td>
            <td><span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="PURCHASE_BADGE[p.status]">{{ PURCHASE_LABELS[p.status] }}</span></td>
            <td class="text-right tabular-nums">{{ p.itemCount }}</td>
            <td class="text-right tabular-nums font-semibold">{{ formatVnd(p.total) }}</td>
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(p.receivedAt ?? p.createdAt) }}</td>
          </tr>
          <tr v-if="!purchases.length">
            <td colspan="6" class="text-center text-gray-500 py-10">Chưa có phiếu nhập nào.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PurchaseListItem, PurchaseStatus } from '#shared/types/inventory'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nhập hàng' })

const canEdit = useCanEditCatalog()
const status = ref<'all' | PurchaseStatus>('all')
const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'draft', label: PURCHASE_LABELS.draft },
  { value: 'received', label: PURCHASE_LABELS.received },
  { value: 'cancelled', label: PURCHASE_LABELS.cancelled },
] as const

const { data } = await useFetch<PurchaseListItem[]>('/api/admin/purchases', {
  query: computed(() => ({ status: status.value })),
  default: () => [],
})
const purchases = computed(() => data.value)
</script>
