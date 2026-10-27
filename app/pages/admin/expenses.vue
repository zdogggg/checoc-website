<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Chi phí & lãi lỗ</h1>
        <p class="text-gray-500 text-sm">Theo tháng, tính trên các đơn đã hoàn tất.</p>
      </div>
      <div class="flex gap-2 items-center">
        <input v-model="month" type="month" class="admin-input w-44" aria-label="Chọn tháng">
        <button type="button" class="admin-btn-primary" @click="openForm()"><AppIcon name="plus" /> Khoản chi</button>
      </div>
    </div>

    <div v-if="pnl" class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      <div v-for="card in cards" :key="card.label" class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ card.label }}</div>
        <div class="font-heading text-xl sm:text-2xl font-bold mt-1 tabular-nums" :class="card.cls">{{ formatVnd(card.value) }}</div>
        <div v-if="card.hint" class="text-xs text-gray-500 mt-0.5">{{ card.hint }}</div>
      </div>
    </div>
    <p v-if="pnl?.ordersWithoutCost" class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-6 flex gap-2">
      <AppIcon name="alert" class="mt-0.5" />
      <span>
        {{ pnl.ordersWithoutCost }} đơn hoàn tất trong tháng chưa có giá vốn (món chưa khai báo định mức nguyên liệu),
        nên lãi gộp đang cao hơn thực tế. Khai báo định mức trong trang sửa món để các đơn sau được tính đúng.
      </span>
    </p>

    <div class="grid xl:grid-cols-3 gap-6 items-start">
      <section class="xl:col-span-2 admin-card overflow-x-auto">
        <h2 class="font-bold px-6 pt-5 pb-3">Khoản chi trong tháng</h2>
        <table class="admin-table">
          <thead>
            <tr><th>Ngày</th><th>Loại</th><th>Ghi chú</th><th class="text-right">Số tiền</th><th class="w-px" /></tr>
          </thead>
          <tbody>
            <tr v-for="e in data?.items" :key="e.id">
              <td class="whitespace-nowrap text-sm">{{ formatDay(e.spentOn) }}</td>
              <td class="whitespace-nowrap">{{ EXPENSE_CATEGORY_LABELS[e.category] }}</td>
              <td class="text-sm text-gray-600 min-w-[12rem]">
                {{ e.note || '—' }}<span v-if="e.createdBy" class="text-xs text-gray-400"> · {{ e.createdBy }}</span>
              </td>
              <td class="text-right tabular-nums font-semibold">{{ formatVnd(e.amount) }}</td>
              <td class="whitespace-nowrap text-right">
                <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="openForm(e)">Sửa</button>
                <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(e)">Xoá</button>
              </td>
            </tr>
            <tr v-if="!data?.items.length"><td colspan="5" class="text-center text-gray-500 py-8">Chưa có khoản chi nào trong tháng.</td></tr>
          </tbody>
        </table>
      </section>

      <section class="admin-card p-6">
        <h2 class="font-bold mb-3">Cơ cấu chi phí</h2>
        <ul v-if="breakdown.length" class="space-y-2.5 text-sm">
          <li v-for="b in breakdown" :key="b.category">
            <div class="flex justify-between gap-2">
              <span>{{ EXPENSE_CATEGORY_LABELS[b.category] }}</span>
              <span class="tabular-nums font-semibold">{{ formatVnd(b.amount) }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
              <div class="h-full rounded-full bg-brand-dark-green" :style="{ width: `${b.share}%` }" />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500">Chưa có dữ liệu.</p>
      </section>
    </div>

    <AdminModal :open="isFormOpen" :title="editingId ? 'Sửa khoản chi' : 'Thêm khoản chi'" @close="isFormOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="x-cat">Loại</label>
            <select id="x-cat" v-model="form.category" class="admin-input">
              <option v-for="(label, value) in EXPENSE_CATEGORY_LABELS" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="admin-label" for="x-date">Ngày chi</label>
            <input id="x-date" v-model="form.spentOn" type="date" class="admin-input">
            <p v-if="errors.spentOn" class="admin-error">{{ errors.spentOn }}</p>
          </div>
        </div>
        <div>
          <label class="admin-label" for="x-amount">Số tiền (đ)</label>
          <input id="x-amount" v-model.number="form.amount" type="number" min="0" step="1000" class="admin-input">
          <p v-if="errors.amount" class="admin-error">{{ errors.amount }}</p>
        </div>
        <div>
          <label class="admin-label" for="x-note">Ghi chú</label>
          <input id="x-note" v-model="form.note" class="admin-input" placeholder="VD: Tiền điện tháng 10">
        </div>
        <p class="text-xs text-gray-500">Tiền mua nguyên liệu không nhập ở đây: nó đã nằm trong giá vốn qua phiếu nhập hàng.</p>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="admin-btn-secondary" @click="isFormOpen = false">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { expenseInput } from '#shared/schemas/inventory'
import type { ExpenseView, MonthlyPnl } from '#shared/types/inventory'
import type { ExpenseCategory } from '#shared/utils/inventory'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Chi phí & lãi lỗ' })

const adminFetch = useAdminApi()
const uiStore = useUiStore()

const shopToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE }).format(new Date())
const month = ref(shopToday().slice(0, 7))

const { data, refresh } = await useFetch<{ items: ExpenseView[]; pnl: MonthlyPnl }>('/api/admin/expenses', {
  query: computed(() => ({ month: month.value })),
})
const pnl = computed(() => data.value?.pnl)

const cards = computed(() => {
  const p = pnl.value
  if (!p) return []
  const share = (n: number) => (p.revenue ? `${Math.round((n / p.revenue) * 100)}% doanh thu` : '')
  const tone = (n: number) => (n < 0 ? 'text-red-600' : 'text-emerald-700')
  return [
    { label: 'Doanh thu', value: p.revenue, hint: 'Tiền món, không gồm phí ship', cls: '' },
    { label: 'Giá vốn nguyên liệu', value: p.cogs, hint: share(p.cogs), cls: '' },
    { label: 'Lãi gộp', value: p.grossProfit, hint: share(p.grossProfit), cls: tone(p.grossProfit) },
    { label: 'Chi phí vận hành', value: p.expenses, hint: share(p.expenses), cls: '' },
    { label: 'Lợi nhuận ròng', value: p.netProfit, hint: share(p.netProfit), cls: tone(p.netProfit) },
  ]
})

const breakdown = computed(() => {
  const p = pnl.value
  if (!p?.expenses) return []
  return (Object.entries(p.expensesByCategory) as [ExpenseCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount, share: Math.round((amount / p.expenses) * 100) }))
})

const formatDay = (d: string) => d.split('-').reverse().join('/')

// Form
const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const blank = () => ({ category: 'utilities' as ExpenseCategory, amount: null as number | null, spentOn: shopToday(), note: '' })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openForm(e?: ExpenseView) {
  Object.assign(form, blank(), e ? { category: e.category, amount: e.amount, spentOn: e.spentOn, note: e.note } : {})
  editingId.value = e?.id ?? null
  errors.value = {}
  formError.value = ''
  isFormOpen.value = true
}

async function save() {
  formError.value = ''
  const result = validateForm(expenseInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/expenses/${editingId.value}` : '/api/admin/expenses', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    isFormOpen.value = false
    uiStore.showToast('Đã lưu khoản chi')
    // Jump to the month of the saved expense so it is visible
    month.value = result.data.spentOn.slice(0, 7)
    await refresh()
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove(e: ExpenseView) {
  if (!confirm(`Xoá khoản chi ${formatVnd(e.amount)}?`)) return
  try {
    await adminFetch(`/api/admin/expenses/${e.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá')
    await refresh()
  } catch (err) {
    uiStore.showToast(apiErrorMessage(err), 'warning')
  }
}
</script>
