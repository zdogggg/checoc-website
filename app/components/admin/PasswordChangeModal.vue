<template>
  <AdminModal :open="open" title="Đổi mật khẩu" @close="close">
    <form class="space-y-4" novalidate @submit.prevent="save">
      <div>
        <label class="admin-label" for="pw-current">Mật khẩu hiện tại</label>
        <input id="pw-current" v-model="form.currentPassword" type="password" autocomplete="current-password" class="admin-input">
        <p v-if="errors.currentPassword" class="admin-error">{{ errors.currentPassword }}</p>
      </div>
      <div>
        <label class="admin-label" for="pw-new">Mật khẩu mới</label>
        <input id="pw-new" v-model="form.password" type="password" autocomplete="new-password" class="admin-input">
        <p v-if="errors.password" class="admin-error">{{ errors.password }}</p>
        <p v-else class="text-xs text-gray-500 mt-1">Tối thiểu 10 ký tự.</p>
      </div>
      <div>
        <label class="admin-label" for="pw-confirm">Nhập lại mật khẩu mới</label>
        <input id="pw-confirm" v-model="form.confirm" type="password" autocomplete="new-password" class="admin-input">
        <p v-if="errors.confirm" class="admin-error">{{ errors.confirm }}</p>
      </div>
      <p class="text-xs text-gray-500">Máy này vẫn đăng nhập. Các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.</p>
      <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-btn-secondary" @click="close">Huỷ</button>
        <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Đổi mật khẩu' }}</button>
      </div>
    </form>
  </AdminModal>
</template>

<script setup lang="ts">
import { passwordChangeInput } from '#shared/schemas/users'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const adminFetch = useAdminApi()
const uiStore = useUiStore()
const blank = () => ({ currentPassword: '', password: '', confirm: '' })
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function close() {
  Object.assign(form, blank())
  errors.value = {}
  formError.value = ''
  emit('close')
}

async function save() {
  formError.value = ''
  const result = validateForm(passwordChangeInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await adminFetch('/api/admin/me/password', { method: 'POST', body: result.data })
    uiStore.showToast('Đã đổi mật khẩu')
    close()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    if (!Object.keys(errors.value).length) formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
