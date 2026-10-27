<template>
  <div v-if="ing">
    <NuxtLink to="/admin/inventory" class="text-sm text-gray-500 hover:text-brand-dark-green">← Kho nguyên liệu</NuxtLink>
    <div class="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">{{ ing.name }}</h1>
        <p class="text-sm text-gray-500">
          Đơn vị: {{ ing.unit }}<template v-if="!ing.isActive"> · <span class="text-gray-700 font-semibold">Ngừng dùng</span></template>
        </p>
      </div>
      <button type="button" class="admin-btn-primary" @click="adjusting = true">Kiểm kho / Hao hụt</button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Tồn kho</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums" :class="ing.stock < 0 ? 'text-red-600' : ing.isLow ? 'text-amber-700' : ''">{{ formatQty(ing.stock, ing.unit) }}</div>
        <div v-if="ing.isLow" class="text-xs text-red-600 inline-flex items-center gap-1"><AppIcon name="alert" /> Dưới mức {{ formatQty(ing.minStock, ing.unit) }}</div>
      </div>
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Giá vốn bình quân</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ formatUnitCost(ing.avgCost) }}/{{ ing.unit }}</div>
      </div>
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Giá trị tồn</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ formatVnd(ing.stockValue) }}</div>
      </div>
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Dùng trong</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ ing.usedIn.length }}</div>
        <div class="text-xs text-gray-500">món / tuỳ chọn</div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <section class="lg:col-span-2 admin-card overflow-x-auto">
        <h2 class="font-bold px-6 pt-5 pb-3">Lịch sử nhập – xuất (100 dòng gần nhất)</h2>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Loại</th>
              <th class="text-right">Số lượng</th>
              <th class="text-right">Tồn sau</th>
              <th>Chứng từ / ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in ing.movements" :key="m.id">
              <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(m.createdAt) }}</td>
              <td class="whitespace-nowrap"><span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="MOVEMENT_BADGE[m.type]">{{ MOVEMENT_LABELS[m.type] }}</span></td>
              <td class="text-right tabular-nums font-semibold whitespace-nowrap" :class="m.quantity < 0 ? 'text-red-600' : 'text-emerald-700'">
                {{ m.quantity > 0 ? '+' : '' }}{{ formatQty(m.quantity, ing.unit) }}
              </td>
              <td class="text-right tabular-nums whitespace-nowrap">{{ formatQty(m.balanceAfter, ing.unit) }}</td>
              <td class="text-xs">
                <NuxtLink v-if="m.ref" :to="m.ref.kind === 'purchase' ? `/admin/purchases/${m.ref.id}` : `/admin/orders/${m.ref.id}`" class="font-mono underline">{{ m.ref.code }}</NuxtLink>
                <span v-if="m.note" class="text-gray-600"> {{ m.note }}</span>
                <span v-if="m.by" class="text-gray-400"> · {{ m.by }}</span>
              </td>
            </tr>
            <tr v-if="!ing.movements.length"><td colspan="5" class="text-center text-gray-500 py-8">Chưa có biến động.</td></tr>
          </tbody>
        </table>
      </section>

      <div class="space-y-6">
        <form v-if="canEdit" class="admin-card p-6 space-y-3" novalidate @submit.prevent="save">
          <h2 class="font-bold">Thông tin</h2>
          <div>
            <label class="admin-label" for="e-name">Tên</label>
            <input id="e-name" v-model="form.name" class="admin-input">
            <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="admin-label" for="e-unit">Đơn vị</label>
              <input id="e-unit" v-model="form.unit" class="admin-input" list="unit-suggestions-edit">
              <datalist id="unit-suggestions-edit"><option v-for="u in UNIT_SUGGESTIONS" :key="u" :value="u" /></datalist>
            </div>
            <div>
              <label class="admin-label" for="e-min">Mức tối thiểu</label>
              <input id="e-min" v-model.number="form.minStock" type="number" min="0" step="any" class="admin-input">
            </div>
          </div>
          <p v-if="form.unit !== ing.unit" class="text-xs text-amber-700">
            Đổi đơn vị không quy đổi số tồn và định mức đã nhập. Chỉ đổi khi bạn nhập nhầm đơn vị ban đầu.
          </p>
          <div>
            <label class="admin-label" for="e-note">Ghi chú</label>
            <input id="e-note" v-model="form.note" class="admin-input">
          </div>
          <AdminToggle v-model="form.isActive" label="Đang dùng" />
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn-primary flex-1" :disabled="isSaving">Lưu</button>
            <button type="button" class="admin-btn-danger" :disabled="isSaving" @click="remove"><AppIcon name="trash" /></button>
          </div>
        </form>

        <section class="admin-card p-6 text-sm">
          <h2 class="font-bold mb-3">Dùng trong định mức</h2>
          <ul v-if="ing.usedIn.length" class="space-y-2">
            <li v-for="u in ing.usedIn" :key="`${u.kind}-${u.id}`" class="flex justify-between gap-2">
              <NuxtLink :to="u.kind === 'product' ? `/admin/products/${u.id}` : '/admin/options'" class="hover:underline">
                {{ u.name }} <span v-if="u.kind === 'option'" class="text-xs text-gray-400">(tuỳ chọn)</span>
              </NuxtLink>
              <span class="tabular-nums text-gray-600 whitespace-nowrap">{{ formatQty(u.quantity, ing.unit) }}</span>
            </li>
          </ul>
          <p v-else class="text-gray-500">Chưa món nào dùng. Khai báo định mức trong trang sửa món.</p>
        </section>
      </div>
    </div>

    <StockAdjustModal :ingredient="adjusting ? ing : null" @close="adjusting = false" @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ingredientInput } from '#shared/schemas/inventory'
import type { IngredientDetail } from '#shared/types/inventory'
import type { StockMovementType } from '#shared/utils/inventory'
import StockAdjustModal from '~/components/admin/StockAdjustModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()

const { data: ing, error, refresh } = await useFetch<IngredientDetail>(`/api/admin/ingredients/${route.params.id}`)
if (error.value || !ing.value) throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
useHead({ title: () => ing.value?.name ?? 'Nguyên liệu' })

const MOVEMENT_BADGE: Record<StockMovementType, string> = {
  in: 'bg-emerald-50 text-emerald-700',
  out: 'bg-sky-50 text-sky-700',
  adjust: 'bg-gray-100 text-gray-700',
  waste: 'bg-red-50 text-red-700',
}

const adjusting = ref(false)

const form = reactive({ name: '', unit: '', minStock: 0, note: '', isActive: true })
watch(
  ing,
  (v) => v && Object.assign(form, { name: v.name, unit: v.unit, minStock: v.minStock, note: v.note, isActive: v.isActive }),
  { immediate: true }
)
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

async function save() {
  formError.value = ''
  const result = validateForm(ingredientInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch(`/api/admin/ingredients/${route.params.id}`, { method: 'PUT', body: result.data })
    uiStore.showToast('Đã lưu')
    await refresh()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove() {
  if (!confirm(`Xoá nguyên liệu "${ing.value?.name}"?`)) return
  try {
    await adminFetch(`/api/admin/ingredients/${route.params.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá nguyên liệu')
    await navigateTo('/admin/inventory')
  } catch (e) {
    formError.value = apiErrorMessage(e)
  }
}
</script>
