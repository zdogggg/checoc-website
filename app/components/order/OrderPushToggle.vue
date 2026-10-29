<template>
  <div v-if="mode !== 'hidden'" class="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 text-sm text-brand-dark-green">
    <!-- iPhone in Safari: web push only works once the site is on the home screen -->
    <div v-if="mode === 'ios-install'" class="flex items-start gap-3">
      <AppIcon name="sparkles" :size="20" class="shrink-0 mt-0.5 text-brand-gold" />
      <div>
        <p class="font-bold mb-1">Muốn nhận thông báo khi đơn đổi trạng thái?</p>
        <p class="text-gray-600">
          Trên iPhone, bấm nút <strong>Chia sẻ</strong> ở thanh dưới của Safari → <strong>Thêm vào Màn hình chính</strong>.
          Mở Chè Cốc từ màn hình chính, vào lại trang đơn này và bật thông báo.
        </p>
      </div>
    </div>

    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <AppIcon name="sparkles" :size="20" class="shrink-0 mt-0.5 text-brand-gold" />
        <div>
          <p class="font-bold">{{ mode === 'on' ? 'Đã bật thông báo cho đơn này' : 'Nhận thông báo khi đơn đổi trạng thái' }}</p>
          <p v-if="mode === 'denied'" class="text-gray-600 text-xs mt-0.5">
            Bạn đã chặn thông báo. Mở cài đặt trình duyệt để cho phép lại, trang vẫn tự cập nhật khi đang mở.
          </p>
          <p v-else-if="message" class="text-red-600 text-xs mt-0.5">{{ message }}</p>
          <p v-else class="text-gray-600 text-xs mt-0.5">Xác nhận, đang giao, đã giao: báo ngay cả khi bạn đã đóng trang.</p>
        </div>
      </div>
      <button
        v-if="mode === 'off' || mode === 'on'"
        type="button"
        class="text-sm font-bold px-4 py-2 rounded-full transition-colors disabled:opacity-60"
        :class="mode === 'on' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-brand-dark-green text-brand-cream hover:bg-[#1a4132]'"
        :disabled="busy"
        @click="mode === 'on' ? turnOff() : turnOn()"
      >
        {{ busy ? 'Đang xử lý...' : mode === 'on' ? 'Tắt' : 'Bật thông báo' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ token: string; final: boolean }>()

type Mode = 'hidden' | 'ios-install' | 'off' | 'on' | 'denied'

const publicKey = useRuntimeConfig().public.vapidPublicKey
const mode = ref<Mode>('hidden')
const busy = ref(false)
const message = ref('')
const storageKey = `push:order:${props.token}`

const remember = (on: boolean) => {
  try {
    if (on) localStorage.setItem(storageKey, '1')
    else localStorage.removeItem(storageKey)
  } catch {
    // Private mode: the button just shows "off" next time
  }
}
const remembered = () => {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

onMounted(async () => {
  if (!publicKey || props.final) return
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (!supported) {
    mode.value = isIos && !standalone ? 'ios-install' : 'hidden'
    return
  }
  if (Notification.permission === 'denied') {
    mode.value = 'denied'
    return
  }
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  mode.value = subscription && Notification.permission === 'granted' && remembered() ? 'on' : 'off'
})

watch(
  () => props.final,
  (final) => {
    if (final) mode.value = 'hidden'
  },
)

// "BASE64URL" VAPID key -> bytes, as PushManager.subscribe expects
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function turnOn() {
  message.value = ''
  busy.value = true
  try {
    // Must run straight from the tap: iOS only shows the permission prompt for a user action
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      mode.value = permission === 'denied' ? 'denied' : 'off'
      return
    }
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      message.value = 'Trình duyệt chưa sẵn sàng, vui lòng tải lại trang rồi thử lại.'
      return
    }
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }))
    await $fetch(`/api/orders/${props.token}/push`, { method: 'POST', body: subscription.toJSON() })
    remember(true)
    mode.value = 'on'
  } catch (e) {
    message.value = apiErrorMessage(e, 'Không bật được thông báo, vui lòng thử lại')
  } finally {
    busy.value = false
  }
}

// Stops this order's notifications only; the browser stays subscribed for other orders
async function turnOff() {
  busy.value = true
  try {
    const subscription = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()
    if (subscription) {
      await $fetch(`/api/orders/${props.token}/push`, { method: 'DELETE', body: { endpoint: subscription.endpoint } })
    }
    remember(false)
    mode.value = 'off'
  } catch (e) {
    message.value = apiErrorMessage(e, 'Không tắt được thông báo, vui lòng thử lại')
  } finally {
    busy.value = false
  }
}
</script>
