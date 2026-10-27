<template>
  <div class="pt-24 sm:pt-28 pb-20 min-h-screen bg-[var(--color-cream)]">
    <!-- Signed out -->
    <div v-if="!account" class="container mx-auto max-w-md px-4">
      <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h1 class="font-heading text-2xl font-bold text-brand-dark-green mb-1">Tài khoản Chè Cốc</h1>
        <p class="text-sm text-gray-500 mb-6">Xem đơn đã đặt, điểm thưởng và hạng thành viên.</p>
        <AccountLogin v-if="login.email || login.sms" :channels="login" @signed-in="onSignedIn" />
        <p v-else class="text-sm text-gray-600 bg-brand-cream/60 rounded-2xl p-4">
          Đăng nhập tài khoản sẽ sớm có. Bạn vẫn được tích điểm tự động theo số điện thoại mỗi khi đặt hàng,
          và có thể <NuxtLink to="/orders" class="underline font-semibold">tra cứu đơn hàng</NuxtLink> bằng mã đơn.
        </p>
      </div>
      <LoyaltyRules class="mt-6" />
    </div>

    <!-- Signed in -->
    <div v-else class="container mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
      <section class="bg-brand-dark-green text-brand-cream rounded-3xl p-6 sm:p-8 shadow-md">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm text-brand-cream/70">Xin chào</p>
            <h1 class="font-heading text-2xl sm:text-3xl font-bold">{{ account.name || account.phone }}</h1>
            <span class="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full" :class="TIER_BADGE[account.tier]">
              Hạng {{ TIER_LABELS[account.tier] }}
            </span>
          </div>
          <div class="text-right">
            <p class="text-sm text-brand-cream/70">Điểm hiện có</p>
            <p class="font-heading text-4xl font-bold text-brand-gold tabular-nums">{{ account.points.toLocaleString('vi-VN') }}</p>
            <p class="text-xs text-brand-cream/70">≈ {{ formatVnd(pointsValue(account.points)) }} khi đổi</p>
          </div>
        </div>
        <div v-if="upcoming" class="mt-6">
          <div class="flex justify-between text-xs text-brand-cream/80 mb-1.5">
            <span>Đã chi {{ formatVnd(account.totalSpent) }}</span>
            <span>Còn {{ formatVnd(upcoming.remaining) }} để lên hạng {{ upcoming.label }}</span>
          </div>
          <div class="h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full bg-brand-gold rounded-full" :style="{ width: `${tierProgress}%` }" />
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-brand-cream/80">Bạn đang ở hạng cao nhất. Cảm ơn bạn đã luôn ủng hộ Chè Cốc!</p>
      </section>

      <div class="grid lg:grid-cols-5 gap-6 items-start">
        <div class="lg:col-span-3 space-y-6">
          <section class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-4">Đơn hàng của bạn</h2>
            <ul v-if="account.orders.length" class="divide-y divide-gray-100">
              <li v-for="o in account.orders" :key="o.id">
                <NuxtLink :to="`/orders/${o.trackingToken}`" class="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-xl">
                  <div>
                    <p class="font-mono font-bold text-sm">{{ o.code }}</p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(o.createdAt) }} · {{ o.itemCount }} món</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-sm tabular-nums">{{ formatVnd(o.total) }}</p>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" :class="ORDER_STATUS_BADGE[o.status]">{{ ORDER_STATUS_LABELS[o.status] }}</span>
                  </div>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">
              Chưa có đơn nào. <NuxtLink to="/products" class="underline">Xem thực đơn</NuxtLink>
            </p>
          </section>

          <section class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-4">Lịch sử điểm</h2>
            <ul v-if="account.ledger.length" class="divide-y divide-gray-100 text-sm">
              <li v-for="l in account.ledger" :key="l.id" class="flex justify-between gap-3 py-2.5">
                <div>
                  <p>{{ l.note }} <span v-if="l.orderCode" class="font-mono text-xs text-gray-500">{{ l.orderCode }}</span></p>
                  <p class="text-xs text-gray-400">{{ formatDateTime(l.createdAt) }}</p>
                </div>
                <span class="font-bold tabular-nums" :class="l.delta > 0 ? 'text-green-700' : 'text-red-600'">
                  {{ l.delta > 0 ? '+' : '' }}{{ l.delta.toLocaleString('vi-VN') }}
                </span>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Điểm sẽ được cộng khi đơn hàng của bạn hoàn tất.</p>
          </section>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <form class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3" novalidate @submit.prevent="saveProfile">
            <h2 class="font-heading text-lg font-bold text-brand-dark-green">Thông tin cá nhân</h2>
            <p class="text-xs text-gray-500">Số điện thoại: <strong class="text-brand-dark-green">{{ account.phone }}</strong></p>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1" for="acc-name">Họ tên</label>
              <input id="acc-name" v-model="profile.name" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <p v-if="profileErrors.name" class="text-xs text-red-600 mt-1">{{ profileErrors.name }}</p>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1" for="acc-email">Email (tuỳ chọn)</label>
              <input id="acc-email" v-model="profile.email" type="email" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <p v-if="profileErrors.email" class="text-xs text-red-600 mt-1">{{ profileErrors.email }}</p>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1" for="acc-birthday">Sinh nhật (để nhận quà)</label>
              <input id="acc-birthday" v-model="profile.birthday" type="date" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold">
            </div>
            <button type="submit" class="w-full bg-brand-dark-green text-brand-cream font-bold py-2.5 rounded-full text-sm disabled:opacity-60" :disabled="isSaving">
              {{ isSaving ? 'Đang lưu...' : 'Lưu thông tin' }}
            </button>
          </form>

          <section class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-3">Địa chỉ đã dùng</h2>
            <ul v-if="account.addresses.length" class="space-y-2 text-sm">
              <li v-for="a in account.addresses" :key="a.id" class="flex items-start justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2">
                <span>{{ a.address }}, {{ a.district }}, {{ a.city }}</span>
                <button type="button" class="text-xs text-red-600 hover:underline shrink-0" @click="removeAddress(a.id)">Xoá</button>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Địa chỉ giao hàng sẽ được lưu khi bạn đặt đơn.</p>
          </section>

          <LoyaltyRules />

          <button type="button" class="w-full text-sm text-gray-500 hover:text-red-600 py-2" @click="logout">Đăng xuất</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { accountProfileInput } from '#shared/schemas/customers'
import type { CustomerTier } from '#shared/utils/loyalty'
import AccountLogin from '~/components/account/AccountLogin.vue'
import LoyaltyRules from '~/components/account/LoyaltyRules.vue'

useHead({ title: 'Tài khoản — Chè Cốc', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const uiStore = useUiStore()
const { data, refresh } = await useCustomerAccount()
const account = computed(() => data.value.account)
const login = computed(() => data.value.login)

const TIER_BADGE: Record<CustomerTier, string> = {
  member: 'bg-white/15 text-brand-cream',
  silver: 'bg-gray-200 text-gray-800',
  gold: 'bg-brand-gold text-brand-dark-green',
}

const upcoming = computed(() => (account.value ? nextTier(account.value.totalSpent) : null))
const tierProgress = computed(() => {
  if (!account.value || !upcoming.value) return 100
  const target = account.value.totalSpent + upcoming.value.remaining
  return Math.min(100, Math.round((account.value.totalSpent / target) * 100))
})

async function onSignedIn() {
  await refresh()
  uiStore.showToast('Đăng nhập thành công')
  const redirect = String(route.query.redirect ?? '')
  if (redirect.startsWith('/') && !redirect.startsWith('//')) await navigateTo(redirect)
}

const profile = reactive({ name: '', email: '', birthday: '' })
watch(
  account,
  (a) => Object.assign(profile, { name: a?.name ?? '', email: a?.email ?? '', birthday: a?.birthday ?? '' }),
  { immediate: true }
)
const profileErrors = ref<FieldErrors>({})
const isSaving = ref(false)

async function saveProfile() {
  const result = validateForm(accountProfileInput, profile)
  profileErrors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    await $fetch('/api/account/me', { method: 'PUT', body: result.data })
    await refresh()
    uiStore.showToast('Đã lưu thông tin')
  } catch (e) {
    profileErrors.value = apiFieldErrors(e)
    uiStore.showToast(apiErrorMessage(e), 'warning')
  } finally {
    isSaving.value = false
  }
}

async function removeAddress(id: number) {
  try {
    await $fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}

async function logout() {
  await $fetch('/api/account/logout', { method: 'POST' })
  await refresh()
  uiStore.showToast('Đã đăng xuất')
}
</script>
