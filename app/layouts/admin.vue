<template>
  <div class="min-h-screen bg-[#F6F4EE] text-brand-dark-green font-sans">
    <!-- Mobile top bar -->
    <header class="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-brand-dark-green text-brand-cream px-4 h-14">
      <button type="button" class="p-2 -ml-2" aria-label="Mở menu" @click="isNavOpen = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <span class="font-heading font-bold">Chè Cốc · Quản trị</span>
      <span class="w-8" />
    </header>

    <!-- Backdrop on mobile -->
    <div v-if="isNavOpen" class="lg:hidden fixed inset-0 z-40 bg-black/40" @click="isNavOpen = false" />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark-green text-brand-cream flex flex-col transition-transform duration-200 lg:translate-x-0"
      :class="isNavOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-6 h-16 flex items-center border-b border-white/10">
        <NuxtLink to="/admin" class="font-heading text-xl font-bold">Chè Cốc</NuxtLink>
        <span class="ml-2 text-[10px] uppercase tracking-widest text-brand-gold font-semibold">Admin</span>
      </div>

      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <div v-for="section in visibleSections" :key="section.title" class="mb-4">
          <p class="px-3 mb-1 text-[10px] uppercase tracking-widest font-semibold text-brand-cream/40">{{ section.title }}</p>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-white/10 text-white' : 'text-brand-cream/70 hover:bg-white/5 hover:text-white'"
          >
            <AppIcon :name="item.icon" :size="18" />
            {{ item.label }}
            <span
              v-if="badgeFor(item.to)"
              class="ml-auto min-w-[1.5rem] text-center text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
              :class="item.to === '/admin/inventory' ? 'bg-red-500 text-white' : 'bg-brand-gold text-brand-dark-green'"
            >
              {{ badgeFor(item.to) }}
            </span>
          </NuxtLink>
        </div>
      </nav>

      <div class="p-4 border-t border-white/10 text-sm">
        <div class="font-semibold truncate">{{ user?.name }}</div>
        <div class="text-brand-cream/60 text-xs truncate mb-3">
          {{ user?.email }} · {{ ROLE_LABELS[user?.role ?? ''] }}
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/" target="_blank" class="flex-1 text-center text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15">
            Xem website
          </NuxtLink>
          <button type="button" class="flex-1 text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15" @click="logout">
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>

    <main class="lg:pl-64">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <slot />
      </div>
    </main>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import AppToast from '~/components/common/AppToast.vue'

const route = useRoute()
const { user, clear } = useUserSession()
const isNavOpen = ref(false)
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

const navSections = [
  {
    title: 'Bán hàng',
    items: [
      { to: '/admin', label: 'Tổng quan', icon: 'dashboard' },
      { to: '/admin/orders', label: 'Đơn hàng', icon: 'receipt' },
      { to: '/admin/customers', label: 'Khách hàng', icon: 'users' },
      { to: '/admin/reports', label: 'Báo cáo', icon: 'chart' },
    ],
  },
  {
    title: 'Thực đơn',
    items: [
      { to: '/admin/products', label: 'Món ăn', icon: 'utensils' },
      { to: '/admin/categories', label: 'Danh mục', icon: 'folder' },
      { to: '/admin/options', label: 'Đường · Đá · Topping', icon: 'sliders' },
      { to: '/admin/coupons', label: 'Mã giảm giá', icon: 'tag' },
    ],
  },
  {
    title: 'Kho & chi phí',
    items: [
      { to: '/admin/inventory', label: 'Kho nguyên liệu', icon: 'package' },
      { to: '/admin/purchases', label: 'Nhập hàng', icon: 'truck' },
      { to: '/admin/suppliers', label: 'Nhà cung cấp', icon: 'store' },
      { to: '/admin/expenses', label: 'Chi phí & lãi lỗ', icon: 'wallet' },
    ],
  },
] as const

// Owner-only section; the API enforces it, this only hides the links
const isOwner = useIsOwner()
const ownerSection = {
  title: 'Hệ thống',
  items: [
    { to: '/admin/users', label: 'Tài khoản', icon: 'key' },
    { to: '/admin/audit', label: 'Nhật ký thao tác', icon: 'history' },
  ],
} as const
const visibleSections = computed(() => (isOwner.value ? [...navSections, ownerSection] : navSections))

const badgeFor = (to: string) =>
  to === '/admin/orders' ? pulse.value?.pending : to === '/admin/inventory' ? pulse.value?.lowStock : 0

const isActive = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))

watch(() => route.path, () => (isNavOpen.value = false))

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/admin/login')
}

// New-order watch: badge with the pending count, plus a chime and a toast when an order arrives
const uiStore = useUiStore()
const { data: pulse, refresh: refreshPulse } = await useFetch<{ pending: number; latestId: number; lowStock: number }>('/api/admin/orders/pulse', {
  key: 'admin:pulse',
})
useIntervalFn(refreshPulse, 20_000)

watch(
  () => pulse.value?.latestId,
  (latest, previous) => {
    if (!latest || !previous || latest <= previous) return
    uiStore.showToast('Có đơn hàng mới!', 'info')
    playChime()
  }
)

function playChime() {
  try {
    const ctx = new AudioContext()
    for (const [i, freq] of [880, 1320].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.4)
    }
  } catch {
    // Audio blocked (no user interaction yet) - the toast and badge still show
  }
}

useHead({
  titleTemplate: (title) => {
    const base = title ? `${title} · Quản trị Chè Cốc` : 'Quản trị Chè Cốc'
    return pulse.value?.pending ? `(${pulse.value.pending}) ${base}` : base
  },
})
</script>
