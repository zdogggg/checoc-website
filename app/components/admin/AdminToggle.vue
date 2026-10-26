<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="inline-flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="relative w-10 h-6 rounded-full transition-colors shrink-0"
      :class="modelValue ? 'bg-emerald-600' : 'bg-gray-300'"
    >
      <span
        class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        :class="modelValue ? 'translate-x-4' : ''"
      />
    </span>
    <span v-if="label" class="text-brand-dark-green">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string; disabled?: boolean }>()
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>
