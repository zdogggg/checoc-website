<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-heading text-3xl font-bold">Món ăn</h1>
        <p class="text-gray-500 text-sm">{{ products?.length ?? 0 }} món trong thực đơn.</p>
      </div>
      <NuxtLink v-if="canEdit" to="/admin/products/new" class="admin-btn-primary">+ Thêm món</NuxtLink>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <input v-model="search" type="search" class="admin-input sm:max-w-xs" placeholder="Tìm theo tên món...">
      <select v-model.number="categoryFilter" class="admin-input sm:max-w-[14rem]">
        <option :value="0">Tất cả danh mục</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
      </select>
      <select v-model="statusFilter" class="admin-input sm:max-w-[12rem]">
        <option value="all">Mọi trạng thái</option>
        <option value="available">Đang bán</option>
        <option value="unavailable">Tạm hết</option>
      </select>
    </div>

    <div class="admin-card overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Món</th>
            <th>Danh mục</th>
            <th class="text-right">Giá</th>
            <th>Nhãn</th>
            <th>Còn hàng</th>
            <th v-if="canEdit" class="w-px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>
              <div class="flex items-center gap-3 min-w-[14rem]">
                <img v-if="p.image" :src="p.image" :alt="p.name" class="w-11 h-11 rounded-xl object-cover bg-gray-100 shrink-0">
                <div v-else class="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
                <div class="min-w-0">
                  <NuxtLink :to="`/admin/products/${p.id}`" class="font-semibold hover:underline block truncate">{{ p.name }}</NuxtLink>
                  <span class="text-xs text-gray-400 font-mono">{{ p.slug }}</span>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap">
              {{ p.categoryName }}
              <span v-if="!p.categoryActive" class="text-xs text-amber-600 block">danh mục đang ẩn</span>
            </td>
            <td class="text-right tabular-nums whitespace-nowrap">
              {{ formatVnd(p.price) }}
              <span v-if="p.originalPrice" class="block text-xs text-gray-400 line-through">{{ formatVnd(p.originalPrice) }}</span>
            </td>
            <td>
              <span v-if="p.badge" class="text-xs font-semibold px-2 py-1 rounded-full bg-brand-peach/30 whitespace-nowrap">{{ BADGE_LABELS[p.badge] }}</span>
            </td>
            <td>
              <AdminToggle
                :model-value="p.isAvailable"
                :disabled="!canEdit || pendingId === p.id"
                @update:model-value="toggleAvailable(p, $event)"
              />
            </td>
            <td v-if="canEdit" class="whitespace-nowrap text-right">
              <NuxtLink :to="`/admin/products/${p.id}`" class="text-sm font-semibold hover:underline mr-4">Sửa</NuxtLink>
              <button type="button" class="text-sm font-semibold text-red-600 hover:underline" @click="remove(p)">Xoá</button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="text-center text-gray-500 py-10">Không có món nào phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductInput } from '~/utils/adminProducts'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Món ăn' })

type AdminProduct = Product & { sortOrder: number; categoryActive: boolean }

const adminFetch = useAdminApi()
const canEdit = useCanEditCatalog()
const uiStore = useUiStore()
const [{ data: products, refresh }, { data: categories }] = await Promise.all([
  useFetch<AdminProduct[]>('/api/admin/products', { default: () => [] }),
  useFetch<{ id: number; name: string; icon: string }[]>('/api/admin/categories', { default: () => [] }),
])

const search = ref('')
const categoryFilter = ref(0)
const statusFilter = ref<'all' | 'available' | 'unavailable'>('all')
const pendingId = ref<number | null>(null)

const filtered = computed(() => {
  const q = slugify(search.value)
  return products.value.filter(
    (p) =>
      (!q || p.slug.includes(q) || slugify(p.name).includes(q)) &&
      (!categoryFilter.value || p.categoryId === categoryFilter.value) &&
      (statusFilter.value === 'all' || p.isAvailable === (statusFilter.value === 'available'))
  )
})

async function toggleAvailable(p: AdminProduct, value: boolean) {
  pendingId.value = p.id
  try {
    await adminFetch(`/api/admin/products/${p.id}`, { method: 'PUT', body: { ...toProductInput(p), isAvailable: value } satisfies ProductInput })
    p.isAvailable = value
    uiStore.showToast(value ? `${p.name}: đang bán` : `${p.name}: tạm hết`)
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  } finally {
    pendingId.value = null
  }
}

async function remove(p: AdminProduct) {
  if (!confirm(`Xoá món "${p.name}" khỏi thực đơn?`)) return
  try {
    await adminFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
    uiStore.showToast('Đã xoá món')
    await refresh()
  } catch (e) {
    uiStore.showToast(apiErrorMessage(e), 'warning')
  }
}
</script>
