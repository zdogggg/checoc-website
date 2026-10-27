<template>
  <AdminModal :open="!!ingredient" :title="`Kho: ${ingredient?.name ?? ''}`" @close="$emit('close')">
    <form v-if="ingredient" class="space-y-4" novalidate @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="m in modes"
          :key="m.value"
          type="button"
          class="rounded-xl border px-3 py-2 text-sm font-semibold"
          :class="mode === m.value ? 'border-brand-dark-green bg-brand-dark-green text-brand-cream' : 'border-gray-200'"
          @click="mode = m.value"
        >
          {{ m.label }}
        </button>
      </div>
      <p class="text-sm text-gray-600">
        Tồn trên hệ thống: <strong :class="ingredient.stock < 0 ? 'text-red-600' : ''">{{ formatQty(ingredient.stock, ingredient.unit) }}</strong>
      </p>
      <div>
        <label class="admin-label" for="adj-qty">{{ mode === 'count' ? `Số lượng đếm được thực tế (${ingredient.unit})` : `Số lượng bỏ đi (${ingredient.unit})` }}</label>
        <input id="adj-qty" v-model.number="quantity" type="number" min="0" step="any" class="admin-input tabular-nums">
        <p v-if="mode === 'count' && quantity !== null && quantity !== '' && !Number.isNaN(Number(quantity))" class="text-xs mt-1" :class="difference < 0 ? 'text-red-600' : 'text-emerald-700'">
          Chênh lệch: {{ difference > 0 ? '+' : '' }}{{ formatQty(difference, ingredient.unit) }}
        </p>
        <p v-if="errors.quantity" class="admin-error">{{ errors.quantity }}</p>
      </div>
      <div>
        <label class="admin-label" for="adj-note">{{ mode === 'waste' ? 'Lý do (bắt buộc)' : 'Ghi chú' }}</label>
        <input id="adj-note" v-model="note" class="admin-input" :placeholder="mode === 'waste' ? 'VD: Hết hạn, đổ vỡ, nấu hỏng' : 'VD: Kiểm kho cuối ngày'">
        <p v-if="errors.note" class="admin-error">{{ errors.note }}</p>
      </div>
      <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-btn-secondary" @click="$emit('close')">Huỷ</button>
        <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Ghi nhận' }}</button>
      </div>
    </form>
  </AdminModal>
</template>

<script setup lang="ts">
import { stockAdjustInput } from '#shared/schemas/inventory'

const props = defineProps<{ ingredient: { id: number; name: string; unit: string; stock: number } | null }>()
const emit = defineEmits<{ (e: 'close' | 'saved'): void }>()

const adminFetch = useAdminApi()
const uiStore = useUiStore()

const modes = [
  { value: 'count', label: 'Kiểm kho' },
  { value: 'waste', label: 'Ghi hao hụt' },
] as const
const mode = ref<'count' | 'waste'>('count')
const quantity = ref<number | '' | null>(null)
const note = ref('')
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

const difference = computed(() => roundQty(Number(quantity.value) - (props.ingredient?.stock ?? 0)))

watch(
  () => props.ingredient,
  () => {
    mode.value = 'count'
    quantity.value = null
    note.value = ''
    errors.value = {}
    formError.value = ''
  }
)

async function submit() {
  if (!props.ingredient) return
  formError.value = ''
  const result = validateForm(stockAdjustInput, { mode: mode.value, quantity: quantity.value ?? '', note: note.value })
  errors.value = result.errors ?? {}
  if (quantity.value === null || quantity.value === '') errors.value.quantity = 'Vui lòng nhập số lượng'
  if (!result.data || errors.value.quantity) return

  isSaving.value = true
  try {
    const res = await adminFetch<{ changed: boolean }>(`/api/admin/ingredients/${props.ingredient.id}/adjust`, {
      method: 'POST',
      body: result.data,
    })
    uiStore.showToast(res.changed ? 'Đã cập nhật kho' : 'Số đếm khớp với hệ thống')
    emit('saved')
    emit('close')
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
