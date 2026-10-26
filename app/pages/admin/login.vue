<template>
  <div class="min-h-screen bg-brand-dark-green flex items-center justify-center px-4 font-sans">
    <form class="w-full max-w-sm bg-brand-white rounded-3xl shadow-2xl p-8" novalidate @submit.prevent="submit">
      <h1 class="font-heading text-2xl font-bold text-brand-dark-green">Chè Cốc</h1>
      <p class="text-sm text-gray-500 mb-6">Đăng nhập trang quản trị</p>

      <label class="block text-sm font-semibold text-brand-dark-green mb-1" for="email">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="username"
        class="admin-input mb-4"
        :class="{ 'border-red-400': errors.email }"
      >
      <p v-if="errors.email" class="text-xs text-red-600 -mt-3 mb-3">{{ errors.email }}</p>

      <label class="block text-sm font-semibold text-brand-dark-green mb-1" for="password">Mật khẩu</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        class="admin-input mb-4"
        :class="{ 'border-red-400': errors.password }"
      >
      <p v-if="errors.password" class="text-xs text-red-600 -mt-3 mb-3">{{ errors.password }}</p>

      <p v-if="formError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
        {{ formError }}
      </p>

      <button
        type="submit"
        class="w-full bg-brand-dark-green text-brand-cream font-bold py-3 rounded-full hover:bg-[#1a4132] transition-colors disabled:opacity-60"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { loginInput } from '#shared/schemas/catalog'

definePageMeta({ layout: false })
useHead({ title: 'Đăng nhập quản trị — Chè Cốc' })

const route = useRoute()
const { loggedIn, fetch: refreshSession } = useUserSession()

const form = reactive({ email: '', password: '' })
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSubmitting = ref(false)

// Only follow redirects inside the admin area
const redirectTo = computed(() => {
  const target = String(route.query.redirect ?? '')
  return target.startsWith('/admin') && !target.startsWith('/admin/login') ? target : '/admin'
})

if (loggedIn.value) {
  await navigateTo(redirectTo.value)
}

async function submit() {
  formError.value = ''
  const result = validateForm(loginInput, form)
  errors.value = result.errors ?? {}
  if (!result.data) return

  isSubmitting.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: result.data })
    await refreshSession()
    await navigateTo(redirectTo.value)
  } catch (error) {
    formError.value = apiErrorMessage(error, 'Không đăng nhập được, vui lòng thử lại')
  } finally {
    isSubmitting.value = false
  }
}
</script>
