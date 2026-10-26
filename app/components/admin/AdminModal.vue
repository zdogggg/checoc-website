<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />
      <div
        class="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
          <h2 class="font-heading text-lg font-bold text-brand-dark-green">{{ title }}</h2>
          <button type="button" class="p-1.5 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Đóng" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="px-6 py-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

// Close on Escape
useEventListener('keydown', (e: KeyboardEvent) => {
  if (props.open && e.key === 'Escape') emit('close')
})
</script>
