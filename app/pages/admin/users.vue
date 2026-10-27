<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Tài khoản</h1>
        <p class="text-gray-500 text-sm">
          Người được đăng nhập trang quản trị. Khoá tài khoản có hiệu lực ngay, kể cả khi người đó đang đăng nhập.
        </p>
      </div>
      <button type="button" class="admin-btn-primary" @click="openForm()"><AppIcon name="plus" /> Tài khoản</button>
    </div>

    <div class="admin-card overflow-x-auto mb-6">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Tạo lúc</th>
            <th class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" :class="{ 'opacity-50': !u.isActive }">
            <td>
              <span class="font-semibold">{{ u.name }}</span>
              <span v-if="u.id === user?.id" class="text-xs text-gray-500 ml-1">(bạn)</span>
              <span v-if="!u.isActive" class="text-xs text-gray-500 ml-1">(đã khoá)</span>
            </td>
            <td class="text-sm">{{ u.email }}</td>
            <td class="text-sm">{{ ROLE_LABELS[u.role] }}</td>
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(u.createdAt) }}</td>
            <td class="whitespace-nowrap text-right">
              <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="openForm(u)">Sửa</button>
              <button type="button" class="text-sm font-semibold hover:underline" @click="openPassword(u)">Đặt mật khẩu</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="admin-card p-5 text-sm text-gray-600 space-y-1">
      <p><strong>Chủ quán:</strong> toàn quyền, gồm quản lý tài khoản và xem nhật ký thao tác.</p>
      <p><strong>Quản lý:</strong> sửa thực đơn, mã giảm giá, kho, chi phí; xem báo cáo.</p>
      <p><strong>Nhân viên:</strong> xử lý đơn hàng, xem khách hàng và kho; không sửa thực đơn hay xem báo cáo.</p>
    </div>

    <AdminModal :open="isFormOpen" :title="editingId ? 'Sửa tài khoản' : 'Thêm tài khoản'" @close="isFormOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div>
          <label class="admin-label" for="u-name">Tên</label>
          <input id="u-name" v-model="form.name" class="admin-input" autocomplete="off">
          <p v-if="errors.name" class="admin-error">{{ errors.name }}</p>
        </div>
        <div v-if="!editingId">
          <label class="admin-label" for="u-email">Email đăng nhập</label>
          <input id="u-email" v-model="form.email" type="email" class="admin-input" autocomplete="off">
          <p v-if="errors.email" class="admin-error">{{ errors.email }}</p>
        </div>
        <div>
          <label class="admin-label" for="u-role">Vai trò</label>
          <select id="u-role" v-model="form.role" class="admin-input" :disabled="editingId === user?.id">
            <option v-for="r in STAFF_ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
          </select>
        </div>
        <div v-if="!editingId">
          <label class="admin-label" for="u-password">Mật khẩu ban đầu</label>
          <input id="u-password" v-model="form.password" type="password" class="admin-input" autocomplete="new-password">
          <p v-if="errors.password" class="admin-error">{{ errors.password }}</p>
          <p v-else class="text-xs text-gray-500 mt-1">Tối thiểu 10 ký tự. Gửi riêng cho người dùng.</p>
        </div>
        <AdminToggle v-if="editingId !== user?.id" v-model="form.isActive" label="Được phép đăng nhập" />
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="admin-btn-secondary" @click="isFormOpen = false">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </AdminModal>

    <AdminModal :open="!!passwordFor" :title="`Đặt mật khẩu mới · ${passwordFor?.name ?? ''}`" @close="passwordFor = null">
      <form class="space-y-4" novalidate @submit.prevent="savePassword">
        <div>
          <label class="admin-label" for="u-new-password">Mật khẩu mới</label>
          <input id="u-new-password" v-model="newPassword" type="password" class="admin-input" autocomplete="new-password">
          <p v-if="passwordError" class="admin-error">{{ passwordError }}</p>
          <p v-else class="text-xs text-gray-500 mt-1">
            Phiên đang đăng nhập của tài khoản này không bị đăng xuất. Nếu nghi bị lộ mật khẩu, hãy khoá tài khoản trước.
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="admin-btn-secondary" @click="passwordFor = null">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">Lưu</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { STAFF_ROLES, passwordResetInput, userCreateInput, userUpdateInput } from '#shared/schemas/users'

interface UserView {
  id: number
  email: string
  name: string
  role: (typeof STAFF_ROLES)[number]
  isActive: boolean
  createdAt: string
}

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Tài khoản' })

const adminFetch = useAdminApi()
const uiStore = useUiStore()
const { user } = useUserSession()
const { data: users, refresh } = await useFetch<UserView[]>('/api/admin/users', { default: () => [] })

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const blank = () => ({ name: '', email: '', role: 'staff' as UserView['role'], password: '', isActive: true })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openForm(u?: UserView) {
  Object.assign(form, blank(), u ? { name: u.name, email: u.email, role: u.role, isActive: u.isActive } : {})
  editingId.value = u?.id ?? null
  errors.value = {}
  formError.value = ''
  isFormOpen.value = true
}

async function save() {
  formError.value = ''
  const result = editingId.value ? validateForm(userUpdateInput, form) : validateForm(userCreateInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/users/${editingId.value}` : '/api/admin/users', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    isFormOpen.value = false
    uiStore.showToast('Đã lưu tài khoản')
    await refresh()
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

const passwordFor = ref<UserView | null>(null)
const newPassword = ref('')
const passwordError = ref('')

function openPassword(u: UserView) {
  passwordFor.value = u
  newPassword.value = ''
  passwordError.value = ''
}

async function savePassword() {
  const result = validateForm(passwordResetInput, { password: newPassword.value })
  passwordError.value = result.errors?.password ?? ''
  if (!result.data || !passwordFor.value) return
  isSaving.value = true
  try {
    await adminFetch(`/api/admin/users/${passwordFor.value.id}/password`, { method: 'POST', body: result.data })
    passwordFor.value = null
    uiStore.showToast('Đã đặt mật khẩu mới')
  } catch (e) {
    passwordError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
