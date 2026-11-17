<template>
  <section class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-sm text-gray-600">
    <h2 class="font-heading text-lg font-bold text-brand-dark-green mb-3">Cách tích & dùng điểm</h2>
    <ul class="space-y-2 list-disc pl-5">
      <li>Mỗi {{ formatVnd(VND_PER_POINT_EARNED) }} tiền món (không tính phí ship) = 1 điểm, cộng khi đơn hoàn tất.</li>
      <li>
        Hạng thành viên tính theo tổng tiền món đã mua (không tính phí ship). Hạng
        <template v-for="(t, i) in TIERS.slice(1)" :key="t.tier">
          <strong>{{ t.label }}</strong> (từ {{ formatVnd(t.minSpent) }}) tích ×{{ t.earnMultiplier }}<template v-if="i < TIERS.length - 2">, </template>
        </template>.
      </li>
      <li>Đổi điểm khi thanh toán: 1 điểm = {{ formatVnd(VND_PER_POINT_REDEEMED) }}, từ {{ MIN_POINTS_TO_REDEEM }} điểm, tối đa {{ MAX_REDEEM_SHARE * 100 }}% tiền món.</li>
      <li>Đơn bị huỷ sẽ được hoàn lại số điểm đã dùng. Đơn đã giao mà được hoàn trả thì điểm tích từ đơn đó bị trừ lại.</li>
      <li>Điểm hết hạn nếu {{ POINTS_EXPIRE_AFTER_MONTHS }} tháng liền bạn không được cộng thêm điểm nào.</li>
    </ul>
  </section>
</template>
