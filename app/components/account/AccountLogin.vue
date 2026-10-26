<template>
  <form class="space-y-4" novalidate @submit.prevent="step === 'phone' ? requestCode() : verify()">
    <template v-if="step === 'phone'">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5" for="login-phone">Số điện thoại</label>
        <input
          id="login-phone"
          v-model="phone"
          type="tel"
          autocomplete="tel"
          placeholder="VD: 0988123456"
          class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
        >
      </div>
      <p class="text-xs text-gray-500">Dùng đúng số bạn đặt hàng để xem lại đơn và điểm đã tích. Chúng tôi sẽ gửi mã 6 số qua SMS.</p>
    </template>

    <template v-else>
      <p class="text-sm text-gray-600">
        Nhập mã 6 số đã gửi tới <strong class="text-brand-dark-green">{{ phone }}</strong>
        <button type="button" class="text-xs underline ml-1" @click="reset">Đổi số</button>
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
        Chế độ phát triển (chưa cấu hình SMS): mã là <strong class="font-mono">{{ devCode }}</strong>
      </p>
      <button type="button" class="text-xs text-gray-500 underline disabled:no-underline disabled:opacity-60" :disabled="resendIn > 0" @click="requestCode">
        {{ resendIn > 0 ? `Gửi lại mã sau ${resendIn}s` : 'Gửi lại mã' }}
      </button>
    </template>

    <p v-if="message" class="text-sm text-red-600">{{ message }}</p>
    <button type="submit" class="w-full bg-brand-dark-green text-brand-cream font-bold py-3 rounded-full hover:bg-[#1a4132] transition-colors disabled:opacity-60" :disabled="isLoading">
      {{ isLoading ? 'Đang xử lý...' : step === 'phone' ? 'Nhận mã đăng nhập' : 'Đăng nhập' }}
    </button>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initialPhone?: string }>()
const emit = defineEmits<{ (e: 'signed-in'): void }>()

const step = ref<'phone' | 'code'>('phone')
const phone = ref(props.initialPhone ?? '')
const code = ref('')
const devCode = ref('')
const message = ref('')
const isLoading = ref(false)
const resendIn = ref(0)

const { pause, resume } = useIntervalFn(
  () => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (!resendIn.value) pause()
  },
  1000,
  { immediate: false }
)

function reset() {
  step.value = 'phone'
  code.value = ''
  devCode.value = ''
  message.value = ''
}

async function requestCode() {
  message.value = ''
  isLoading.value = true
  try {
    const res = await $fetch<{ ok: true; devCode?: string }>('/api/account/otp', { method: 'POST', body: { phone: phone.value } })
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
    await $fetch('/api/account/verify', { method: 'POST', body: { phone: phone.value, code: code.value } })
    emit('signed-in')
  } catch (e) {
    message.value = apiErrorMessage(e, 'Mã không đúng')
  } finally {
    isLoading.value = false
  }
}
</script>
