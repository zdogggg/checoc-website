<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Mã giảm giá</h1>
        <p class="text-gray-500 text-sm">Khách nhập mã ở bước thanh toán. Hệ thống tự kiểm tra hạn dùng và giá trị đơn tối thiểu.</p>
      </div>
      <button v-if="canEdit" type="button" class="admin-btn-primary" @click="openForm()">+ Tạo mã</button>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Ưu đãi</th>
            <th>Điều kiện</th>
            <th>Thời hạn</th>
            <th class="text-right">Đã dùng</th>
            <th>Trạng thái</th>
            <th v-if="canEdit" class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id">
            <td>
              <span class="font-mono font-bold">{{ c.code }}</span>
              <span v-if="c.description" class="block text-xs text-gray-500 max-w-[16rem] truncate">{{ c.description }}</span>
            </td>
            <td class="whitespace-nowrap">{{ benefit(c) }}</td>
            <td class="whitespace-nowrap text-gray-600">{{ c.minOrder ? `Đơn từ ${formatVnd(c.minOrder)}` : '—' }}</td>
            <td class="whitespace-nowrap text-gray-600 text-xs">{{ period(c) }}</td>
            <td class="text-right tabular-nums">{{ c.usedCount }}<span v-if="c.usageLimit" class="text-gray-400">/{{ c.usageLimit }}</span></td>
            <td>
              <span class="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap" :class="status(c).cls">{{ status(c).label }}</span>
            </td>
            <td v-if="canEdit" class="whitespace-nowrap text-right">
              <button type="button" class="text-sm font-semibold hover:underline mr-4" @click="openForm(c)">Sửa</button>
              <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(c)">Xoá</button>
            </td>
          </tr>
          <tr v-if="!coupons.length">
            <td colspan="7" class="text-center text-gray-500 py-10">Chưa có mã giảm giá nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal :open="isFormOpen" :title="editingId ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'" @close="isFormOpen = false">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="c-code">Mã</label>
            <input id="c-code" v-model="form.code" class="admin-input font-mono uppercase">
            <p v-if="errors.code" class="admin-error">{{ errors.code }}</p>
          </div>
          <div>
            <label class="admin-label" for="c-type">Loại</label>
            <select id="c-type" v-model="form.type" class="admin-input">
              <option value="percent">Giảm theo %</option>
              <option value="fixed">Giảm số tiền</option>
              <option value="free_shipping">Miễn phí ship</option>
            </select>
          </div>
        </div>
        <div v-if="form.type !== 'free_shipping'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="c-value">{{ form.type === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm (đ)' }}</label>
            <input id="c-value" v-model.number="form.value" type="number" min="0" class="admin-input">
            <p v-if="errors.value" class="admin-error">{{ errors.value }}</p>
          </div>
          <div v-if="form.type === 'percent'">
            <label class="admin-label" for="c-max">Giảm tối đa (đ)</label>
            <input id="c-max" v-model.number="form.maxDiscount" type="number" min="0" class="admin-input" placeholder="Không giới hạn">
          </div>
        </div>
        <div>
          <label class="admin-label" for="c-desc">Mô tả (khách nhìn thấy)</label>
          <input id="c-desc" v-model="form.description" class="admin-input" maxlength="200">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="c-min">Đơn tối thiểu (đ)</label>
            <input id="c-min" v-model.number="form.minOrder" type="number" min="0" class="admin-input">
          </div>
          <div>
            <label class="admin-label" for="c-limit">Số lượt dùng tối đa</label>
            <input id="c-limit" v-model.number="form.usageLimit" type="number" min="1" class="admin-input" placeholder="Không giới hạn">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="c-start">Bắt đầu</label>
            <input id="c-start" v-model="form.startsAt" type="datetime-local" class="admin-input">
          </div>
          <div>
            <label class="admin-label" for="c-end">Kết thúc</label>
            <input id="c-end" v-model="form.endsAt" type="datetime-local" class="admin-input">
            <p v-if="errors.endsAt" class="admin-error">{{ errors.endsAt }}</p>
          </div>
        </div>
        <AdminToggle v-model="form.isActive" label="Đang bật" />
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="admin-btn-secondary" @click="isFormOpen = false">Huỷ</button>
          <button type="submit" class="admin-btn-primary" :disabled="isSaving">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
import { couponInput } from '#shared/schemas/catalog'
import type { CouponType } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Mã giảm giá' })

interface AdminCoupon {
  id: number
  code: string
  type: CouponType
  value: number
  description: string
  minOrder: number
  maxDiscount: number | null
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
}

const adminFetch = useAdminApi()
const canEdit = useCanEditCatalog()
const uiStore = useUiStore()
const { data: coupons, refresh } = await useFetch<AdminCoupon[]>('/api/admin/coupons', { default: () => [] })

const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

function benefit(c: AdminCoupon) {
  if (c.type === 'free_shipping') return 'Miễn phí ship'
  if (c.type === 'fixed') return `Giảm ${formatVnd(c.value)}`
  return `Giảm ${c.value}%` + (c.maxDiscount ? ` (tối đa ${formatVnd(c.maxDiscount)})` : '')
}

function period(c: AdminCoupon) {
  if (!c.startsAt && !c.endsAt) return 'Không giới hạn'
  const from = c.startsAt ? dateFmt.format(new Date(c.startsAt)) : '…'
  const to = c.endsAt ? dateFmt.format(new Date(c.endsAt)) : '…'
  return `${from} → ${to}`
}

// Same rules as POST /api/coupons/validate
function status(c: AdminCoupon) {
  const now = Date.now()
  if (!c.isActive) return { label: 'Đã tắt', cls: 'bg-gray-100 text-gray-500' }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: 'Chưa bắt đầu', cls: 'bg-sky-50 text-sky-700' }
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return { label: 'Hết hạn', cls: 'bg-amber-50 text-amber-700' }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { label: 'Hết lượt', cls: 'bg-amber-50 text-amber-700' }
  return { label: 'Đang chạy', cls: 'bg-emerald-50 text-emerald-700' }
}

// <input type="datetime-local"> works with local "YYYY-MM-DDTHH:mm" strings
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const blank = () => ({
  code: '',
  type: 'percent' as CouponType,
  value: 10,
  description: '',
  minOrder: 0,
  maxDiscount: null as number | null | '',
  startsAt: '',
  endsAt: '',
  usageLimit: null as number | null | '',
  isActive: true,
})
const form = reactive(blank())
const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)

function openForm(c?: AdminCoupon) {
  Object.assign(form, blank(), c ? { ...c, startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt) } : {})
  editingId.value = c?.id ?? null
  errors.value = {}
  formError.value = ''
  isFormOpen.value = true
}

const orNull = <T,>(v: T | '' | null) => (v === '' || v == null ? null : v)

async function save() {
  formError.value = ''
  const result = validateForm(couponInput, {
    ...form,
    value: form.type === 'free_shipping' ? 0 : form.value,
    maxDiscount: form.type === 'percent' ? orNull(form.maxDiscount) : null,
    usageLimit: orNull(form.usageLimit),
    startsAt: form.startsAt ? new Date(form.startsAt) : null,
    endsAt: form.endsAt ? new Date(form.endsAt) : null,
  })
  errors.value = result.errors ?? {}
  if (!result.data) return

  isSaving.value = true
  try {
    await adminFetch(editingId.value ? `/api/admin/coupons/${editingId.value}` : '/api/admin/coupons', {
      method: editingId.value ? 'PUT' : 'POST',
      body: result.data,
    })
    isFormOpen.value = false
    uiStore.showToast('Đã lưu mã giảm giá')
    await refresh()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function remove(c: AdminCoupon) {
  if (!confirm(`Xoá mã ${c.code}?`)) return
  try {
    await adminFetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá mã giảm giá')
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
