<template>
  <div v-if="order" class="ticket">
    <h1>CHÈ CỐC</h1>
    <p class="center">Phiếu {{ order.status === 'pending' ? 'đơn mới' : 'bếp / giao hàng' }}</p>
    <p class="center big">{{ order.code }}</p>
    <p class="center">{{ formatDateTime(order.createdAt) }}</p>
    <hr>
    <div v-for="item in order.items" :key="item.id" class="item">
      <p class="row"><strong>{{ item.quantity }} × {{ item.productName }}</strong><span>{{ formatVnd(item.lineTotal) }}</span></p>
      <p class="sub">{{ [item.sugar, item.ice].filter(Boolean).join(' · ') }}</p>
      <p v-if="item.toppings.length" class="sub">+ {{ item.toppings.map(t => t.name).join(', ') }}</p>
      <p v-if="item.note" class="sub">* {{ item.note }}</p>
    </div>
    <hr>
    <p class="row"><span>Tạm tính</span><span>{{ formatVnd(order.subtotal) }}</span></p>
    <p class="row"><span>Phí giao</span><span>{{ formatVnd(order.shippingFee) }}</span></p>
    <p v-if="order.discount" class="row"><span>Giảm ({{ order.couponCode }})</span><span>-{{ formatVnd(order.discount) }}</span></p>
    <p class="row big"><span>TỔNG</span><span>{{ formatVnd(order.total) }}</span></p>
    <p class="row"><span>{{ order.paymentMethod === 'cod' ? 'Thu tiền mặt (COD)' : 'Chuyển khoản' }}</span><span>{{ PAYMENT_STATUS_LABELS[order.paymentStatus] }}</span></p>
    <hr>
    <p><strong>{{ order.customerName }}</strong> · {{ order.customerPhone }}</p>
    <p>{{ order.address }}, {{ order.district }}, {{ order.city }}</p>
    <p v-if="order.note">Ghi chú: {{ order.note }}</p>
    <hr>
    <p class="center">Cảm ơn quý khách!</p>
    <button type="button" class="no-print" @click="print">In lại</button>
  </div>
</template>

<script setup lang="ts">
import type { AdminOrder } from '#shared/types/orders'

definePageMeta({ layout: false, middleware: 'admin' })

const route = useRoute()
const { data: order } = await useFetch<AdminOrder>(`/api/admin/orders/${route.params.id}`)
useHead({ title: () => `In ${order.value?.code ?? ''}` })

const print = () => window.print()
onMounted(() => setTimeout(print, 300))
</script>

<style scoped>
/* Sized for 80mm thermal printers; also fine on A4 */
.ticket {
  width: 72mm;
  margin: 0 auto;
  padding: 4mm 0;
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.35;
  color: #000;
  background: #fff;
}
h1 {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
}
.center {
  text-align: center;
}
.big {
  font-size: 16px;
  font-weight: 700;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.item {
  margin-bottom: 4px;
}
.sub {
  padding-left: 12px;
  font-size: 11px;
}
hr {
  border: 0;
  border-top: 1px dashed #000;
  margin: 6px 0;
}
.no-print {
  display: block;
  margin: 12px auto 0;
  padding: 6px 16px;
  border: 1px solid #000;
  border-radius: 999px;
}
@media print {
  .no-print {
    display: none;
  }
  @page {
    margin: 0;
  }
}
</style>
