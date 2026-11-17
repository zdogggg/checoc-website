<template>
  <div class="pt-28 sm:pt-32 pb-20 min-h-screen bg-[var(--color-cream)]">
    <div class="container mx-auto max-w-4xl px-4 sm:px-6 text-brand-dark-green">
      <h1 class="font-heading text-3xl sm:text-4xl font-bold mb-3">Về Chè Cốc</h1>
      <p class="text-lg text-gray-700 mb-10 max-w-2xl">
        Chè Cốc là quán chè và đồ ăn vặt ở {{ SHOP.address.city }}. Món được nấu mới mỗi ngày, bạn ghé quán hoặc đặt online để quán giao tận nơi.
      </p>

      <div class="grid gap-6 sm:grid-cols-2">
        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 class="font-heading text-xl font-bold mb-3">Quán bán gì</h2>
          <p class="text-gray-600 mb-4">Chè truyền thống, chè Thái, chè khúc bạch và các món ăn vặt. Mỗi ly chè đều chọn được độ ngọt, lượng đá và thêm topping theo ý bạn.</p>
          <NuxtLink to="/products" class="font-bold underline">Xem thực đơn →</NuxtLink>
        </section>

        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 class="font-heading text-xl font-bold mb-3">Đặt online thế nào</h2>
          <ul class="text-gray-600 space-y-2 list-disc pl-5">
            <li>Chọn món, nhập địa chỉ trong {{ DELIVERY_CITY }} rồi đặt, không cần tạo tài khoản.</li>
            <li>Trả tiền mặt khi nhận hàng<template v-if="bankReady"> hoặc chuyển khoản qua mã QR</template>.</li>
            <li>Theo dõi đơn bằng đường link quán gửi sau khi đặt.</li>
          </ul>
        </section>

        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 class="font-heading text-xl font-bold mb-3">Tích điểm, đổi quà</h2>
          <p class="text-gray-600 mb-4">Mỗi đơn hoàn tất được cộng điểm, đủ điểm thì trừ thẳng vào tiền món ở lần đặt sau. Khách quen còn được lên hạng để tích điểm nhanh hơn.</p>
          <NuxtLink to="/account" class="font-bold underline">Tài khoản & điểm thưởng →</NuxtLink>
        </section>

        <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 class="font-heading text-xl font-bold mb-3">Ghé quán</h2>
          <ul class="text-gray-600 space-y-2">
            <li class="flex gap-2"><AppIcon name="pin" class="mt-1 shrink-0" /><a :href="SHOP_MAP_URL" target="_blank" rel="noopener" class="underline">{{ SHOP_ADDRESS_LINE }}</a></li>
            <li class="flex gap-2"><AppIcon name="clock" class="mt-1 shrink-0" />Mở cửa {{ SHOP_HOURS_LABEL }}</li>
            <li class="flex gap-2"><AppIcon name="phone" class="mt-1 shrink-0" /><a :href="`tel:${SHOP.phone}`" class="underline">{{ SHOP.phone }}</a> (gọi hoặc Zalo)</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const bankReady = isBankConfigured(useRuntimeConfig().public.bank)

useSeoMeta({
  title: 'Về chúng tôi — Chè Cốc',
  description: `${SHOP.description} Địa chỉ: ${SHOP_ADDRESS_LINE}.`,
})
</script>
