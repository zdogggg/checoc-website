<template>
  <div class="space-y-3">
    <p v-if="!ingredients.length" class="text-sm text-gray-500">
      Chưa có nguyên liệu nào. <NuxtLink to="/admin/inventory" class="underline">Thêm nguyên liệu</NuxtLink> trước rồi quay lại khai báo định mức.
    </p>
    <template v-else>
      <div v-for="(line, i) in lines" :key="i" class="grid grid-cols-[1fr_7rem_2rem] gap-2 items-center">
        <select v-model.number="line.ingredientId" class="admin-input" :disabled="!canEdit" :aria-label="`Nguyên liệu ${i + 1}`">
          <option :value="0" disabled>Chọn nguyên liệu</option>
          <option v-for="ing in ingredients" :key="ing.id" :value="ing.id" :disabled="isUsedElsewhere(ing.id, i)">{{ ing.name }}</option>
        </select>
        <div class="relative">
          <input v-model.number="line.quantity" type="number" min="0" step="any" class="admin-input pr-9" :disabled="!canEdit" :aria-label="`Định lượng ${i + 1}`">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{{ unitOf(line.ingredientId) }}</span>
        </div>
        <button v-if="canEdit" type="button" class="text-gray-400 hover:text-red-600 justify-self-end" aria-label="Xoá dòng" @click="lines.splice(i, 1)">
          <AppIcon name="trash" />
        </button>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button v-if="canEdit" type="button" class="admin-btn-secondary !py-1.5 !text-xs" @click="lines.push({ ingredientId: 0, quantity: '' })">
          <AppIcon name="plus" /> Thêm nguyên liệu
        </button>
        <div class="text-sm text-right">
          <span class="text-gray-500">Giá vốn {{ perLabel }}:</span>
          <strong class="tabular-nums ml-1">{{ formatVnd(Math.round(cost)) }}</strong>
          <template v-if="price != null && margin != null">
            <span class="text-gray-400 mx-1">·</span>
            <span :class="margin < 0.5 ? 'text-amber-700' : 'text-emerald-700'">lãi gộp {{ Math.round(margin * 100) }}%</span>
          </template>
        </div>
      </div>
      <p v-if="error" class="admin-error">{{ error }}</p>
      <button v-if="canEdit" type="button" class="admin-btn-primary !py-1.5 !text-xs" :disabled="isSaving" @click="save">
        {{ isSaving ? 'Đang lưu...' : 'Lưu định mức' }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { recipeInput } from '#shared/schemas/inventory'
import type { IngredientListItem, RecipeView } from '#shared/types/inventory'

const props = defineProps<{
  kind: 'product' | 'option'
  ownerId: number
  // Selling price (product) or extra price (topping), to show the margin
  price?: number | null
}>()
const emit = defineEmits<{ (e: 'saved', recipe: RecipeView): void }>()

const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()
const base = computed(() => `/api/admin/${props.kind === 'product' ? 'products' : 'options'}/${props.ownerId}/recipe`)

const [{ data: allIngredients }, { data: recipe }] = await Promise.all([
  useFetch<IngredientListItem[]>('/api/admin/ingredients', { key: 'admin:ingredients', default: () => [] }),
  useFetch<RecipeView>(base, { key: `admin:recipe:${props.kind}:${props.ownerId}` }),
])
const ingredients = computed(() =>
  allIngredients.value.filter((i) => i.isActive || lines.value.some((l) => l.ingredientId === i.id))
)

type Line = { ingredientId: number; quantity: number | '' }
const lines = ref<Line[]>([])
watch(
  recipe,
  (r) => {
    lines.value = r?.items.length ? r.items.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity })) : [{ ingredientId: 0, quantity: '' }]
  },
  { immediate: true }
)

const unitOf = (id: number) => allIngredients.value.find((i) => i.id === id)?.unit ?? ''
const isUsedElsewhere = (id: number, index: number) => lines.value.some((l, i) => i !== index && l.ingredientId === id)

const cost = computed(() =>
  lines.value.reduce((s, l) => s + (Number(l.quantity) || 0) * (allIngredients.value.find((i) => i.id === l.ingredientId)?.avgCost ?? 0), 0)
)
const margin = computed(() => (props.price != null ? marginRate(props.price, cost.value) : null))
const perLabel = computed(() => (props.kind === 'product' ? '1 phần' : 'mỗi lần chọn'))

const error = ref('')
const isSaving = ref(false)

async function save() {
  error.value = ''
  const items = lines.value.filter((l) => l.ingredientId || l.quantity !== '')
  const result = validateForm(recipeInput, { items })
  if (!result.data) {
    error.value = Object.values(result.errors)[0] ?? 'Vui lòng kiểm tra lại'
    return
  }
  isSaving.value = true
  try {
    recipe.value = await adminFetch<RecipeView>(base.value, { method: 'PUT', body: result.data })
    uiStore.showToast('Đã lưu định mức')
    emit('saved', recipe.value)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
