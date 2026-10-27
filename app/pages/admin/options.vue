<template>
  <div>
    <h1 class="font-heading text-3xl font-bold">Đường · Đá · Topping</h1>
    <p class="text-gray-500 text-sm mb-6">Tuỳ chọn khách chọn khi đặt món. Áp dụng cho mọi món.</p>

    <div class="space-y-6">
      <section v-for="group in groups" :key="group.id" class="admin-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-bold">{{ group.name }}</h2>
            <p class="text-xs text-gray-500">{{ group.multiple ? 'Khách chọn được nhiều' : 'Khách chọn một · có một lựa chọn mặc định' }}</p>
          </div>
          <button v-if="canEdit" type="button" class="admin-btn-secondary !py-1.5 !text-xs" @click="openForm(group)">+ Thêm</button>
        </div>
        <div class="overflow-x-auto">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="w-16">Thứ tự</th>
                <th>Tên hiển thị</th>
                <th>Tên ngắn (trong giỏ)</th>
                <th v-if="group.code === 'topping'" class="text-right">Giá thêm</th>
                <th v-else>Mặc định</th>
                <th>Đang dùng</th>
                <th v-if="canEdit" class="w-px" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="opt in group.options" :key="opt.id" :class="{ 'opacity-50': !opt.isActive }">
                <td class="tabular-nums text-gray-500">{{ opt.sortOrder }}</td>
                <td class="font-medium">{{ opt.label }}</td>
                <td class="text-gray-500">{{ opt.shortLabel }}</td>
                <td v-if="group.code === 'topping'" class="text-right tabular-nums">+{{ formatVnd(opt.price) }}</td>
                <td v-else>
                  <span v-if="opt.isDefault" class="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Mặc định</span>
                </td>
                <td>{{ opt.isActive ? 'Có' : 'Ẩn' }}</td>
                <td v-if="canEdit" class="whitespace-nowrap text-right">
                  <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="recipeFor = { opt, group }">Định mức</button>
                  <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="openForm(group, opt)">Sửa</button>
                  <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(opt)">Xoá</button>
                </td>
              </tr>
              <tr v-if="!group.options.length">
                <td colspan="6" class="text-center text-gray-500 py-6">Chưa có lựa chọn nào.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <AdminModal :open="!!formGroup" :title="editingId ? 'Sửa lựa chọn' : `Thêm vào “${formGroup?.name}”`" @close="formGroup = null">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div>
          <label class="admin-label" for="o-label">Tên hiển thị</label>
          <input id="o-label" v-model="form.label" class="admin-input" :placeholder="isTopping ? 'Trân châu trắng giòn' : '70% Ít ngọt vừa phải'">
          <p v-if="errors.label" class="admin-error">{{ errors.label }}</p>
        </div>
        <div>
          <label class="admin-label" for="o-short">Tên ngắn (hiện trong giỏ hàng)</label>
          <input id="o-short" v-model="form.shortLabel" class="admin-input" :placeholder="isTopping ? 'Trân châu trắng' : '70% đường'">
          <p v-if="errors.shortLabel" class="admin-error">{{ errors.shortLabel }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div v-if="isTopping">
            <label class="admin-label" for="o-price">Giá thêm (đ)</label>
            <input id="o-price" v-model.number="form.price" type="number" min="0" step="1000" class="admin-input">
            <p v-if="errors.price" class="admin-error">{{ errors.price }}</p>
          </div>
          <div>
            <label class="admin-label" for="o-order">Thứ tự</label>
            <input id="o-order" v-model.number="form.sortOrder" type="number" class="admin-input">
          </div>
        </div>
        <div class="flex flex-wrap gap-6">
          <AdminToggle v-model="form.isActive" label="Đang dùng" />
          <AdminToggle v-if="!isTopping" v-model="form.isDefault" label="Lựa chọn mặc định" />
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="admin-btn-secondary" @click="formGroup = null">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </AdminModal>

    <AdminModal :open="!!recipeFor" :title="`Định mức: ${recipeFor?.opt.label ?? ''}`" @close="recipeFor = null">
      <p class="text-xs text-gray-500 mb-4">
        Nguyên liệu dùng thêm mỗi khi khách chọn tuỳ chọn này (VD: topping trân châu 20g, "Đá riêng" 150g đá).
        Bỏ trống nếu không cần theo dõi kho.
      </p>
      <RecipeEditor
        v-if="recipeFor"
        :key="recipeFor.opt.id"
        kind="option"
        :owner-id="recipeFor.opt.id"
        :price="recipeFor.group.code === 'topping' ? recipeFor.opt.price : null"
        @saved="recipeFor = null"
      />
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { optionInput } from '#shared/schemas/catalog'
import RecipeEditor from '~/components/admin/RecipeEditor.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Tuỳ chọn món' })

interface AdminOption {
  id: number
  groupId: number
  label: string
  shortLabel: string
  price: number
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}
interface AdminGroup {
  id: number
  code: 'sugar' | 'ice' | 'topping'
  name: string
  multiple: boolean
  options: AdminOption[]
}

const adminFetch = useAdminApi()
const canEdit = useCanEditCatalog()
const uiStore = useUiStore()
const { data: groups, refresh } = await useFetch<AdminGroup[]>('/api/admin/options', { default: () => [] })

const formGroup = ref<AdminGroup | null>(null)
const recipeFor = ref<{ opt: AdminOption; group: AdminGroup } | null>(null)
const editingId = ref<number | null>(null)
const isTopping = computed(() => formGroup.value?.code === 'topping')
const blank = () => ({ label: '', shortLabel: '', price: 0, isDefault: false, isActive: true, sortOrder: 0 })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openForm(group: AdminGroup, opt?: AdminOption) {
  Object.assign(form, blank(), { sortOrder: group.options.length }, opt ?? {})
  editingId.value = opt?.id ?? null
  errors.value = {}
  formError.value = ''
  formGroup.value = group
}

async function save() {
  if (!formGroup.value) return
  formError.value = ''
  const result = validateForm(optionInput, {
    ...form,
    groupId: formGroup.value.id,
    // Toppings have a price but no default; sugar/ice the other way round
    price: isTopping.value ? form.price : 0,
    isDefault: isTopping.value ? false : form.isDefault,
  })
  errors.value = result.errors ?? {}
  if (!result.data) return

  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/options/${editingId.value}` : '/api/admin/options', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    formGroup.value = null
    uiStore.showToast('Đã lưu lựa chọn')
    await refresh()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove(opt: AdminOption) {
  if (!confirm(`Xoá "${opt.label}"?`)) return
  try {
    await adminFetch(`/api/admin/options/${opt.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá lựa chọn')
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
