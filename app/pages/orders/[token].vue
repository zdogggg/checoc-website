<template>
  <div class="pt-24 sm:pt-28 pb-20 min-h-screen bg-[var(--color-cream)]">
    <div v-if="order" class="container mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
      <!-- Just placed -->
      <div v-if="isNew" class="bg-white rounded-3xl p-6 sm:p-10 text-center shadow-sm border border-brand-gold/20">
        <div class="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 class="font-heading text-2xl sm:text-3xl font-bold text-brand-dark-green mb-2">Cảm ơn bạn đã đặt chè tại Chè Cốc!</h1>
        <p class="text-sm text-gray-600">
          Quán sẽ gọi xác nhận qua số {{ order.customerPhone }}. Lưu lại trang này để theo dõi đơn hàng nhé.
        </p>
      </div>

      <!-- Header + progress -->
      <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Đơn hàng</p>
            <p class="font-mono text-2xl font-bold text-brand-dark-green">{{ order.code }}</p>
            <p class="text-xs text-gray-500">Đặt lúc {{ formatDateTime(order.createdAt) }}</p>
          </div>
          <span class="text-xs font-bold px-3 py-1.5 rounded-full" :class="ORDER_STATUS_BADGE[order.status]">
            {{ ORDER_STATUS_LABELS[order.status] }}
          </span>
        </div>

        <div v-if="order.status === 'cancelled'" class="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm">
          Đơn hàng đã bị huỷ<span v-if="order.cancelReason">: {{ order.cancelReason }}</span>.
          Nếu cần hỗ trợ, vui lòng gọi hotline <strong>1900 8888</strong>.
        </div>
        <ol v-else class="grid grid-cols-5 gap-1 text-center">
          <li v-for="(step, i) in ORDER_FLOW" :key="step" class="flex flex-col items-center">
            <div class="flex items-center w-full">
              <span class="flex-1 h-0.5" :class="i === 0 ? 'bg-transparent' : i <= currentStep ? 'bg-brand-dark-green' : 'bg-gray-200'" />
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="i < currentStep ? 'bg-brand-dark-green text-brand-cream' : i === currentStep ? 'bg-brand-gold text-brand-dark-green ring-4 ring-brand-gold/20' : 'bg-gray-100 text-gray-400'"
              >
                {{ i < currentStep ? '✓' : i + 1 }}
              </span>
              <span class="flex-1 h-0.5" :class="i === ORDER_FLOW.length - 1 ? 'bg-transparent' : i < currentStep ? 'bg-brand-dark-green' : 'bg-gray-200'" />
            </div>
            <span class="text-[11px] sm:text-xs font-semibold mt-2" :class="i <= currentStep ? 'text-brand-dark-green' : 'text-gray-400'">
              {{ ORDER_STATUS_LABELS[step] }}
            </span>
            <span v-if="stepTime(step)" class="text-[10px] text-gray-400">{{ formatTime(stepTime(step)!) }}</span>
          </li>
        </ol>
      </section>

      <!-- Payment -->
      <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-3">Thanh toán</h2>
        <div class="flex flex-wrap items-center gap-2 text-sm mb-4">
          <span class="text-gray-600">{{ PAYMENT_METHOD_LABELS[order.paymentMethod] }}</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'">
            {{ PAYMENT_STATUS_LABELS[order.paymentStatus] }}
          </span>
        </div>

        <div v-if="showQr" class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-brand-gold/30 bg-brand-cream/40">
          <img :src="qrUrl" alt="Mã VietQR chuyển khoản" class="w-48 h-48 sm:w-44 sm:h-44 rounded-xl bg-white p-1.5 border border-gray-200 object-contain">
          <div class="text-sm space-y-1.5 text-gray-700">
            <p class="font-bold text-brand-dark-green">Quét mã bằng ứng dụng ngân hàng bất kỳ</p>
            <div>Ngân hàng: <strong>{{ bank.bankId }}</strong></div>
            <div>Số tài khoản: <strong class="font-mono">{{ bank.accountNo }}</strong></div>
            <div>Chủ tài khoản: <strong>{{ bank.accountName }}</strong></div>
            <div>Số tiền: <strong class="text-brand-gold">{{ formatVnd(order.total) }}</strong></div>
            <div>Nội dung: <strong class="font-mono bg-yellow-100 px-1 rounded">{{ order.code }}</strong></div>
            <p class="text-xs text-gray-500 pt-1">Quán xác nhận thanh toán thủ công trong giờ mở cửa; trạng thái sẽ tự cập nhật trên trang này.</p>
          </div>
        </div>
        <p v-else-if="order.paymentMethod === 'cod' && order.status !== 'cancelled'" class="text-sm text-gray-600">
          Vui lòng chuẩn bị {{ formatVnd(order.total) }} khi nhận hàng.
        </p>
      </section>

      <!-- Items -->
      <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-4">Món đã đặt</h2>
        <ul class="divide-y divide-gray-100">
          <li v-for="item in order.items" :key="item.id" class="py-3 flex gap-3 text-sm">
            <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" class="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0">
            <div class="flex-1 min-w-0">
              <p class="font-bold text-brand-dark-green">{{ item.productName }} <span class="text-gray-500 font-normal">× {{ item.quantity }}</span></p>
              <p class="text-xs text-gray-500">{{ [item.sugar, item.ice].filter(Boolean).join(' • ') }}</p>
              <p v-if="item.toppings.length" class="text-xs text-brand-gold">+{{ item.toppings.map(t => t.name).join(', ') }}</p>
              <p v-if="item.note" class="text-xs text-gray-500 italic">"{{ item.note }}"</p>
            </div>
            <div class="font-bold text-brand-dark-green whitespace-nowrap">{{ formatVnd(item.lineTotal) }}</div>
          </li>
        </ul>
        <dl class="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm text-gray-600">
          <div class="flex justify-between"><dt>Tạm tính</dt><dd>{{ formatVnd(order.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt>Phí giao hàng</dt><dd>{{ order.shippingFee ? formatVnd(order.shippingFee) : 'Miễn phí' }}</dd></div>
          <div v-if="order.discount" class="flex justify-between text-red-600">
            <dt>Giảm giá <span v-if="order.couponCode" class="font-mono">({{ order.couponCode }})</span></dt>
            <dd>-{{ formatVnd(order.discount) }}</dd>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-100 text-brand-dark-green">
            <dt class="font-heading font-bold text-base">Tổng cộng</dt>
            <dd class="font-heading font-bold text-xl text-brand-gold">{{ formatVnd(order.total) }}</dd>
          </div>
        </dl>
      </section>

      <!-- Delivery -->
      <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 text-sm text-gray-600 space-y-1.5">
        <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-2">Giao đến</h2>
        <p><strong class="text-brand-dark-green">{{ order.customerName }}</strong> · {{ order.customerPhone }}</p>
        <p>{{ order.address }}, {{ order.district }}, {{ order.city }}</p>
        <p v-if="order.note" class="italic">Ghi chú: "{{ order.note }}"</p>
      </section>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <span>Cần hỗ trợ? Gọi hotline <strong class="text-brand-dark-green text-sm">1900 8888</strong> (08:00 - 22:30)</span>
        <NuxtLink to="/products" class="bg-brand-dark-green text-brand-cream font-bold px-6 py-3 rounded-full hover:bg-[#1a4132] transition-colors text-sm">
          Tiếp tục chọn món
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PublicOrder } from '#shared/types/orders'
import type { OrderStatus } from '#shared/utils/orders'

const route = useRoute()
const config = useRuntimeConfig()
const token = computed(() => String(route.params.token))
const isNew = computed(() => route.query.new === '1')

const { data: order, error, refresh } = await useFetch<PublicOrder>(() => `/api/orders/${token.value}`, {
  key: `order:${token.value}`,
})
if (error.value || !order.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

useHead({
  title: () => `Đơn ${order.value?.code ?? ''} — Chè Cốc`,
  // Tracking links are private
  meta: [{ name: 'robots', content: 'noindex' }],
})

const currentStep = computed(() => (order.value ? ORDER_FLOW.indexOf(order.value.status) : 0))
const stepTime = (status: OrderStatus) => order.value?.timeline.findLast(t => t.status === status)?.at

const bank = config.public.bank
const showQr = computed(
  () =>
    !!order.value &&
    order.value.paymentMethod === 'vietqr' &&
    order.value.paymentStatus === 'unpaid' &&
    order.value.status !== 'cancelled' &&
    isBankConfigured(bank)
)
const qrUrl = computed(() => (order.value && isBankConfigured(bank) ? vietQrImageUrl(bank, order.value.total, order.value.code) : ''))

// Keep the page fresh while the order is moving (stops once it is completed or cancelled)
const { pause } = useIntervalFn(() => {
  if (order.value && isFinalStatus(order.value.status)) pause()
  else refresh()
}, 20_000)
</script>
