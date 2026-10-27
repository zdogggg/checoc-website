<template>
  <form class="space-y-4" novalidate @submit.prevent="step === 'target' ? requestCode() : verify()">
    <template v-if="step === 'target'">
      <!-- Email first; SMS appears once a provider is configured -->
      <div v-if="channels.email && channels.sms" class="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-full text-sm font-semibold" role="tablist">
        <button
          v-for="m in METHODS"
          :key="m.value"
          type="button"
          role="tab"
          :aria-selected="method === m.value"
          class="py-2 rounded-full transition-colors"
          :class="method === m.value ? 'bg-white shadow-sm text-brand-dark-green' : 'text-gray-500'"
          @click="switchMethod(m.value)"
        >
          {{ m.label }}
        </button>
      </div>

      <div v-if="method === 'email'">
        <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5" for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="VD: ban@gmail.com"
          class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
        >
        <p class="text-xs text-gray-500 mt-2">
          Dùng email bạn đã nhập khi đặt hàng. Email được gắn vào tài khoản sau khi đơn đầu tiên có email đó giao xong.
        </p>
      </div>

      <div v-else>
        <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5" for="login-phone">Số điện thoại</label>
        <input
          id="login-phone"
          v-model="phone"
          type="tel"
          autocomplete="tel"
          placeholder="VD: 0988123456"
          class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
        >
        <p class="text-xs text-gray-500 mt-2">Dùng đúng số bạn đặt hàng. Chúng tôi sẽ gửi mã 6 số qua SMS.</p>
      </div>
    </template>

    <template v-else>
      <p class="text-sm text-gray-600">
        <template v-if="method === 'email'">
          Nếu <strong class="text-brand-dark-green">{{ email }}</strong> đã gắn với tài khoản, mã 6 số đã được gửi tới hộp thư
          (xem cả mục Spam / Quảng cáo).
        </template>
        <template v-else>
          Nhập mã 6 số đã gửi tới <strong class="text-brand-dark-green">{{ phone }}</strong>
        </template>
        <button type="button" class="text-xs underline ml-1" @click="reset">{{ method === 'email' ? 'Đổi email' : 'Đổi số' }}</button>
      </p>
      <input
        v-model="code"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        placeholder="______"
        aria-label="Mã xác nhận"
        class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] text-center font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
      >
      <p v-if="devCode" class="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
        Chế độ phát triển (chưa cấu hình {{ method === 'email' ? 'email' : 'SMS' }}): mã là <strong class="font-mono">{{ devCode }}</strong>
      </p>
      <button type="button" class="text-xs text-gray-500 underline disabled:no-underline disabled:opacity-60" :disabled="resendIn > 0" @click="requestCode">
        {{ resendIn > 0 ? `Gửi lại mã sau ${resendIn}s` : 'Gửi lại mã' }}
      </button>
    </template>

    <p v-if="message" class="text-sm text-red-600">{{ message }}</p>
    <button type="submit" class="w-full bg-brand-dark-green text-brand-cream font-bold py-3 rounded-full hover:bg-[#1a4132] transition-colors disabled:opacity-60" :disabled="isLoading">
      {{ isLoading ? 'Đang xử lý...' : step === 'target' ? 'Nhận mã đăng nhập' : 'Đăng nhập' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { LoginChannels } from '#shared/types/customers'

type Method = 'email' | 'sms'

const props = defineProps<{ channels: LoginChannels }>()
const emit = defineEmits<{ (e: 'signed-in'): void }>()

const METHODS: { value: Method; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Số điện thoại' },
]

const step = ref<'target' | 'code'>('target')
const method = ref<Method>(props.channels.email ? 'email' : 'sms')
const email = ref('')
const phone = ref('')
const code = ref('')
const devCode = ref('')
const message = ref('')
const isLoading = ref(false)
const resendIn = ref(0)

const target = () => (method.value === 'email' ? { email: email.value } : { phone: phone.value })

const { pause, resume } = useIntervalFn(
  () => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (!resendIn.value) pause()
  },
  1000,
  { immediate: false }
)

function switchMethod(m: Method) {
  method.value = m
  message.value = ''
}

function reset() {
  step.value = 'target'
  code.value = ''
  devCode.value = ''
  message.value = ''
}

async function requestCode() {
  message.value = ''
  isLoading.value = true
  try {
    const res = await $fetch<{ ok: true; devCode?: string }>('/api/account/otp', { method: 'POST', body: target() })
    devCode.value = res.devCode ?? ''
    step.value = 'code'
    resendIn.value = 60
    resume()
  } catch (e) {
    message.value = apiErrorMessage(e, 'Không gửi được mã, vui lòng thử lại')
  } finally {
    isLoading.value = false
  }
}

async function verify() {
  message.value = ''
  isLoading.value = true
  try {
    await $fetch('/api/account/verify', { method: 'POST', body: { ...target(), code: code.value } })
    emit('signed-in')
  } catch (e) {
    message.value = apiErrorMessage(e, 'Mã không đúng')
  } finally {
    isLoading.value = false
  }
}
</script>
