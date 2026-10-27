<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Kho nguyên liệu</h1>
        <p class="text-gray-500 text-sm">Tồn kho tự trừ khi đơn hoàn tất, tự cộng khi nhận hàng nhập.</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink v-if="canEdit" to="/admin/purchases/new" class="admin-btn-secondary"><AppIcon name="truck" /> Nhập hàng</NuxtLink>
        <button v-if="canEdit" type="button" class="admin-btn-primary" @click="openCreate"><AppIcon name="plus" /> Nguyên liệu</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Giá trị tồn kho</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ formatVnd(totalValue) }}</div>
      </div>
      <button type="button" class="admin-card p-4 text-left hover:border-brand-gold" @click="onlyLow = !onlyLow">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Sắp hết / đã hết</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums" :class="lowCount ? 'text-red-600' : ''">{{ lowCount }}</div>
        <div class="text-xs text-gray-500">{{ onlyLow ? 'Đang lọc — bấm để xem tất cả' : 'Bấm để chỉ xem các mục này' }}</div>
      </button>
      <div class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Nguyên liệu đang dùng</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ items.filter((i) => i.isActive).length }}</div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" type="search" class="admin-input sm:max-w-xs" placeholder="Tìm nguyên liệu...">
      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="showInactive" type="checkbox" class="w-4 h-4 accent-brand-dark-green"> Hiện cả mục ngừng dùng
      </label>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nguyên liệu</th>
            <th class="text-right">Tồn kho</th>
            <th class="text-right">Mức tối thiểu</th>
            <th class="text-right">Giá vốn / đơn vị</th>
            <th class="text-right">Giá trị</th>
            <th>Dùng trong</th>
            <th class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in filtered" :key="i.id" :class="{ 'opacity-50': !i.isActive }">
            <td>
              <NuxtLink :to="`/admin/inventory/${i.id}`" class="font-semibold hover:underline">{{ i.name }}</NuxtLink>
              <span v-if="i.isLow && i.isActive" class="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <AppIcon name="alert" /> {{ i.stock <= 0 ? 'Hết hàng' : 'Sắp hết' }}
              </span>
            </td>
            <td class="text-right tabular-nums font-semibold whitespace-nowrap" :class="i.stock < 0 ? 'text-red-600' : i.isLow ? 'text-amber-700' : ''">
              {{ formatQty(i.stock, i.unit) }}
            </td>
            <td class="text-right tabular-nums text-gray-500 whitespace-nowrap">{{ formatQty(i.minStock, i.unit) }}</td>
            <td class="text-right tabular-nums whitespace-nowrap">{{ formatUnitCost(i.avgCost) }}/{{ i.unit }}</td>
            <td class="text-right tabular-nums whitespace-nowrap">{{ formatVnd(i.stockValue) }}</td>
            <td class="text-xs text-gray-500 whitespace-nowrap">
              {{ i.usedByProducts }} món<template v-if="i.usedByOptions"> · {{ i.usedByOptions }} tuỳ chọn</template>
            </td>
            <td class="whitespace-nowrap text-right">
              <button type="button" class="text-sm font-semibold hover:underline" @click="adjusting = i">Kiểm kho</button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" class="text-center text-gray-500 py-10">
              {{ items.length ? 'Không có nguyên liệu nào phù hợp.' : 'Chưa có nguyên liệu. Thêm nguyên liệu rồi khai báo định mức cho từng món để hệ thống tự trừ kho.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <StockAdjustModal :ingredient="adjusting" @close="adjusting = null" @saved="refresh" />

    <AdminModal :open="isCreateOpen" title="Thêm nguyên liệu" @close="isCreateOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="create">
        <div class="grid grid-cols-[1fr_7rem] gap-3">
          <div>
            <label class="admin-label" for="ing-name">Tên nguyên liệu</label>
            <input id="ing-name" v-model="form.name" class="admin-input" placeholder="VD: Đậu xanh cà vỏ">
            <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
          </div>
          <div>
            <label class="admin-label" for="ing-unit">Đơn vị</label>
            <input id="ing-unit" v-model="form.unit" class="admin-input" list="unit-suggestions" placeholder="g">
            <datalist id="unit-suggestions"><option v-for="u in UNIT_SUGGESTIONS" :key="u" :value="u" /></datalist>
            <p v-if="errors.unit" class="admin-error">{{ errors.unit }}</p>
          </div>
        </div>
        <div>
          <label class="admin-label" for="ing-min">Cảnh báo khi tồn còn dưới ({{ form.unit || 'đơn vị' }})</label>
          <input id="ing-min" v-model.number="form.minStock" type="number" min="0" step="any" class="admin-input">
        </div>
        <fieldset class="bg-gray-50 rounded-2xl p-4 space-y-3">
          <legend class="text-xs font-semibold text-gray-600 px-1">Tồn đầu kỳ (tuỳ chọn)</legend>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="admin-label" for="ing-open">Số lượng hiện có</label>
              <input id="ing-open" v-model.number="form.openingStock" type="number" min="0" step="any" class="admin-input">
            </div>
            <div>
              <label class="admin-label" for="ing-cost">Giá mua / {{ form.unit || 'đơn vị' }} (đ)</label>
              <input id="ing-cost" v-model.number="form.openingCost" type="number" min="0" step="any" class="admin-input">
            </div>
          </div>
          <p class="text-xs text-gray-500">VD: mua 1kg đậu xanh 40.000đ, đơn vị "g" → giá 40đ/g.</p>
        </fieldset>
        <div>
          <label class="admin-label" for="ing-note">Ghi chú</label>
          <input id="ing-note" v-model="form.note" class="admin-input" placeholder="VD: Bảo quản ngăn mát">
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="admin-btn-secondary" @click="isCreateOpen = false">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Thêm' }}</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { ingredientCreateInput } from '#shared/schemas/inventory'
import type { IngredientListItem } from '#shared/types/inventory'
import StockAdjustModal from '~/components/admin/StockAdjustModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Kho nguyên liệu' })

const route = useRoute()
const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()
const { data, refresh } = await useFetch<IngredientListItem[]>('/api/admin/ingredients', { default: () => [] })
const items = computed(() => data.value)

const search = ref('')
const onlyLow = ref(route.query.low === '1')
const showInactive = ref(false)
const filtered = computed(() => {
  const q = slugify(search.value)
  return items.value.filter(
    (i) =>
      (showInactive.value || i.isActive) &&
      (!onlyLow.value || (i.isLow && i.isActive)) &&
      (!q || slugify(i.name).includes(q))
  )
})
const totalValue = computed(() => items.value.reduce((s, i) => s + i.stockValue, 0))
const lowCount = computed(() => items.value.filter((i) => i.isLow && i.isActive).length)

const adjusting = ref<IngredientListItem | null>(null)

// Create
const isCreateOpen = ref(false)
const blank = () => ({ name: '', unit: 'g', minStock: 0, openingStock: 0, openingCost: 0, note: '', isActive: true })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openCreate() {
  Object.assign(form, blank())
  errors.value = {}
  formError.value = ''
  isCreateOpen.value = true
}

async function create() {
  formError.value = ''
  const result = validateForm(ingredientCreateInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch('/api/admin/ingredients', { method: 'POST', body: result.data })
    isCreateOpen.value = false
    uiStore.showToast('Đã thêm nguyên liệu')
    await refresh()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
