<template>
  <div v-if="order">
    <NuxtLink to="/admin/orders" class="text-sm text-gray-500 hover:text-brand-dark-green">← Danh sách đơn</NuxtLink>

    <div class="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="font-mono text-3xl font-bold">{{ order.code }}</h1>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="ORDER_STATUS_BADGE[order.status]">{{ ORDER_STATUS_LABELS[order.status] }}</span>
        </div>
        <p class="text-sm text-gray-500">
          Đặt lúc {{ formatDateTime(order.createdAt) }}
          <ClientOnly>({{ timeAgo(order.createdAt) }})</ClientOnly>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/admin/orders/${order.id}/print`" target="_blank" class="admin-btn-secondary"><AppIcon name="printer" /> In phiếu</NuxtLink>
        <button v-if="canCancel" type="button" class="admin-btn-danger" @click="isCancelOpen = true">Huỷ đơn</button>
        <button v-if="canVoid" type="button" class="admin-btn-danger" @click="isCancelOpen = true">Huỷ đơn nhập nhầm</button>
        <button v-if="forward" type="button" class="admin-btn-primary" :disabled="isBusy" @click="setStatus(forward)">
          {{ FORWARD_ACTION_LABELS[forward] }} →
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <div class="lg:col-span-2 space-y-6">
        <section class="admin-card p-6">
          <h2 class="font-bold mb-4">Món ({{ order.items.reduce((n, i) => n + i.quantity, 0) }})</h2>
          <ul class="divide-y divide-gray-100">
            <li v-for="item in order.items" :key="item.id" class="py-3 flex gap-3">
              <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" class="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0">
              <div class="flex-1 min-w-0 text-sm">
                <p class="font-semibold"><span class="text-brand-gold font-bold mr-1">{{ item.quantity }}×</span>{{ item.productName }}</p>
                <p class="text-gray-500 text-xs">{{ [item.sugar, item.ice].filter(Boolean).join(' • ') }}</p>
                <p v-if="item.toppings.length" class="text-xs text-brand-dark-green">
                  + {{ item.toppings.map(t => `${t.name} (${formatVnd(t.price)})`).join(', ') }}
                </p>
                <p v-if="item.note" class="text-xs italic text-amber-700">Ghi chú: "{{ item.note }}"</p>
              </div>
              <div class="text-right text-sm tabular-nums whitespace-nowrap">
                <div class="font-semibold">{{ formatVnd(item.lineTotal) }}</div>
                <div class="text-xs text-gray-400">{{ formatVnd(item.unitPrice) }}/cốc</div>
              </div>
            </li>
          </ul>
          <dl class="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Tạm tính</dt><dd class="tabular-nums">{{ formatVnd(order.subtotal) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Phí giao hàng</dt><dd class="tabular-nums">{{ formatVnd(order.shippingFee) }}</dd></div>
            <div v-if="order.discount" class="flex justify-between text-red-600">
              <dt>Giảm giá <span class="font-mono">{{ order.couponCode }}</span></dt>
              <dd class="tabular-nums">-{{ formatVnd(order.discount) }}</dd>
            </div>
            <div v-if="order.pointsDiscount" class="flex justify-between text-red-600">
              <dt>Dùng {{ order.pointsUsed.toLocaleString('vi-VN') }} điểm</dt>
              <dd class="tabular-nums">-{{ formatVnd(order.pointsDiscount) }}</dd>
            </div>
            <div class="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <dt>Tổng thu</dt><dd class="tabular-nums">{{ formatVnd(order.total) }}</dd>
            </div>
          </dl>
        </section>

        <section class="admin-card p-6">
          <h2 class="font-bold mb-4">Lịch sử xử lý</h2>
          <ol class="relative border-l-2 border-gray-100 ml-2 space-y-4">
            <li v-for="(entry, i) in [...order.timeline].reverse()" :key="i" class="ml-5">
              <span class="absolute -left-[7px] w-3 h-3 rounded-full" :class="i === 0 ? 'bg-brand-gold' : 'bg-gray-300'" />
              <p class="text-sm">
                <span class="font-semibold">{{ ORDER_STATUS_LABELS[entry.status] }}</span>
                <span class="text-gray-500"> · {{ formatDateTime(entry.at) }} · {{ entry.by ?? 'Khách hàng' }}</span>
              </p>
              <p v-if="entry.note" class="text-sm text-gray-600">{{ entry.note }}</p>
            </li>
          </ol>
        </section>
      </div>

      <div class="space-y-6">
        <!-- Entered from a delivery app: no customer details, but the app's own code and its cut -->
        <section v-if="isPlatform" class="admin-card p-6 text-sm space-y-2">
          <h2 class="font-bold mb-2">{{ CHANNEL_LABELS[order.channel] }}</h2>
          <p>Mã đơn trên app: <strong class="font-mono">{{ order.externalCode }}</strong></p>
          <dl class="space-y-1 pt-2 border-t border-gray-100">
            <div class="flex justify-between"><dt>Tiền món</dt><dd class="tabular-nums">{{ formatVnd(order.total) }}</dd></div>
            <div class="flex justify-between text-gray-600"><dt>Phí {{ CHANNEL_LABELS[order.channel] }}</dt><dd class="tabular-nums">−{{ formatVnd(order.platformFee) }}</dd></div>
            <div class="flex justify-between text-gray-600"><dt>Giá vốn nguyên liệu</dt><dd class="tabular-nums">−{{ formatVnd(order.cogs) }}</dd></div>
            <div class="flex justify-between font-bold"><dt>Còn lại</dt><dd class="tabular-nums">{{ formatVnd(order.total - order.platformFee - order.cogs) }}</dd></div>
          </dl>
          <p v-if="order.note" class="bg-amber-50 text-amber-800 rounded-xl px-3 py-2">"{{ order.note }}"</p>
          <p v-if="order.cancelReason" class="bg-red-50 text-red-700 rounded-xl px-3 py-2">Đã huỷ: {{ order.cancelReason }}</p>
        </section>

        <section v-else class="admin-card p-6 text-sm space-y-2">
          <h2 class="font-bold mb-2">Khách hàng</h2>
          <p class="font-semibold">
            {{ order.customerName }}
            <NuxtLink v-if="order.customerId" :to="`/admin/customers/${order.customerId}`" class="text-xs font-normal underline ml-1">Hồ sơ khách →</NuxtLink>
          </p>
          <a :href="`tel:${order.customerPhone}`" class="text-brand-dark-green font-mono underline">{{ order.customerPhone }}</a>
          <p v-if="order.customerEmail" class="text-gray-600">
            {{ order.customerEmail }}
            <span class="text-xs text-gray-500">· gắn vào tài khoản khách khi đơn hoàn tất</span>
          </p>
          <p class="text-gray-600">{{ order.address }}, {{ order.district }}, {{ order.city }}</p>
          <p v-if="order.note" class="bg-amber-50 text-amber-800 rounded-xl px-3 py-2">"{{ order.note }}"</p>
          <p v-if="order.cancelReason" class="bg-red-50 text-red-700 rounded-xl px-3 py-2">Lý do huỷ: {{ order.cancelReason }}</p>
        </section>

        <section v-if="!isPlatform" class="admin-card p-6 text-sm space-y-3">
          <h2 class="font-bold">Thanh toán</h2>
          <p class="text-gray-600">{{ PAYMENT_METHOD_LABELS[order.paymentMethod] }}</p>
          <p v-if="order.pointsEarned" class="text-xs text-green-700">Khách đã được cộng {{ order.pointsEarned.toLocaleString('vi-VN') }} điểm.</p>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="PAYMENT_STATUS_BADGE[order.paymentStatus]">{{ PAYMENT_STATUS_LABELS[order.paymentStatus] }}</span>
            <span v-if="order.paidAt" class="text-xs text-gray-500">{{ formatDateTime(order.paidAt) }}</span>
          </div>
          <p v-if="order.paymentMethod === 'vietqr' && order.paymentStatus === 'unpaid' && order.status !== 'cancelled'" class="text-xs text-gray-500">
            Kiểm tra tài khoản ngân hàng: khoản chuyển {{ formatVnd(order.total) }}, nội dung <strong class="font-mono">{{ order.code }}</strong>.
          </p>
          <p v-if="order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid' && order.status !== 'cancelled'" class="text-xs text-gray-500">
            Tự chuyển sang "Đã thanh toán" khi đơn hoàn tất.
          </p>
          <div v-if="canEditMoney" class="flex flex-wrap gap-2">
            <button v-if="order.paymentStatus === 'unpaid'" type="button" class="admin-btn-primary !py-1.5 !text-xs" :disabled="isBusy" @click="setPayment('paid')">Đánh dấu đã thanh toán</button>
            <button v-if="order.paymentStatus === 'paid'" type="button" class="admin-btn-secondary !py-1.5 !text-xs" :disabled="isBusy" @click="setPayment('unpaid')">Huỷ đánh dấu</button>
            <button v-if="order.paymentStatus === 'paid' && order.status === 'cancelled'" type="button" class="admin-btn-danger !py-1.5 !text-xs" :disabled="isBusy" @click="setPayment('refunded')">Đã hoàn tiền</button>
          </div>
        </section>

        <section v-if="!isPlatform" class="admin-card p-6 text-sm space-y-2">
          <h2 class="font-bold">Link theo dõi của khách</h2>
          <p class="text-gray-500 text-xs">Gửi cho khách nếu họ cần xem lại đơn.</p>
          <div class="flex gap-2">
            <input :value="trackingUrl" readonly class="admin-input !text-xs font-mono" @focus="($event.target as HTMLInputElement).select()">
            <button type="button" class="admin-btn-secondary !py-1.5 !px-3 !text-xs shrink-0" @click="copyLink">{{ copied ? 'Đã chép' : 'Chép' }}</button>
          </div>
        </section>
      </div>
    </div>

    <AdminModal :open="isCancelOpen" :title="isPlatform ? 'Huỷ đơn nhập nhầm' : 'Huỷ đơn hàng'" @close="isCancelOpen = false">
      <form class="space-y-4" @submit.prevent="cancelOrder">
        <p v-if="isPlatform" class="text-sm text-gray-600">
          Nguyên liệu của đơn được trả lại kho, đơn không còn tính vào doanh thu và lãi lỗ.
        </p>
        <p v-else class="text-sm text-gray-600">
          Khách sẽ thấy lý do này trên trang theo dõi đơn.
          <span v-if="order.couponCode">Lượt dùng mã {{ order.couponCode }} sẽ được trả lại.</span>
          <span v-if="order.pointsUsed">{{ order.pointsUsed.toLocaleString('vi-VN') }} điểm khách đã dùng sẽ được hoàn lại.</span>
        </p>
        <div v-if="!isPlatform" class="flex flex-wrap gap-2">
          <button v-for="r in cancelPresets" :key="r" type="button" class="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-brand-gold" @click="cancelReason = r">{{ r }}</button>
        </div>
        <div>
          <label class="admin-label" for="cancel-reason">Lý do</label>
          <input id="cancel-reason" v-model="cancelReason" class="admin-input" maxlength="255">
          <p v-if="cancelError" class="admin-error">{{ cancelError }}</p>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="admin-btn-secondary" @click="isCancelOpen = false">Đóng</button>
          <button type="submit" class="admin-btn-danger" :disabled="isBusy">Xác nhận huỷ</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import type { AdminOrder } from '#shared/types/orders'
import type { OrderStatus, PaymentStatus } from '#shared/utils/orders'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEditMoney = useCanEditCatalog()
const requestUrl = useRequestURL()

const { data: order, error, refresh } = await useFetch<AdminOrder>(`/api/admin/orders/${route.params.id}`)
if (error.value || !order.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
}
useHead({ title: () => `Đơn ${order.value?.code ?? ''}` })

const forward = computed(() => (order.value ? nextForwardStatus(order.value.status) : null))
const canCancel = computed(() => !!order.value && canTransition(order.value.status, 'cancelled'))
const isPlatform = computed(() => !!order.value && order.value.channel !== 'website')
// Undoing an app order changes stock and revenue: managers and owners only (as on the server)
const canVoid = computed(() => isPlatform.value && order.value?.status === 'completed' && canEditMoney.value)
const trackingUrl = computed(() => `${requestUrl.origin}/orders/${order.value?.trackingToken}`)

// Someone else may be working on the same order
useIntervalFn(() => {
  if (!isBusy.value && !isCancelOpen.value) refresh()
}, 20_000)

const isBusy = ref(false)

async function run(action: () => Promise<AdminOrder>, success: string) {
  isBusy.value = true
  try {
    order.value = await action()
    uiStore.showToast(success)
    // Update the sidebar badge right away instead of waiting for the next poll
    refreshNuxtData('admin:pulse')
    return true
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
    await refresh()
    return false
  } finally {
    isBusy.value = false
  }
}

const setStatus = (status: OrderStatus, note = '') =>
  run(
    () => adminFetch<AdminOrder>(`/api/admin/orders/${route.params.id}/status`, { method: 'POST', body: { status, note } }),
    ORDER_STATUS_LABELS[status]
  )

const setPayment = (paymentStatus: PaymentStatus) =>
  run(
    () => adminFetch<AdminOrder>(`/api/admin/orders/${route.params.id}/payment`, { method: 'POST', body: { paymentStatus } }),
    PAYMENT_STATUS_LABELS[paymentStatus]
  )

const isCancelOpen = ref(false)
const cancelReason = ref('')
const cancelError = ref('')
const cancelPresets = ['Khách yêu cầu huỷ', 'Không liên lạc được khách', 'Hết món / hết nguyên liệu', 'Ngoài khu vực giao hàng']

async function cancelOrder() {
  cancelError.value = cancelReason.value.trim() ? '' : 'Vui lòng ghi lý do huỷ đơn'
  if (cancelError.value) return
  const done = isPlatform.value
    ? await run(
        () => adminFetch<AdminOrder>(`/api/admin/orders/${route.params.id}/void`, { method: 'POST', body: { reason: cancelReason.value.trim() } }),
        'Đã huỷ đơn và trả nguyên liệu về kho',
      )
    : await setStatus('cancelled', cancelReason.value.trim())
  if (done) {
    isCancelOpen.value = false
    cancelReason.value = ''
  }
}

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(trackingUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    uiStore.showToast('Không chép được, hãy chọn và chép thủ công', 'warning')
  }
}
</script>
