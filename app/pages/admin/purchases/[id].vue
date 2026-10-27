<template>
  <div>
    <NuxtLink to="/admin/purchases" class="text-sm text-gray-500 hover:text-brand-dark-green">← Danh sách phiếu nhập</NuxtLink>
    <div class="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">{{ isNew ? 'Phiếu nhập mới' : purchase?.code }}</h1>
        <p v-if="purchase" class="text-sm text-gray-500">
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="PURCHASE_BADGE[purchase.status]">{{ PURCHASE_LABELS[purchase.status] }}</span>
          · Lập {{ formatDateTime(purchase.createdAt) }}<template v-if="purchase.createdBy"> bởi {{ purchase.createdBy }}</template>
          <template v-if="purchase.receivedAt"> · Nhận {{ formatDateTime(purchase.receivedAt) }}</template>
        </p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <section class="lg:col-span-2 admin-card p-6">
        <h2 class="font-bold mb-4">Hàng nhập</h2>
        <div v-if="editable" class="space-y-2">
          <div class="hidden sm:grid grid-cols-[1fr_8rem_8rem_7rem_2rem] gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Nguyên liệu</span><span>Số lượng</span><span>Giá / đơn vị</span><span class="text-right">Thành tiền</span><span />
          </div>
          <div v-for="(line, i) in form.items" :key="i" class="grid grid-cols-2 sm:grid-cols-[1fr_8rem_8rem_7rem_2rem] gap-2 items-center">
            <select v-model.number="line.ingredientId" class="admin-input col-span-2 sm:col-span-1" :aria-label="`Nguyên liệu dòng ${i + 1}`">
              <option :value="0" disabled>Chọn nguyên liệu</option>
              <option v-for="ing in activeIngredients" :key="ing.id" :value="ing.id">{{ ing.name }} ({{ ing.unit }})</option>
            </select>
            <div class="relative">
              <input v-model.number="line.quantity" type="number" min="0" step="any" class="admin-input pr-10" :aria-label="`Số lượng dòng ${i + 1}`">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{{ unitOf(line.ingredientId) }}</span>
            </div>
            <input v-model.number="line.unitCost" type="number" min="0" step="any" class="admin-input" placeholder="đ" :aria-label="`Giá dòng ${i + 1}`">
            <span class="text-right tabular-nums font-semibold text-sm">{{ formatVnd(Math.round((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))) }}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 justify-self-end" aria-label="Xoá dòng" @click="form.items.splice(i, 1)"><AppIcon name="trash" /></button>
          </div>
          <button type="button" class="admin-btn-secondary !py-1.5 !text-xs mt-2" @click="addLine"><AppIcon name="plus" /> Thêm dòng</button>
          <p class="text-xs text-gray-500">Giá theo đúng đơn vị của nguyên liệu, VD: 1kg đậu 40.000đ, đơn vị g → 40đ.</p>
        </div>
        <table v-else class="admin-table">
          <thead>
            <tr><th>Nguyên liệu</th><th class="text-right">Số lượng</th><th class="text-right">Giá / đơn vị</th><th class="text-right">Thành tiền</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in purchase?.items" :key="item.id">
              <td><NuxtLink :to="`/admin/inventory/${item.ingredientId}`" class="hover:underline">{{ item.name }}</NuxtLink></td>
              <td class="text-right tabular-nums">{{ formatQty(item.quantity, item.unit) }}</td>
              <td class="text-right tabular-nums">{{ formatUnitCost(item.unitCost) }}</td>
              <td class="text-right tabular-nums font-semibold">{{ formatVnd(item.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
          <span class="font-bold">Tổng tiền</span>
          <span class="font-heading text-2xl font-bold tabular-nums">{{ formatVnd(editable ? draftTotal : purchase?.total ?? 0) }}</span>
        </div>
      </section>

      <div class="space-y-6">
        <section class="admin-card p-6 space-y-3">
          <div>
            <label class="admin-label" for="po-supplier">Nhà cung cấp</label>
            <select v-if="editable" id="po-supplier" v-model="form.supplierId" class="admin-input">
              <option :value="null">Không chọn</option>
              <option v-for="s in suppliers.filter((s) => s.isActive || s.id === form.supplierId)" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p v-else class="text-sm">{{ purchase?.supplierName ?? '—' }}</p>
            <NuxtLink v-if="editable && !suppliers.length" to="/admin/suppliers" class="text-xs underline">Thêm nhà cung cấp</NuxtLink>
          </div>
          <div>
            <label class="admin-label" for="po-note">Ghi chú</label>
            <textarea v-if="editable" id="po-note" v-model="form.note" rows="2" class="admin-input" />
            <p v-else class="text-sm text-gray-600">{{ purchase?.note || '—' }}</p>
          </div>
        </section>

        <div v-if="editable && canEdit" class="space-y-2">
          <p v-if="formError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{{ formError }}</p>
          <button type="button" class="admin-btn-secondary w-full" :disabled="isBusy" @click="save()">{{ isNew ? 'Lưu phiếu (chờ nhận hàng)' : 'Lưu thay đổi' }}</button>
          <button type="button" class="admin-btn-primary w-full" :disabled="isBusy" @click="receive">
            <AppIcon name="check" /> {{ isNew ? 'Lưu & nhận hàng ngay' : 'Đã nhận hàng — cộng vào kho' }}
          </button>
          <button v-if="!isNew" type="button" class="admin-btn-danger w-full" :disabled="isBusy" @click="cancel">Huỷ phiếu</button>
        </div>
        <p v-else-if="purchase?.status === 'received'" class="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
          Hàng đã được cộng vào kho và cập nhật giá vốn bình quân.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { purchaseInput } from '#shared/schemas/inventory'
import type { IngredientListItem, PurchaseDetail, SupplierView } from '#shared/types/inventory'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()
const isNew = computed(() => route.params.id === 'new')

const [{ data: ingredients }, { data: suppliers }] = await Promise.all([
  useFetch<IngredientListItem[]>('/api/admin/ingredients', { default: () => [] }),
  useFetch<SupplierView[]>('/api/admin/suppliers', { default: () => [] }),
])
const activeIngredients = computed(() => ingredients.value.filter((i) => i.isActive || form.items.some((l) => l.ingredientId === i.id)))
const unitOf = (id: number) => ingredients.value.find((i) => i.id === id)?.unit ?? ''

const purchase = ref<PurchaseDetail | null>(null)
if (!isNew.value) {
  const { data, error } = await useFetch<PurchaseDetail>(`/api/admin/purchases/${route.params.id}`)
  if (error.value || !data.value) throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
  purchase.value = data.value
}
useHead({ title: () => (isNew.value ? 'Phiếu nhập mới' : (purchase.value?.code ?? 'Phiếu nhập')) })

const editable = computed(() => isNew.value || purchase.value?.status === 'draft')

type Line = { ingredientId: number; quantity: number | ''; unitCost: number | '' }
const form = reactive({
  supplierId: (purchase.value?.supplierId ?? null) as number | null,
  note: purchase.value?.note ?? '',
  items: (purchase.value?.items.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unitCost: i.unitCost })) ?? [
    // Start with low-stock items, which is what usually needs buying
    ...ingredients.value
      .filter((i) => i.isLow && i.isActive)
      .map((i) => ({ ingredientId: i.id, quantity: '' as const, unitCost: Math.round(i.avgCost * 100) / 100 || ('' as const) })),
  ]) as Line[],
})
if (!form.items.length) form.items.push({ ingredientId: 0, quantity: '', unitCost: '' })

function addLine() {
  form.items.push({ ingredientId: 0, quantity: '', unitCost: '' })
}

const draftTotal = computed(() =>
  form.items.reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.unitCost) || 0)), 0)
)

const formError = ref('')
const isBusy = ref(false)

// Returns the purchase id, or null when validation/saving failed.
// redirect: move a new receipt to its own URL right away (not when receiving next)
async function save(silent = false, redirect = true): Promise<number | null> {
  formError.value = ''
  const result = validateForm(purchaseInput, {
    ...form,
    items: form.items.filter((l) => l.ingredientId || l.quantity !== '' || l.unitCost !== ''),
  })
  if (!result.data) {
    formError.value = Object.values(result.errors)[0] ?? 'Vui lòng kiểm tra lại các dòng'
    return null
  }
  isBusy.value = true
  try {
    const saved = await adminFetch<PurchaseDetail>(isNew.value ? '/api/admin/purchases' : `/api/admin/purchases/${route.params.id}`, {
      method: isNew.value ? 'POST' : 'PUT',
      body: result.data,
    })
    purchase.value = saved
    if (!silent) uiStore.showToast('Đã lưu phiếu nhập')
    if (isNew.value && redirect) await navigateTo(`/admin/purchases/${saved.id}`, { replace: true })
    return saved.id
  } catch (e) {
    formError.value = apiErrorMessage(e)
    return null
  } finally {
    isBusy.value = false
  }
}

async function receive() {
  if (!confirm('Xác nhận đã nhận đủ hàng? Số lượng sẽ được cộng vào kho và không sửa được nữa.')) return
  const wasNew = isNew.value
  const id = await save(true, false)
  if (!id) return
  isBusy.value = true
  try {
    purchase.value = await adminFetch<PurchaseDetail>(`/api/admin/purchases/${id}/receive`, { method: 'POST' })
    uiStore.showToast('Đã nhận hàng, kho đã được cập nhật')
    refreshNuxtData('admin:pulse')
    if (wasNew) await navigateTo(`/admin/purchases/${id}`, { replace: true })
  } catch (e) {
    // A new receipt was saved but not received: show it (with the reason) so it can be retried
    uiStore.showToast(apiErrorMessage(e), 'warning')
    if (wasNew) await navigateTo(`/admin/purchases/${id}`, { replace: true })
    formError.value = apiErrorMessage(e)
  } finally {
    isBusy.value = false
  }
}

async function cancel() {
  if (!confirm('Huỷ phiếu nhập này?')) return
  isBusy.value = true
  try {
    purchase.value = await adminFetch<PurchaseDetail>(`/api/admin/purchases/${route.params.id}/cancel`, { method: 'POST' })
    uiStore.showToast('Đã huỷ phiếu')
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    isBusy.value = false
  }
}
</script>
