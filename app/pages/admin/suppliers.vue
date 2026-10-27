<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Nhà cung cấp</h1>
        <p class="text-gray-500 text-sm">Nơi quán mua nguyên liệu; chọn khi lập phiếu nhập hàng.</p>
      </div>
      <button v-if="canEdit" type="button" class="admin-btn-primary" @click="openForm()"><AppIcon name="plus" /> Nhà cung cấp</button>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Liên hệ</th>
            <th class="text-right">Số phiếu nhập</th>
            <th>Nhập gần nhất</th>
            <th v-if="canEdit" class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in suppliers" :key="s.id" :class="{ 'opacity-50': !s.isActive }">
            <td>
              <span class="font-semibold">{{ s.name }}</span>
              <span v-if="!s.isActive" class="text-xs text-gray-500 ml-1">(ngừng giao dịch)</span>
              <span v-if="s.note" class="block text-xs text-gray-500 max-w-xs truncate">{{ s.note }}</span>
            </td>
            <td class="text-sm">
              <a v-if="s.phone" :href="`tel:${s.phone}`" class="font-mono underline">{{ s.phone }}</a>
              <span v-if="s.address" class="block text-xs text-gray-500">{{ s.address }}</span>
            </td>
            <td class="text-right tabular-nums">{{ s.purchaseCount }}</td>
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ s.lastPurchaseAt ? formatDateTime(s.lastPurchaseAt) : '—' }}</td>
            <td v-if="canEdit" class="whitespace-nowrap text-right">
              <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="openForm(s)">Sửa</button>
              <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(s)">Xoá</button>
            </td>
          </tr>
          <tr v-if="!suppliers.length">
            <td colspan="5" class="text-center text-gray-500 py-10">Chưa có nhà cung cấp nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal :open="isFormOpen" :title="editingId ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'" @close="isFormOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div>
          <label class="admin-label" for="s-name">Tên</label>
          <input id="s-name" v-model="form.name" class="admin-input" placeholder="VD: Chợ đầu mối Long Biên - cô Hoa">
          <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="s-phone">Số điện thoại</label>
            <input id="s-phone" v-model="form.phone" type="tel" class="admin-input">
          </div>
          <div>
            <label class="admin-label" for="s-address">Địa chỉ</label>
            <input id="s-address" v-model="form.address" class="admin-input">
          </div>
        </div>
        <div>
          <label class="admin-label" for="s-note">Ghi chú</label>
          <textarea id="s-note" v-model="form.note" rows="2" class="admin-input" placeholder="VD: Giao trước 7h sáng, chuyển khoản cuối tuần" />
        </div>
        <AdminToggle v-model="form.isActive" label="Đang giao dịch" />
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
import { supplierInput } from '#shared/schemas/inventory'
import type { SupplierView } from '#shared/types/inventory'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nhà cung cấp' })

const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()
const { data: suppliers, refresh } = await useFetch<SupplierView[]>('/api/admin/suppliers', { default: () => [] })

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const blank = () => ({ name: '', phone: '', address: '', note: '', isActive: true })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openForm(s?: SupplierView) {
  Object.assign(form, blank(), s ? { name: s.name, phone: s.phone, address: s.address, note: s.note, isActive: s.isActive } : {})
  editingId.value = s?.id ?? null
  errors.value = {}
  formError.value = ''
  isFormOpen.value = true
}

async function save() {
  formError.value = ''
  const result = validateForm(supplierInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/suppliers/${editingId.value}` : '/api/admin/suppliers', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    isFormOpen.value = false
    uiStore.showToast('Đã lưu nhà cung cấp')
    await refresh()
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove(s: SupplierView) {
  if (!confirm(`Xoá nhà cung cấp "${s.name}"?`)) return
  try {
    await adminFetch(`/api/admin/suppliers/${s.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá')
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
