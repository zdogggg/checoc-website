<template>
  <div class="admin-card p-4">
    <div class="text-xs font-semibold text-gray-500">{{ label }}</div>
    <div class="text-2xl font-semibold mt-1 text-brand-dark-green">{{ value }}</div>
    <div v-if="delta != null" class="mt-1 text-xs inline-flex items-center gap-1" :class="good ? 'text-emerald-700' : 'text-red-600'">
      <span aria-hidden="true">{{ delta > 0 ? '▲' : delta < 0 ? '▼' : '' }}</span>
      <span>{{ delta > 0 ? '+' : '' }}{{ Math.round(delta * 100) }}%</span>
      <span class="text-gray-500">so với {{ compareLabel }}</span>
    </div>
    <div v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
// Stat tile: label, value (proportional figures), optional signed delta vs a named period.
// Delta colour = direction x whether up is good, always with an arrow and a sign.
const props = withDefaults(
  defineProps<{
    label: string
    value: string
    delta?: number | null
    // false when a rise is bad (e.g. cancellation rate)
    upIsGood?: boolean
    compareLabel?: string
    hint?: string
  }>(),
  { delta: null, upIsGood: true, compareLabel: 'kỳ trước', hint: '' }
)

const good = computed(() => (props.delta ?? 0) === 0 || (props.delta! > 0) === props.upIsGood)
</script>
