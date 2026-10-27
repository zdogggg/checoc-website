<template>
  <figure class="relative">
    <figcaption class="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 class="font-bold">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-gray-500">{{ subtitle }}</p>
      </div>
      <button type="button" class="text-xs font-semibold text-gray-500 hover:text-brand-dark-green underline shrink-0" @click="showTable = !showTable">
        {{ showTable ? 'Xem biểu đồ' : 'Xem dạng bảng' }}
      </button>
    </figcaption>

    <!-- Table twin: every value is reachable without hovering -->
    <div v-if="showTable" class="overflow-x-auto max-h-72 overflow-y-auto">
      <table class="admin-table">
        <thead>
          <tr><th v-for="h in table.headers" :key="h" class="last:text-right">{{ h }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in table.rows" :key="i">
            <td v-for="(cell, j) in row" :key="j" class="tabular-nums" :class="{ 'text-right': j > 0 }">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else ref="container" class="relative w-full select-none" :style="{ height: `${height}px` }">
      <svg v-if="width > 0" :width="width" :height="height" role="group" :aria-label="title">
        <!-- Gridlines + y ticks -->
        <g>
          <template v-for="t in ticks" :key="t">
            <line :x1="PAD.left" :x2="width - PAD.right" :y1="yOf(t)" :y2="yOf(t)" stroke="#ecebe7" stroke-width="1" />
            <text :x="PAD.left - 8" :y="yOf(t)" text-anchor="end" dominant-baseline="middle" class="fill-gray-400 tabular-nums" font-size="11">
              {{ formatTick(t) }}
            </text>
          </template>
        </g>
        <!-- Bars, each with a full-height hit area -->
        <g>
          <g v-for="(d, i) in data" :key="d.key">
            <path v-if="d.value > 0" :d="barPath(i, d.value)" :fill="COLOR" :opacity="active === i ? 0.75 : 1" />
            <rect
              :x="PAD.left + i * band"
              :y="PAD.top"
              :width="band"
              :height="plotHeight"
              fill="transparent"
              tabindex="0"
              role="img"
              class="outline-none cursor-default focus-visible:stroke-brand-gold"
              :aria-label="`${d.label}: ${d.tooltip.join(', ')}`"
              @pointerenter="active = i"
              @pointerleave="active = null"
              @focus="active = i"
              @blur="active = null"
            />
          </g>
        </g>
        <!-- X labels: thinned so they never collide -->
        <g>
          <template v-for="(d, i) in data" :key="d.key">
            <text
              v-if="i % labelEvery === 0"
              :x="PAD.left + i * band + band / 2"
              :y="height - 8"
              text-anchor="middle"
              class="fill-gray-500"
              font-size="11"
            >
              {{ d.shortLabel ?? d.label }}
            </text>
          </template>
        </g>
      </svg>

      <div
        v-if="active !== null && data[active]"
        class="pointer-events-none absolute z-10 rounded-xl bg-brand-dark-green text-brand-cream px-3 py-2 text-xs shadow-lg whitespace-nowrap"
        :style="tooltipStyle"
      >
        <div class="font-bold text-sm">{{ data[active]!.tooltip[0] }}</div>
        <div v-for="(line, k) in data[active]!.tooltip.slice(1)" :key="k" class="text-brand-cream/80">{{ line }}</div>
        <div class="text-brand-cream/60 mt-0.5">{{ data[active]!.label }}</div>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import type { ColumnDatum } from '#shared/types/reports'

// Single-series column chart (one colour, so no legend: the title names the series).
// Bars are capped at 24px with a 4px rounded top; gridlines are solid hairlines.

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    data: ColumnDatum[]
    table: { headers: string[]; rows: (string | number)[][] }
    formatTick?: (n: number) => string
    height?: number
    // Whole-number axis (counts)
    integer?: boolean
  }>(),
  { subtitle: '', formatTick: (n: number) => n.toLocaleString('vi-VN'), height: 240, integer: false }
)

// Validated with the dataviz palette checks (lightness, chroma, contrast on the white card)
const COLOR = '#3B8B63'
const PAD = { top: 12, right: 8, bottom: 28, left: 48 }

const container = ref<HTMLElement | null>(null)
const { width } = useElementSize(container)
const showTable = ref(false)
const active = ref<number | null>(null)

const plotHeight = computed(() => props.height - PAD.top - PAD.bottom)
const band = computed(() => Math.max(1, (width.value - PAD.left - PAD.right) / Math.max(1, props.data.length)))
const scale = computed(() => niceScale(Math.max(0, ...props.data.map((d) => d.value)), 4, props.integer))
const ticks = computed(() => {
  const out: number[] = []
  for (let t = 0; t <= scale.value.max + 1e-9; t += scale.value.step) out.push(t)
  return out
})
const yOf = (v: number) => PAD.top + plotHeight.value * (1 - v / scale.value.max)

// Keep x labels at least ~44px apart
const labelEvery = computed(() => Math.max(1, Math.ceil(44 / band.value)))

function barPath(i: number, value: number) {
  const w = Math.min(24, band.value * 0.7)
  const x = PAD.left + i * band.value + (band.value - w) / 2
  const base = PAD.top + plotHeight.value
  const top = yOf(value)
  const r = Math.min(4, w / 2, base - top)
  // Rounded data-end, square at the baseline
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`
}

const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const center = PAD.left + active.value * band.value + band.value / 2
  const value = props.data[active.value]!.value
  const flip = center > width.value - 140
  return {
    left: `${flip ? center - 12 : center + 12}px`,
    top: `${Math.max(0, yOf(value) - 20)}px`,
    transform: flip ? 'translateX(-100%)' : 'none',
  }
})
</script>
