<template>
  <div>
    <NuxtLink to="/admin/products" class="text-sm text-gray-500 hover:text-brand-dark-green">← Danh sách món</NuxtLink>
    <div class="flex flex-wrap items-end justify-between gap-4 mt-2 mb-6">
      <h1 class="font-heading text-3xl font-bold">{{ isNew ? 'Thêm món mới' : form.name || 'Sửa món' }}</h1>
      <NuxtLink v-if="!isNew && savedSlug" :to="`/products/${savedSlug}`" target="_blank" class="text-sm font-semibold hover:underline">
        Xem trên website ↗
      </NuxtLink>
    </div>

    <form class="grid lg:grid-cols-3 gap-6 items-start" novalidate @submit.prevent="save">
      <div class="lg:col-span-2 space-y-6">
        <section class="admin-card p-6 space-y-4">
          <h2 class="font-bold">Thông tin món</h2>
          <div>
            <label class="admin-label" for="p-name">Tên món</label>
            <input id="p-name" v-model="form.name" class="admin-input" :disabled="!canEdit" @input="syncSlug">
            <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="admin-label" for="p-slug">Slug (đường dẫn)</label>
              <input id="p-slug" v-model="form.slug" class="admin-input font-mono text-xs" :disabled="!canEdit" @input="slugTouched = true">
              <p v-if="errors.slug" class="admin-error">{{ errors.slug }}</p>
            </div>
            <div>
              <label class="admin-label" for="p-cat">Danh mục</label>
              <select id="p-cat" v-model.number="form.categoryId" class="admin-input" :disabled="!canEdit">
                <option :value="0" disabled>Chọn danh mục</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <p v-if="errors.categoryId" class="admin-error">{{ errors.categoryId }}</p>
            </div>
          </div>
          <div>
            <label class="admin-label" for="p-short">Mô tả ngắn (hiện trên thẻ món)</label>
            <input id="p-short" v-model="form.shortDescription" class="admin-input" maxlength="300" :disabled="!canEdit">
          </div>
          <div>
            <label class="admin-label" for="p-desc">Mô tả chi tiết</label>
            <textarea id="p-desc" v-model="form.description" rows="5" class="admin-input" :disabled="!canEdit" />
          </div>
        </section>

        <section class="admin-card p-6 space-y-4">
          <h2 class="font-bold">Ảnh</h2>
          <div>
            <span class="admin-label">Ảnh chính</span>
            <AdminImageInput v-model="form.image" />
          </div>
          <div>
            <span class="admin-label">Bộ sưu tập (trang chi tiết)</span>
            <div class="space-y-3">
              <div v-for="(_, i) in form.galleryImages" :key="i" class="flex gap-2 items-start">
                <AdminImageInput v-model="form.galleryImages[i]!" class="flex-1" removable @remove="form.galleryImages.splice(i, 1)" />
                <div class="flex flex-col">
                  <button type="button" class="px-2 text-gray-400 hover:text-brand-dark-green disabled:opacity-30" :disabled="i === 0" aria-label="Lên" @click="moveImage(i, -1)">▲</button>
                  <button type="button" class="px-2 text-gray-400 hover:text-brand-dark-green disabled:opacity-30" :disabled="i === form.galleryImages.length - 1" aria-label="Xuống" @click="moveImage(i, 1)">▼</button>
                </div>
              </div>
            </div>
            <button type="button" class="admin-btn-secondary !py-1.5 !text-xs mt-3" @click="form.galleryImages.push('')">+ Thêm ảnh</button>
          </div>
        </section>

        <section class="admin-card p-6 space-y-4">
          <h2 class="font-bold">Chi tiết hiển thị</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="admin-label" for="p-toppings">Topping có sẵn (mỗi dòng một món)</label>
              <textarea id="p-toppings" v-model="toppingsText" rows="4" class="admin-input" :disabled="!canEdit" />
            </div>
            <div>
              <label class="admin-label" for="p-ingredients">Nguyên liệu (mỗi dòng một loại)</label>
              <textarea id="p-ingredients" v-model="ingredientsText" rows="4" class="admin-input" :disabled="!canEdit" />
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="field in nutritionFields" :key="field.key">
              <label class="admin-label" :for="`p-n-${field.key}`">{{ field.label }}</label>
              <input :id="`p-n-${field.key}`" v-model="form.nutrition[field.key]" class="admin-input" :placeholder="field.placeholder" :disabled="!canEdit">
            </div>
          </div>
          <div class="sm:max-w-xs">
            <label class="admin-label" for="p-prep">Thời gian chuẩn bị</label>
            <input id="p-prep" v-model="form.prepTime" class="admin-input" placeholder="5-7 phút" :disabled="!canEdit">
          </div>
        </section>
      </div>

      <div class="space-y-6 lg:sticky lg:top-6">
        <section class="admin-card p-6 space-y-4">
          <h2 class="font-bold">Giá & trạng thái</h2>
          <div>
            <label class="admin-label" for="p-price">Giá bán (đ)</label>
            <input id="p-price" v-model.number="form.price" type="number" min="0" step="1000" class="admin-input tabular-nums" :disabled="!canEdit">
            <p v-if="errors.price" class="admin-error">{{ errors.price }}</p>
          </div>
          <div>
            <label class="admin-label" for="p-original">Giá gốc (gạch ngang, tuỳ chọn)</label>
            <input id="p-original" v-model.number="form.originalPrice" type="number" min="0" step="1000" class="admin-input tabular-nums" :disabled="!canEdit">
            <p v-if="errors.originalPrice" class="admin-error">{{ errors.originalPrice }}</p>
          </div>
          <div>
            <label class="admin-label" for="p-badge">Nhãn</label>
            <select id="p-badge" v-model="form.badge" class="admin-input" :disabled="!canEdit">
              <option :value="null">Không có</option>
              <option v-for="(label, value) in BADGE_LABELS" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="admin-label" for="p-order">Thứ tự hiển thị</label>
            <input id="p-order" v-model.number="form.sortOrder" type="number" class="admin-input" :disabled="!canEdit">
          </div>
          <div class="space-y-3 pt-1">
            <AdminToggle v-model="form.isAvailable" label="Còn hàng" :disabled="!canEdit" />
            <AdminToggle v-model="form.isFeatured" label="Món nổi bật" :disabled="!canEdit" />
          </div>
        </section>

        <div v-if="canEdit" class="space-y-3">
          <p v-if="formError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{{ formError }}</p>
          <button type="submit" class="admin-btn-primary w-full" :disabled="isSaving">
            {{ isSaving ? 'Đang lưu...' : isNew ? 'Thêm món' : 'Lưu thay đổi' }}
          </button>
          <button v-if="!isNew" type="button" class="admin-btn-danger w-full" @click="remove">Xoá món</button>
        </div>
        <p v-else class="text-sm text-gray-500">Tài khoản của bạn chỉ có quyền xem.</p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { productInput } from '#shared/schemas/catalog'
import type { Product, ProductBadge } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const adminFetch = useAdminApi()
const canEdit = useCanEditCatalog()
const uiStore = useUiStore()

const isNew = computed(() => route.params.id === 'new')

const { data: categories } = await useFetch<{ id: number; name: string; icon: string }[]>('/api/admin/categories', {
  default: () => [],
})

type NutritionKey = 'calories' | 'sugar' | 'fat' | 'serving'
const nutritionFields: { key: NutritionKey; label: string; placeholder: string }[] = [
  { key: 'calories', label: 'Năng lượng', placeholder: '285 kcal' },
  { key: 'sugar', label: 'Đường', placeholder: '18g' },
  { key: 'fat', label: 'Chất béo', placeholder: '5g' },
  { key: 'serving', label: 'Khẩu phần', placeholder: '1 cốc 450ml' },
]

const blank = () => ({
  categoryId: 0,
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: 0,
  originalPrice: null as number | null | '',
  image: '',
  galleryImages: [] as string[],
  badge: null as ProductBadge | null,
  nutrition: { calories: '', sugar: '', fat: '', serving: '' },
  prepTime: '',
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
})
const form = reactive(blank())
const toppingsText = ref('')
const ingredientsText = ref('')
const slugTouched = ref(false)
const savedSlug = ref('')

function fill(p: Product & { sortOrder?: number }) {
  Object.assign(form, {
    ...toProductInput(p),
    galleryImages: [...p.galleryImages],
    nutrition: { calories: '', sugar: '', fat: '', serving: '', ...p.nutrition },
  })
  toppingsText.value = p.toppings.join('\n')
  ingredientsText.value = p.ingredients.join('\n')
  slugTouched.value = true
  savedSlug.value = p.slug
}

if (!isNew.value) {
  const { data, error } = await useFetch<Product & { sortOrder: number }>(`/api/admin/products/${route.params.id}`)
  if (error.value || !data.value) {
    throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
  }
  fill(data.value)
}
useHead({ title: () => (isNew.value ? 'Thêm món' : form.name) })

function syncSlug() {
  if (!slugTouched.value) form.slug = slugify(form.name)
}

function moveImage(index: number, delta: number) {
  const list = form.galleryImages
  const [item] = list.splice(index, 1)
  list.splice(index + delta, 0, item!)
}

const lines = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean)

const isSaving = ref(false)
const errors = ref<FieldErrors>({})
const formError = ref('')

async function save() {
  formError.value = ''
  const hasNutrition = Object.values(form.nutrition).some(Boolean)
  const result = validateForm(productInput, {
    ...form,
    originalPrice: form.originalPrice === '' || form.originalPrice === 0 ? null : form.originalPrice,
    galleryImages: form.galleryImages.map((s) => s.trim()).filter(Boolean),
    toppings: lines(toppingsText.value),
    ingredients: lines(ingredientsText.value),
    nutrition: hasNutrition ? form.nutrition : null,
  })
  errors.value = result.errors ?? {}
  if (!result.data) {
    formError.value = 'Vui lòng kiểm tra lại các ô được đánh dấu'
    return
  }

  isSaving.value = true
  try {
    const saved = await adminFetch<Product & { sortOrder: number }>(
      isNew.value ? '/api/admin/products' : `/api/admin/products/${route.params.id}`,
      { method: isNew.value ? 'POST' : 'PUT', body: result.data }
    )
    uiStore.showToast(isNew.value ? 'Đã thêm món mới' : 'Đã lưu thay đổi')
    if (isNew.value) {
      await navigateTo(`/admin/products/${saved.id}`, { replace: true })
    } else {
      fill(saved)
    }
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove() {
  if (!confirm(`Xoá món "${form.name}" khỏi thực đơn?`)) return
  try {
    await adminFetch(`/api/admin/products/${route.params.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá món')
    await navigateTo('/admin/products')
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
