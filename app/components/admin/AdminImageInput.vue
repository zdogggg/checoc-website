<template>
  <div class="flex gap-3 items-start">
    <div class="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl text-gray-300">
      <img v-if="modelValue" :src="modelValue" alt="" class="w-full h-full object-cover">
      <span v-else aria-hidden="true">🖼️</span>
    </div>
    <div class="flex-1 min-w-0 space-y-2">
      <input
        :value="modelValue"
        type="text"
        class="admin-input"
        placeholder="Dán URL ảnh hoặc tải ảnh lên"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <div class="flex items-center gap-2">
        <label class="admin-btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer" :class="{ 'opacity-60 pointer-events-none': isUploading }">
          {{ isUploading ? 'Đang tải...' : 'Tải ảnh lên' }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="sr-only" @change="upload">
        </label>
        <button v-if="modelValue && removable" type="button" class="text-xs text-red-600 hover:underline" @click="$emit('remove')">
          Xoá ảnh
        </button>
      </div>
      <p v-if="error" class="admin-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; removable?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void; (e: 'remove'): void }>()

const adminFetch = useAdminApi()
const isUploading = ref(false)
const error = ref('')

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  error.value = ''
  isUploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const { url } = await adminFetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    emit('update:modelValue', url)
  } catch (e) {
    error.value = apiErrorMessage(e, 'Tải ảnh thất bại')
  } finally {
    isUploading.value = false
  }
}
</script>
