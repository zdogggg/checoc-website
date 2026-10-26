<template>
  <div class="pt-28 pb-20 min-h-screen bg-[var(--color-cream)]">
    <div class="container mx-auto max-w-md px-4">
      <form class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100" novalidate @submit.prevent="lookup">
        <h1 class="font-heading text-2xl font-bold text-brand-dark-green mb-1">Tra cứu đơn hàng</h1>
        <p class="text-sm text-gray-500 mb-6">Nhập mã đơn (VD: CC1001) và số điện thoại bạn đã dùng khi đặt hàng.</p>

        <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5" for="lookup-code">Mã đơn hàng</label>
        <input id="lookup-code" v-model="form.code" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase font-mono mb-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold" placeholder="CC1001">

        <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5" for="lookup-phone">Số điện thoại</label>
        <input id="lookup-phone" v-model="form.phone" type="tel" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold" placeholder="0988123456">

        <p v-if="message" class="text-sm text-red-600 mb-4">{{ message }}</p>
        <button type="submit" class="w-full bg-brand-dark-green text-brand-cream font-bold py-3 rounded-full hover:bg-[#1a4132] transition-colors disabled:opacity-60" :disabled="isLoading">
          {{ isLoading ? 'Đang tìm...' : 'Xem đơn hàng' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Tra cứu đơn hàng — Chè Cốc' })

const form = reactive({ code: '', phone: '' })
const message = ref('')
const isLoading = ref(false)

async function lookup() {
  message.value = ''
  isLoading.value = true
  try {
    const { trackingToken } = await $fetch<{ trackingToken: string }>('/api/orders/lookup', { method: 'POST', body: form })
    await navigateTo(`/orders/${trackingToken}`)
  } catch (error) {
    message.value = apiErrorMessage(error, 'Không tìm thấy đơn hàng')
  } finally {
    isLoading.value = false
  }
}
</script>
