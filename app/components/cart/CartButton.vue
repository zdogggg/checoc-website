<template>
  <button @click="uiStore.toggleCartDrawer" class="relative hover:text-brand-peach transition-colors flex items-center justify-center w-10 h-10">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
    <span v-if="cartStore.totalItems > 0" class="absolute top-1 right-0 bg-brand-peach text-brand-dark-green text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
      {{ cartStore.totalItems }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

const cartStore = useCartStore()
const uiStore = useUiStore()
</script>
