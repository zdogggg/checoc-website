<template>
  <div v-if="c">
    <NuxtLink to="/admin/customers" class="text-sm text-gray-500 hover:text-brand-dark-green">← Danh sách khách</NuxtLink>

    <div class="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">{{ c.name || 'Chưa có tên' }}</h1>
        <p class="text-sm text-gray-500">
          <a :href="`tel:${c.phone}`" class="font-mono underline text-brand-dark-green">{{ c.phone }}</a>
          · Khách từ {{ formatDateTime(c.createdAt) }}
          <template v-if="c.lastLoginAt"> · Đăng nhập gần nhất {{ formatDateTime(c.lastLoginAt) }}</template>
        </p>
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-gold/30">Hạng {{ TIER_LABELS[c.tier] }}</span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100" :title="SEGMENT_HINTS[c.segment]">{{ SEGMENT_LABELS[c.segment] }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="s in stats" :key="s.label" class="admin-card p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ s.label }}</div>
        <div class="font-heading text-2xl font-bold mt-1 tabular-nums">{{ s.value }}</div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <div class="lg:col-span-2 space-y-6">
        <section class="admin-card overflow-x-auto">
          <h2 class="font-bold px-6 pt-5 pb-3">Đơn hàng ({{ c.orders.length }})</h2>
          <table class="admin-table">
            <tbody>
              <tr v-for="o in c.orders" :key="o.id">
                <td><NuxtLink :to="`/admin/orders/${o.id}`" class="font-mono font-bold hover:underline">{{ o.code }}</NuxtLink></td>
                <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(o.createdAt) }}</td>
                <td><span class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" :class="ORDER_STATUS_BADGE[o.status]">{{ ORDER_STATUS_LABELS[o.status] }}</span></td>
                <td class="text-right text-xs text-gray-500">{{ o.itemCount }} món</td>
                <td class="text-right tabular-nums font-semibold">{{ formatVnd(o.total) }}</td>
              </tr>
              <tr v-if="!c.orders.length"><td class="text-gray-500 py-6 text-center">Chưa có đơn hàng.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="admin-card p-6">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="font-bold">Lịch sử điểm</h2>
            <form v-if="canEdit" class="flex flex-wrap gap-2 items-start" @submit.prevent="adjustPoints">
              <input v-model.number="pointsForm.delta" type="number" class="admin-input !w-28 !py-1.5" placeholder="+/- điểm" aria-label="Số điểm">
              <input v-model="pointsForm.note" class="admin-input !w-52 !py-1.5" placeholder="Lý do (bắt buộc)" aria-label="Lý do">
              <button type="submit" class="admin-btn-primary !py-1.5 !text-xs" :disabled="busy">Điều chỉnh</button>
              <p v-if="pointsError" class="admin-error w-full">{{ pointsError }}</p>
            </form>
          </div>
          <ul v-if="c.ledger.length" class="divide-y divide-gray-100 text-sm">
            <li v-for="l in c.ledger" :key="l.id" class="flex justify-between gap-3 py-2">
              <div>
                <p>
                  {{ l.note }}
                  <span v-if="l.orderCode" class="font-mono text-xs text-gray-500">{{ l.orderCode }}</span>
                </p>
                <p class="text-xs text-gray-400">{{ formatDateTime(l.createdAt) }}<template v-if="l.by"> · {{ l.by }}</template></p>
              </div>
              <div class="text-right">
                <span class="font-bold tabular-nums" :class="l.delta > 0 ? 'text-green-700' : 'text-red-600'">{{ l.delta > 0 ? '+' : '' }}{{ l.delta.toLocaleString('vi-VN') }}</span>
                <span class="block text-xs text-gray-400 tabular-nums">còn {{ l.balanceAfter.toLocaleString('vi-VN') }}</span>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-gray-500">Chưa có biến động điểm.</p>
        </section>
      </div>

      <div class="space-y-6">
        <form class="admin-card p-6 space-y-3" @submit.prevent="saveProfile">
          <h2 class="font-bold">Thông tin</h2>
          <div>
            <label class="admin-label" for="c-name">Tên</label>
            <input id="c-name" v-model="profile.name" class="admin-input">
          </div>
          <div>
            <label class="admin-label" for="c-email">Email</label>
            <input id="c-email" v-model="profile.email" type="email" class="admin-input">
            <p v-if="profileErrors.email" class="admin-error">{{ profileErrors.email }}</p>
          </div>
          <div>
            <label class="admin-label" for="c-birthday">Sinh nhật</label>
            <input id="c-birthday" v-model="profile.birthday" type="date" class="admin-input">
          </div>
          <div>
            <label class="admin-label" for="c-tags">Nhãn (cách nhau bằng dấu phẩy)</label>
            <input id="c-tags" v-model="profile.tags" class="admin-input" placeholder="VIP, văn phòng, ít ngọt">
          </div>
          <div>
            <label class="admin-label" for="c-note">Ghi chú nội bộ</label>
            <textarea id="c-note" v-model="profile.note" rows="3" class="admin-input" placeholder="Khách thích ít đá, hay đặt buổi chiều..." />
          </div>
          <button type="submit" class="admin-btn-primary w-full" :disabled="busy">Lưu</button>
        </form>

        <section class="admin-card p-6 space-y-3">
          <h2 class="font-bold">Mã giảm giá riêng</h2>
          <ul v-if="c.coupons.length" class="space-y-2 text-sm">
            <li v-for="cp in c.coupons" :key="cp.id" class="bg-gray-50 rounded-xl px-3 py-2">
              <span class="font-mono font-bold">{{ cp.code }}</span>
              <span class="text-xs ml-1" :class="cp.usedCount >= (cp.usageLimit ?? Infinity) ? 'text-gray-400' : 'text-emerald-700'">
                {{ cp.usedCount >= (cp.usageLimit ?? Infinity) ? 'đã dùng' : cp.endsAt ? `hết hạn ${formatDateTime(cp.endsAt)}` : 'chưa dùng' }}
              </span>
              <span v-if="cp.description" class="block text-xs text-gray-500">{{ cp.description }}</span>
            </li>
          </ul>
          <form v-if="canEdit" class="space-y-2" @submit.prevent="createCoupon">
            <div class="grid grid-cols-2 gap-2">
              <select v-model="couponForm.type" class="admin-input !py-1.5" aria-label="Loại ưu đãi">
                <option value="fixed">Giảm tiền</option>
                <option value="percent">Giảm %</option>
                <option value="free_shipping">Miễn ship</option>
              </select>
              <input v-if="couponForm.type !== 'free_shipping'" v-model.number="couponForm.value" type="number" min="0" class="admin-input !py-1.5" :placeholder="couponForm.type === 'percent' ? '%' : 'Số tiền'" aria-label="Giá trị">
            </div>
            <input v-model="couponForm.description" class="admin-input !py-1.5" placeholder="Mô tả, VD: Quà sinh nhật" aria-label="Mô tả">
            <div class="grid grid-cols-2 gap-2">
              <input v-model.number="couponForm.minOrder" type="number" min="0" class="admin-input !py-1.5" placeholder="Đơn tối thiểu" aria-label="Đơn tối thiểu">
              <input v-model.number="couponForm.validDays" type="number" min="1" class="admin-input !py-1.5" placeholder="Số ngày hiệu lực" aria-label="Số ngày hiệu lực">
            </div>
            <p v-if="couponError" class="admin-error">{{ couponError }}</p>
            <button type="submit" class="admin-btn-secondary w-full !py-1.5 !text-xs" :disabled="busy">Tặng mã (dùng 1 lần)</button>
            <p class="text-xs text-gray-500">Mã chỉ dùng được khi đặt bằng số {{ c.phone }}. Gửi mã cho khách qua Zalo/SMS.</p>
          </form>
        </section>

        <section class="admin-card p-6 space-y-3">
          <h2 class="font-bold">Ghi chú chăm sóc</h2>
          <form class="space-y-2" @submit.prevent="addNote">
            <textarea v-model="noteText" rows="2" class="admin-input" placeholder="VD: Đã gọi xin lỗi vì giao trễ, tặng mã KH..." />
            <button type="submit" class="admin-btn-secondary !py-1.5 !text-xs" :disabled="busy || !noteText.trim()">Thêm ghi chú</button>
          </form>
          <ul class="space-y-2 text-sm">
            <li v-for="n in c.notes" :key="n.id" class="border-l-2 border-brand-gold pl-3">
              <p class="whitespace-pre-line">{{ n.content }}</p>
              <p class="text-xs text-gray-400">{{ n.by ?? '—' }} · {{ formatDateTime(n.createdAt) }}</p>
            </li>
          </ul>
        </section>

        <section class="admin-card p-6 text-sm">
          <h2 class="font-bold mb-2">Địa chỉ đã giao</h2>
          <ul class="space-y-1.5 text-gray-600">
            <li v-for="a in c.addresses" :key="a.id" class="flex gap-1.5"><AppIcon name="pin" class="mt-0.5 text-brand-gold" />{{ a.address }}, {{ a.district }}, {{ a.city }}</li>
            <li v-if="!c.addresses.length" class="text-gray-400">Chưa có.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { adminCustomerInput, personalCouponInput, pointsAdjustInput } from '#shared/schemas/customers'
import type { AdminCustomerDetail } from '#shared/types/customers'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const adminFetch = useAdminApi()
const uiStore = useUiStore()
const canEdit = useCanEditCatalog()

const { data: c, error, refresh } = await useFetch<AdminCustomerDetail>(`/api/admin/customers/${route.params.id}`)
if (error.value || !c.value) throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
useHead({ title: () => c.value?.name || c.value?.phone || 'Khách hàng' })

const stats = computed(() => [
  { label: 'Điểm hiện có', value: (c.value?.points ?? 0).toLocaleString('vi-VN') },
  { label: 'Tổng chi tiêu', value: formatVnd(c.value?.totalSpent ?? 0) },
  { label: 'Đơn hoàn tất', value: c.value?.completedOrders ?? 0 },
  { label: 'Mua gần nhất', value: c.value?.lastOrderAt ? formatDateTime(c.value.lastOrderAt) : '—' },
])

const busy = ref(false)
async function run(action: () => Promise<unknown>, success: string, onError?: (e: unknown) => void) {
  busy.value = true
  try {
    await action()
    uiStore.showToast(success)
    await refresh()
    return true
  } catch (e) {
    if (onError) onError(e)
    else uiStore.showToast(apiErrorMessage(e), 'warning')
    return false
  } finally {
    busy.value = false
  }
}

// Profile
const profile = reactive({ name: '', email: '', birthday: '', tags: '', note: '' })
watch(
  c,
  (v) => Object.assign(profile, { name: v?.name ?? '', email: v?.email ?? '', birthday: v?.birthday ?? '', tags: v?.tags.join(', ') ?? '', note: v?.note ?? '' }),
  { immediate: true }
)
const profileErrors = ref<FieldErrors>({})
async function saveProfile() {
  const result = validateForm(adminCustomerInput, {
    ...profile,
    tags: profile.tags.split(',').map((t) => t.trim()).filter(Boolean),
  })
  profileErrors.value = result.errors ?? {}
  if (!result.data) return
  await run(() => adminFetch(`/api/admin/customers/${route.params.id}`, { method: 'PUT', body: result.data }), 'Đã lưu thông tin khách')
}

// Points
const pointsForm = reactive({ delta: null as number | null, note: '' })
const pointsError = ref('')
async function adjustPoints() {
  const result = validateForm(pointsAdjustInput, pointsForm)
  pointsError.value = result.errors ? Object.values(result.errors)[0]! : ''
  if (!result.data) return
  const ok = await run(
    () => adminFetch(`/api/admin/customers/${route.params.id}/points`, { method: 'POST', body: result.data }),
    'Đã điều chỉnh điểm',
    (e) => (pointsError.value = apiErrorMessage(e))
  )
  if (ok) Object.assign(pointsForm, { delta: null, note: '' })
}

// Personal coupon
const couponForm = reactive({ type: 'fixed' as 'fixed' | 'percent' | 'free_shipping', value: 20000, description: '', minOrder: 0, validDays: 30 })
const couponError = ref('')
async function createCoupon() {
  const result = validateForm(personalCouponInput, couponForm)
  couponError.value = result.errors ? Object.values(result.errors)[0]! : ''
  if (!result.data) return
  let created = ''
  const ok = await run(
    async () => {
      created = (await adminFetch<{ code: string }>(`/api/admin/customers/${route.params.id}/coupon`, { method: 'POST', body: result.data })).code
    },
    'Đã tạo mã riêng',
    (e) => (couponError.value = apiErrorMessage(e))
  )
  if (ok) uiStore.showToast(`Mã ${created} — gửi cho khách nhé`, 'info')
}

// Notes
const noteText = ref('')
async function addNote() {
  const ok = await run(
    () => adminFetch(`/api/admin/customers/${route.params.id}/notes`, { method: 'POST', body: { content: noteText.value } }),
    'Đã thêm ghi chú'
  )
  if (ok) noteText.value = ''
}
</script>
