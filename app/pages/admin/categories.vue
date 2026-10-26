<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Danh mục</h1>
        <p class="text-gray-500 text-sm">Nhóm món hiển thị trên thanh lọc của website.</p>
      </div>
      <button v-if="canEdit" type="button" class="admin-btn-primary" @click="openForm()">+ Thêm danh mục</button>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="w-16">Thứ tự</th>
            <th>Danh mục</th>
            <th>Slug</th>
            <th class="text-right">Số món</th>
            <th>Hiển thị</th>
            <th v-if="canEdit" class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td class="tabular-nums text-gray-500">{{ cat.sortOrder }}</td>
            <td class="font-semibold whitespace-nowrap"><span class="mr-2">{{ cat.icon }}</span>{{ cat.name }}</td>
            <td class="text-gray-500 font-mono text-xs">{{ cat.slug }}</td>
            <td class="text-right tabular-nums">{{ cat.productCount }}</td>
            <td>
              <span class="text-xs font-semibold px-2 py-1 rounded-full" :class="cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                {{ cat.isActive ? 'Đang hiện' : 'Đã ẩn' }}
              </span>
            </td>
            <td v-if="canEdit" class="whitespace-nowrap text-right">
              <button type="button" class="text-sm font-semibold text-brand-dark-green hover:underline mr-4" @click="openForm(cat)">Sửa</button>
              <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(cat)">Xoá</button>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="6" class="text-center text-gray-500 py-10">Chưa có danh mục nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal :open="isFormOpen" :title="editingId ? 'Sửa danh mục' : 'Thêm danh mục'" @close="isFormOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div class="grid grid-cols-[5rem_1fr] gap-3">
          <div>
            <label class="admin-label" for="cat-icon">Icon</label>
            <input id="cat-icon" v-model="form.icon" class="admin-input text-center text-lg" maxlength="16">
          </div>
          <div>
            <label class="admin-label" for="cat-name">Tên danh mục</label>
            <input id="cat-name" v-model="form.name" class="admin-input" @input="syncSlug">
            <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
          </div>
        </div>
        <div>
          <label class="admin-label" for="cat-slug">Slug (đường dẫn)</label>
          <input id="cat-slug" v-model="form.slug" class="admin-input font-mono text-xs" @input="slugTouched = true">
          <p v-if="errors.slug" class="admin-error">{{ errors.slug }}</p>
        </div>
        <div>
          <span class="admin-label">Ảnh nền (tuỳ chọn)</span>
          <AdminImageInput v-model="form.image" removable @remove="form.image = ''" />
        </div>
        <div class="grid grid-cols-2 gap-3 items-end">
          <div>
            <label class="admin-label" for="cat-order">Thứ tự</label>
            <input id="cat-order" v-model.number="form.sortOrder" type="number" class="admin-input">
          </div>
          <AdminToggle v-model="form.isActive" label="Hiện trên website" class="pb-2.5" />
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="admin-btn-secondary" @click="isFormOpen = false">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { categoryInput } from '#shared/schemas/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Danh mục' })

interface AdminCategory {
  id: number
  name: string
  slug: string
  icon: string
  image: string | null
  sortOrder: number
  isActive: boolean
  productCount: number
}

const adminFetch = useAdminApi()
const canEdit = useCanEditCatalog()
const uiStore = useUiStore()
const { data: categories, refresh } = await useFetch<AdminCategory[]>('/api/admin/categories')

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const slugTouched = ref(false)
const isSaving = ref(false)
const errors = ref<FieldErrors>({})
const formError = ref('')
const blank = () => ({ name: '', slug: '', icon: '🥣', image: '', sortOrder: (categories.value?.length ?? 0) + 1, isActive: true })
const form = reactive(blank())

function openForm(cat?: AdminCategory) {
  Object.assign(form, blank(), cat ? { ...cat, image: cat.image ?? '' } : {})
  editingId.value = cat?.id ?? null
  slugTouched.value = !!cat
  errors.value = {}
  formError.value = ''
  isFormOpen.value = true
}

function syncSlug() {
  if (!slugTouched.value) form.slug = slugify(form.name)
}

async function save() {
  formError.value = ''
  const result = validateForm(categoryInput, { ...form, image: form.image || null })
  errors.value = result.errors ?? {}
  if (!result.data) return

  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/categories/${editingId.value}` : '/api/admin/categories', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    isFormOpen.value = false
    uiStore.showToast(editingId.value ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục')
    await refresh()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove(cat: AdminCategory) {
  if (!confirm(`Xoá danh mục "${cat.name}"?`)) return
  try {
    await adminFetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá danh mục')
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
