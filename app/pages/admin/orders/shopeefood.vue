<template>
  <div>
    <NuxtLink to="/admin/orders?channel=shopeefood" class="text-sm text-gray-500 hover:underline">← Đơn hàng</NuxtLink>
    <div class="flex flex-wrap items-end justify-between gap-4 mt-2 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Nhập đơn ShopeeFood</h1>
        <p class="text-gray-500 text-sm">
          Nhập đơn đã giao xong trên ShopeeFood: kho tự trừ theo định mức, doanh thu và phí vào báo cáo, lãi lỗ.
        </p>
      </div>
    </div>

    <form class="grid lg:grid-cols-5 gap-6 items-start" novalidate @submit.prevent="save">
      <!-- Menu: tap a dish to add one -->
      <section class="lg:col-span-3 admin-card p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 class="font-bold">Chọn món</h2>
          <input v-model="menuSearch" type="search" class="admin-input w-56" placeholder="Tìm món..." aria-label="Tìm món">
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            type="button"
            class="text-left rounded-xl border border-gray-200 px-3 py-2.5 hover:border-brand-gold hover:bg-brand-cream/40 transition-colors"
            @click="addProduct(p)"
          >
            <span class="block text-sm font-semibold leading-snug">{{ p.name }}</span>
            <span class="block text-xs text-gray-500 tabular-nums mt-0.5">
              {{ formatVnd(p.price) }}<template v-if="!p.isAvailable"> · web đang tắt</template>
            </span>
            <span v-if="countOf(p.id)" class="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-brand-dark-green text-brand-cream">
              × {{ countOf(p.id) }}
            </span>
          </button>
        </div>
      </section>

      <!-- The order -->
      <section class="lg:col-span-2 admin-card p-5 space-y-4 lg:sticky lg:top-6">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="admin-label" for="spf-code">Mã đơn ShopeeFood</label>
            <input id="spf-code" ref="codeInput" v-model="form.externalCode" class="admin-input font-mono" autocomplete="off" placeholder="VD: 2510291234">
            <p v-if="errors.externalCode" class="admin-error">{{ errors.externalCode }}</p>
          </div>
          <div>
            <label class="admin-label" for="spf-time">Thời gian đặt</label>
            <input id="spf-time" v-model="form.placedAtLocal" type="datetime-local" class="admin-input" :max="nowLocal()">
            <p v-if="errors.placedAt" class="admin-error">{{ errors.placedAt }}</p>
          </div>
        </div>

        <div>
          <h3 class="admin-label">Món trong đơn</h3>
          <p v-if="!lines.length" class="text-sm text-gray-500 py-3">Bấm vào món bên trái để thêm.</p>
          <p v-if="errors.items" class="admin-error">{{ errors.items }}</p>
          <ul class="divide-y divide-gray-100">
            <li v-for="(line, i) in lines" :key="line.key" class="py-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold">{{ line.name }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold" :aria-label="`Bớt ${line.name}`" @click="changeQty(i, -1)">−</button>
                  <span class="w-6 text-center tabular-nums font-semibold">{{ line.quantity }}</span>
                  <button type="button" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold" :aria-label="`Thêm ${line.name}`" @click="changeQty(i, 1)">+</button>
                </div>
              </div>
              <button type="button" class="text-xs text-gray-500 underline mt-1" @click="line.showToppings = !line.showToppings">
                {{ line.toppings.length ? `Topping: ${line.toppings.join(', ')}` : 'Thêm topping' }}
              </button>
              <div v-if="line.showToppings" class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="t in toppings"
                  :key="t.id"
                  type="button"
                  class="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  :class="line.toppings.includes(t.name) ? 'bg-brand-dark-green text-brand-cream border-brand-dark-green' : 'border-gray-200 hover:border-brand-gold'"
                  @click="toggleTopping(line, t.name)"
                >
                  {{ t.name }}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div class="col-span-2">
            <label class="admin-label" for="spf-subtotal">Tiền món trên ShopeeFood</label>
            <input id="spf-subtotal" v-model.number="form.subtotal" type="number" min="0" step="1000" class="admin-input tabular-nums" :placeholder="`${formatVnd(menuTotal)} (giá web)`">
            <p class="text-xs text-gray-500 mt-1">Bỏ trống nếu giá trên ShopeeFood bằng giá web.</p>
          </div>
          <div>
            <label class="admin-label" for="spf-discount">Quán giảm giá</label>
            <input id="spf-discount" v-model.number="form.discount" type="number" min="0" step="1000" class="admin-input tabular-nums" placeholder="0">
            <p v-if="errors.discount" class="admin-error">{{ errors.discount }}</p>
            <p v-else class="text-xs text-gray-500 mt-1">Voucher do quán chịu.</p>
          </div>
          <div>
            <label class="admin-label" for="spf-fee">Phí ShopeeFood (%)</label>
            <input id="spf-fee" v-model.number="form.feePercent" type="number" min="0" max="60" step="0.5" class="admin-input tabular-nums">
            <p v-if="errors.feePercent" class="admin-error">{{ errors.feePercent }}</p>
            <p v-else class="text-xs text-gray-500 mt-1">Máy này nhớ cho lần sau.</p>
          </div>
        </div>

        <dl class="bg-brand-cream/50 rounded-2xl p-4 text-sm space-y-1">
          <div class="flex justify-between"><dt>Tiền món</dt><dd class="tabular-nums">{{ formatVnd(goods) }}</dd></div>
          <div class="flex justify-between text-gray-600"><dt>Phí ShopeeFood</dt><dd class="tabular-nums">−{{ formatVnd(fee) }}</dd></div>
          <div class="flex justify-between font-bold text-base pt-1 border-t border-brand-gold/30"><dt>Quán thực nhận</dt><dd class="tabular-nums">{{ formatVnd(goods - fee) }}</dd></div>
        </dl>

        <div>
          <label class="admin-label" for="spf-note">Ghi chú</label>
          <input id="spf-note" v-model="form.note" class="admin-input" placeholder="Không bắt buộc">
        </div>

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <button type="submit" class="admin-btn-primary w-full justify-center" :disabled="isSaving">
          {{ isSaving ? 'Đang lưu...' : 'Lưu đơn' }}
        </button>
      </section>
    </form>

    <!-- Today's entries, to spot a double entry or undo a mistake -->
    <section class="admin-card p-5 mt-6">
      <h2 class="font-bold mb-3">Đã nhập hôm nay</h2>
      <ul v-if="today?.items.length" class="divide-y divide-gray-100 text-sm">
        <li v-for="o in today.items" :key="o.id" class="py-2.5 flex flex-wrap items-center justify-between gap-2" :class="{ 'opacity-50': o.status === 'cancelled' }">
          <NuxtLink :to="`/admin/orders/${o.id}`" class="min-w-0 hover:underline">
            <span class="font-mono font-semibold">{{ o.externalCode }}</span>
            <span class="text-gray-500"> · {{ formatTime(o.createdAt) }} · {{ o.itemSummary }}</span>
            <span v-if="o.status === 'cancelled'" class="text-red-600"> · đã huỷ</span>
          </NuxtLink>
          <span class="tabular-nums font-semibold">{{ formatVnd(o.total) }}</span>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">Chưa có đơn nào.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { platformOrderInput } from '#shared/schemas/orders'
import type { AdminOrderListItem } from '#shared/types/orders'
import type { ProductOptions } from '#shared/types/catalog'

interface MenuProduct {
  id: number
  name: string
  price: number
  isAvailable: boolean
}
interface Line {
  key: number
  productId: number
  name: string
  price: number
  quantity: number
  toppings: string[]
  showToppings: boolean
}

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nhập đơn ShopeeFood' })

const adminFetch = useAdminApi()
const uiStore = useUiStore()
const FEE_KEY = 'shopeefood:feePercent'

const [{ data: products }, { data: options }, { data: today, refresh: refreshToday }] = await Promise.all([
  useFetch<MenuProduct[]>('/api/admin/products', { default: () => [] }),
  useFetch<ProductOptions>('/api/options'),
  useFetch<{ items: AdminOrderListItem[] }>('/api/admin/orders', {
    query: { status: 'all', channel: 'shopeefood', day: shopToday() },
  }),
])
const toppings = computed(() => options.value?.toppings ?? [])

const menuSearch = ref('')
const filteredProducts = computed(() => {
  const q = menuSearch.value.trim().toLowerCase()
  return q ? products.value.filter((p) => p.name.toLowerCase().includes(q)) : products.value
})

// "YYYY-MM-DDTHH:mm" in shop time for the datetime-local input (Vietnam has no DST: +07:00)
function nowLocal(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

const blank = (feePercent = 0) => ({
  externalCode: '',
  placedAtLocal: nowLocal(),
  subtotal: null as number | null,
  discount: null as number | null,
  feePercent,
  note: '',
})
const form = reactive(blank())
const lines = ref<Line[]>([])
let nextKey = 1

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(FEE_KEY))
    if (saved > 0) form.feePercent = saved
  } catch {
    // Storage blocked: the field just starts at 0
  }
})
watch(
  () => form.feePercent,
  (v) => {
    try {
      localStorage.setItem(FEE_KEY, String(v ?? 0))
    } catch {
      // ignore
    }
  },
)

const countOf = (productId: number) => lines.value.filter((l) => l.productId === productId).reduce((n, l) => n + l.quantity, 0)

function addProduct(p: MenuProduct) {
  // Tapping again adds to the plain line of that dish; lines with toppings stay separate
  const plain = lines.value.find((l) => l.productId === p.id && !l.toppings.length)
  if (plain) plain.quantity++
  else lines.value.push({ key: nextKey++, productId: p.id, name: p.name, price: p.price, quantity: 1, toppings: [], showToppings: false })
}

function changeQty(index: number, delta: number) {
  const line = lines.value[index]!
  line.quantity += delta
  if (line.quantity <= 0) lines.value.splice(index, 1)
}

function toggleTopping(line: Line, name: string) {
  line.toppings = line.toppings.includes(name) ? line.toppings.filter((t) => t !== name) : [...line.toppings, name]
}

const toppingPrice = (name: string) => toppings.value.find((t) => t.name === name)?.price ?? 0
const menuTotal = computed(() =>
  lines.value.reduce((sum, l) => sum + (l.price + l.toppings.reduce((s, t) => s + toppingPrice(t), 0)) * l.quantity, 0),
)
const goods = computed(() => Math.max(0, (form.subtotal || menuTotal.value) - (form.discount || 0)))
const fee = computed(() => Math.max(0, Math.round((goods.value * (form.feePercent || 0)) / 100)))

const errors = ref<FieldErrors>({})
const formError = ref('')
const isSaving = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)

async function save() {
  formError.value = ''
  const payload = {
    externalCode: form.externalCode,
    placedAt: form.placedAtLocal ? new Date(`${form.placedAtLocal}:00+07:00`).toISOString() : undefined,
    items: lines.value.map((l) => ({ productId: l.productId, quantity: l.quantity, toppings: l.toppings })),
    subtotal: form.subtotal || undefined,
    discount: form.discount || 0,
    feePercent: form.feePercent || 0,
    note: form.note,
  }
  const result = validateForm(platformOrderInput, payload)
  errors.value = result.errors ?? {}
  if (!result.data) return
  isSaving.value = true
  try {
    const saved = await adminFetch<{ code: string; total: number }>('/api/admin/orders/platform', { method: 'POST', body: payload })
    uiStore.showToast(`Đã lưu đơn ${form.externalCode} (${saved.code})`)
    // Ready for the next one: keep the fee, start again from now
    Object.assign(form, blank(form.feePercent))
    lines.value = []
    await refreshToday()
    codeInput.value?.focus()
  } catch (e) {
    errors.value = apiFieldErrors(e)
    formError.value = Object.keys(errors.value).length ? '' : apiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>
