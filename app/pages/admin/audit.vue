<template>
  <div>
    <div class="mb-6">
      <h1 class="font-heading text-3xl font-bold">Nhật ký thao tác</h1>
      <p class="text-gray-500 text-sm">Mọi thay đổi dữ liệu trong trang quản trị và các lần đăng nhập, mới nhất trước.</p>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <label class="text-sm font-semibold" for="audit-user">Người thao tác</label>
      <select id="audit-user" v-model="userId" class="admin-input w-auto">
        <option :value="undefined">Tất cả</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} · {{ u.email }}</option>
      </select>
    </div>

    <div class="admin-card overflow-x-auto" :class="{ 'opacity-60': status === 'pending' }">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người thao tác</th>
            <th>Việc</th>
            <th>Kết quả</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data?.items ?? []" :key="row.id">
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDateTime(row.at) }}</td>
            <td class="text-sm">{{ row.userEmail || '—' }}</td>
            <td class="text-sm font-medium">{{ row.action }}</td>
            <td class="text-sm whitespace-nowrap">
              <span v-if="row.ok" class="text-emerald-700">Thành công</span>
              <span v-else class="text-red-600">Bị từ chối ({{ row.status }})</span>
            </td>
            <td class="text-xs font-mono text-gray-500">{{ row.ip }}</td>
          </tr>
          <tr v-if="!data?.items.length">
            <td colspan="5" class="text-center text-gray-500 py-10">Chưa có thao tác nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pageCount > 1" class="flex items-center justify-end gap-3 mt-4 text-sm">
      <button type="button" class="admin-btn-secondary" :disabled="page <= 1" @click="page--">Trước</button>
      <span class="tabular-nums">Trang {{ page }} / {{ pageCount }}</span>
      <button type="button" class="admin-btn-secondary" :disabled="page >= pageCount" @click="page++">Sau</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AuditPage {
  total: number
  pageSize: number
  items: { id: number; at: string; userEmail: string; action: string; ok: boolean; status: number; ip: string }[]
}

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nhật ký thao tác' })

const page = ref(1)
const userId = ref<number | undefined>()
watch(userId, () => (page.value = 1))

const [{ data: users }, { data, status }] = await Promise.all([
  useFetch<{ id: number; name: string; email: string }[]>('/api/admin/users', { default: () => [] }),
  useFetch<AuditPage>('/api/admin/audit', { query: { page, userId } }),
])
const pageCount = computed(() => (data.value ? Math.ceil(data.value.total / data.value.pageSize) : 1))
</script>
