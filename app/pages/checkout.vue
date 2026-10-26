<template>
  <div class="pt-24 sm:pt-28 pb-20 min-h-screen bg-[var(--color-cream)]">
    <!-- Header Container -->
    <div class="container mx-auto max-w-6xl px-4 sm:px-6">
      
      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <NuxtLink to="/" class="hover:text-brand-dark-green transition-colors">Trang chủ</NuxtLink>
        <span>/</span>
        <NuxtLink to="/products" class="hover:text-brand-dark-green transition-colors">Thực đơn</NuxtLink>
        <span>/</span>
        <span class="text-brand-dark-green font-semibold">Thanh toán đơn hàng</span>
      </nav>

      <!-- Step Indicator Bar -->
      <div class="bg-white rounded-2xl p-4 sm:p-6 mb-8 border border-gray-100 shadow-sm">
        <div class="flex items-center justify-between max-w-2xl mx-auto text-xs sm:text-sm font-semibold">
          <div class="flex items-center gap-2 text-green-700">
            <span class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs"><AppIcon name="check" /></span>
            <span class="hidden sm:inline">1. Chọn món</span>
          </div>
          <div class="flex-grow h-0.5 bg-green-200 mx-2 sm:mx-4"></div>
          <div class="flex items-center gap-2 text-brand-gold">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-brand-dark-green text-brand-cream">
              2
            </span>
            <span>2. Thông tin & Thanh toán</span>
          </div>
          <div class="flex-grow h-0.5 mx-2 sm:mx-4 bg-gray-200"></div>
          <div class="flex items-center gap-2 text-gray-400">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-400">
              3
            </span>
            <span class="hidden sm:inline">3. Hoàn tất</span>
          </div>
        </div>
      </div>

      <!-- STATE 0: Cart not yet restored from localStorage -->
      <div v-if="!cartStore.isHydrated" class="py-24 text-center text-gray-500">
        Đang tải giỏ hàng...
      </div>

      <!-- STATE 1: Empty Cart -->
      <div v-else-if="cartStore.items.length === 0" class="bg-white rounded-3xl p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm border border-gray-100">
        <div class="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner text-brand-dark-green">
          <AppIcon name="bowl" />
        </div>
        <h2 class="font-heading text-2xl font-bold text-brand-dark-green mb-3">Giỏ hàng của bạn đang trống</h2>
        <p class="text-gray-500 text-sm mb-8 leading-relaxed">
          Bạn chưa chọn món chè nào để thanh toán. Hãy ghé qua thực đơn để chọn những cốc chè ngọt lành tươi mới nhé!
        </p>
        <NuxtLink 
          to="/products" 
          class="bg-brand-dark-green text-brand-cream font-bold px-8 py-3.5 rounded-full hover:bg-[#1a4132] transition-colors inline-flex items-center gap-2 text-sm shadow-md"
        >
          Khám phá thực đơn ngay
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <!-- STATE 3: Active Checkout Form & Order Summary -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Shipping & Payment Details (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Box 1: Receiver Information -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-brand-cream text-brand-dark-green flex items-center justify-center text-xs font-bold">1</span>
              <span>Thông tin nhận hàng</span>
            </h2>

            <div class="space-y-4">
              <!-- Signed-in shopper: saved addresses; otherwise an invitation to sign in for points -->
              <div v-if="account" class="bg-brand-cream/50 rounded-2xl p-3.5 text-xs text-brand-dark-green">
                <p>
                  Đã đăng nhập: <strong>{{ account.name || account.phone }}</strong> · {{ account.phone }} ·
                  <strong>{{ account.points.toLocaleString('vi-VN') }} điểm</strong>
                </p>
                <div v-if="account.addresses.length" class="flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="a in account.addresses"
                    :key="a.id"
                    type="button"
                    class="px-3 py-1.5 rounded-full border border-brand-gold/40 bg-white hover:border-brand-gold text-left"
                    @click="useAddress(a)"
                  >
                    <AppIcon name="pin" class="inline -mt-0.5 text-brand-gold" /> {{ a.address }}, {{ a.district }}
                  </button>
                </div>
              </div>
              <p v-else-if="smsReady" class="text-xs text-gray-600 bg-brand-cream/50 rounded-2xl p-3.5">
                Đã có tài khoản?
                <NuxtLink to="/account?redirect=/checkout" class="font-bold underline text-brand-dark-green">Đăng nhập bằng số điện thoại</NuxtLink>
                để điền nhanh địa chỉ và dùng điểm thưởng. Không đăng nhập bạn vẫn được tích điểm theo số điện thoại.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                    Họ và tên <span class="text-red-500">*</span>
                  </label>
                  <input 
                    v-model="form.fullName" 
                    type="text" 
                    placeholder="VD: Nguyễn Văn Anh"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                  />
                  <span v-if="errors.fullName" class="text-xs text-red-500 mt-1 block">{{ errors.fullName }}</span>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                    Số điện thoại <span class="text-red-500">*</span>
                  </label>
                  <input 
                    v-model="form.phone" 
                    type="tel" 
                    placeholder="VD: 0988123456"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                  />
                  <span v-if="errors.phone" class="text-xs text-red-500 mt-1 block">{{ errors.phone }}</span>
                </div>
              </div>

              <!-- City and District -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <select 
                    v-model="form.city" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                    Quận / Huyện <span class="text-red-500">*</span>
                  </label>
                  <select 
                    v-model="form.district" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
                  >
                    <option value="Hoàn Kiếm">Quận Hoàn Kiếm</option>
                    <option value="Đống Đa">Quận Đống Đa</option>
                    <option value="Ba Đình">Quận Ba Đình</option>
                    <option value="Hai Bà Trưng">Quận Hai Bà Trưng</option>
                    <option value="Cầu Giấy">Quận Cầu Giấy</option>
                    <option value="Tây Hồ">Quận Tây Hồ</option>
                    <option value="Thanh Xuân">Quận Thanh Xuân</option>
                    <option value="Nam Từ Liêm">Quận Nam Từ Liêm</option>
                    <option value="Quận 1">Quận 1 (TP.HCM)</option>
                    <option value="Quận 3">Quận 3 (TP.HCM)</option>
                    <option value="Bình Thạnh">Quận Bình Thạnh (TP.HCM)</option>
                  </select>
                </div>
              </div>

              <!-- Address -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                  Địa chỉ giao hàng cụ thể <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="form.address" 
                  type="text" 
                  placeholder="Số nhà, ngõ/ngách, tên đường hoặc tên tòa nhà, phòng..."
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                />
                <span v-if="errors.address" class="text-xs text-red-500 mt-1 block">{{ errors.address }}</span>
              </div>

              <!-- Note -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-dark-green mb-1.5">
                  Ghi chú giao hàng (Tùy chọn)
                </label>
                <input 
                  v-model="form.note" 
                  type="text" 
                  placeholder="VD: Giao giờ hành chính, để lễ tân, gọi trước khi đến..."
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
          </div>

          <!-- Box 2: Payment Method Selector -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-brand-cream text-brand-dark-green flex items-center justify-center text-xs font-bold">2</span>
              <span>Phương thức thanh toán</span>
            </h2>

            <div class="space-y-3">
              <!-- Method 1: COD -->
              <label 
                class="flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer"
                :class="form.paymentMethod === 'cod' ? 'border-brand-gold bg-brand-cream/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input 
                  v-model="form.paymentMethod" 
                  type="radio" 
                  value="cod" 
                  class="mt-1 w-4 h-4 text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green"
                />
                <div class="flex-grow">
                  <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                    <AppIcon name="banknote" class="text-base text-brand-gold" />
                    <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Thanh toán trực tiếp bằng tiền mặt cho tài xế giao hàng khi nhận cốc chè mát lạnh.
                  </p>
                </div>
              </label>

              <!-- Method 2: VietQR / Bank Transfer (only when the shop bank account is configured) -->
              <label 
                v-if="bankReady"
                class="flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer"
                :class="form.paymentMethod === 'vietqr' ? 'border-brand-gold bg-brand-cream/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input 
                  v-model="form.paymentMethod" 
                  type="radio" 
                  value="vietqr" 
                  class="mt-1 w-4 h-4 text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green"
                />
                <div class="flex-grow">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                      <AppIcon name="bank" class="text-base text-brand-gold" />
                      <span>Chuyển khoản VietQR (Mọi ngân hàng)</span>
                    </div>
                    <span class="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                      Khuyên dùng
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Quét mã QR tự động điền số tiền và nội dung, xác nhận trong 10 giây qua 30+ ngân hàng.
                  </p>

                  <p v-if="form.paymentMethod === 'vietqr'" class="text-xs text-brand-dark-green mt-2 font-medium">
                    Mã QR kèm đúng số tiền và nội dung chuyển khoản sẽ hiện ngay sau khi bạn đặt hàng.
                  </p>
                </div>
              </label>

              <!-- Method 3: MoMo (integration planned, not available yet) -->
              <div class="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 bg-gray-50 opacity-70" aria-disabled="true">
                <input type="radio" disabled class="mt-1 w-4 h-4" />
                <div class="flex-grow">
                  <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                    <span class="w-5 h-5 rounded-md bg-[#A50064] text-white flex items-center justify-center text-[10px] font-bold">M</span>
                    <span>Ví điện tử MoMo</span>
                    <span class="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">Sắp có</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Thanh toán tiện lợi qua ứng dụng MoMo trên điện thoại.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary & Confirmation Box (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 sticky top-24">
            <h3 class="font-heading text-xl font-bold text-brand-dark-green mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Đơn hàng của bạn</span>
              <span class="text-xs font-medium text-gray-500 font-sans">({{ cartStore.totalItems }} món)</span>
            </h3>

            <!-- Item List -->
            <div class="space-y-3.5 max-h-72 overflow-y-auto pr-1 mb-6 divide-y divide-gray-100">
              <div 
                v-for="item in cartStore.items" 
                :key="item.cartKey"
                class="pt-3 first:pt-0 flex gap-3 items-center justify-between text-xs"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <img :src="item.image" :alt="item.name" class="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" />
                  <div class="min-w-0">
                    <h5 class="font-bold text-brand-dark-green truncate text-xs">{{ item.name }}</h5>
                    <div class="text-[11px] text-gray-500 truncate">
                      {{ item.options.sugar }} • {{ item.options.ice }}
                    </div>
                    <div v-if="item.options.toppings?.length" class="text-[10px] text-brand-gold truncate">
                      +{{ item.options.toppings.map(t => t.name).join(', ') }}
                    </div>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-bold text-brand-dark-green">{{ (item.price * item.quantity).toLocaleString('vi-VN') }}đ</div>
                  <div class="text-[10px] text-gray-400">SL: x{{ item.quantity }}</div>
                </div>
              </div>
            </div>

            <!-- Coupon Input Box -->
            <div class="mb-6 pb-6 border-b border-gray-100">
              <div class="flex gap-2 mb-2">
                <input 
                  v-model="couponCodeInput" 
                  type="text" 
                  placeholder="Mã voucher: CHECOC10, FREESHIP..." 
                  class="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <button 
                  class="bg-brand-dark-green text-brand-cream px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1a4132] transition-colors shrink-0 disabled:opacity-60"
                  :disabled="isApplyingCoupon"
                  @click="handleApplyCoupon"
                >
                  {{ isApplyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng' }}
                </button>
              </div>

              <!-- Applied coupon chip -->
              <div v-if="cartStore.appliedCoupon" class="flex items-center justify-between bg-green-50 text-green-800 text-xs px-3 py-1.5 rounded-xl border border-green-200">
                <div class="flex items-center gap-1.5">
                  <AppIcon name="ticket" class="text-sm" />
                  <strong>{{ cartStore.appliedCoupon.code }}:</strong>
                  <span>{{ cartStore.appliedCoupon.description }}</span>
                </div>
                <button class="text-green-700 hover:text-red-600 font-bold ml-2" aria-label="Bỏ mã giảm giá" @click="cartStore.removeCoupon"><AppIcon name="x" /></button>
              </div>

              <div v-if="couponMessage" class="text-xs mt-1.5" :class="couponMessageSuccess ? 'text-green-600' : 'text-red-500'">
                {{ couponMessage }}
              </div>
            </div>

            <!-- Loyalty points -->
            <div v-if="account && account.points > 0" class="mb-6 pb-6 border-b border-gray-100 text-xs">
              <label v-if="redeemablePoints > 0 && phoneMatchesAccount" class="flex items-start gap-2.5 cursor-pointer">
                <input v-model="usePoints" type="checkbox" class="mt-0.5 w-4 h-4 accent-brand-dark-green">
                <span>
                  Dùng <strong>{{ redeemablePoints.toLocaleString('vi-VN') }} điểm</strong>
                  để giảm <strong class="text-red-600">{{ formatVnd(pointsValue(redeemablePoints)) }}</strong>
                  <span class="block text-gray-500">Bạn đang có {{ account.points.toLocaleString('vi-VN') }} điểm</span>
                </span>
              </label>
              <p v-else-if="!phoneMatchesAccount" class="text-gray-500">
                Điểm thưởng chỉ dùng được khi đặt bằng số điện thoại của tài khoản ({{ account.phone }}).
              </p>
              <p v-else class="text-gray-500">
                Bạn có {{ account.points.toLocaleString('vi-VN') }} điểm. Cần từ {{ MIN_POINTS_TO_REDEEM }} điểm và đơn đủ lớn để đổi.
              </p>
            </div>

            <!-- Pricing Breakdown -->
            <div class="space-y-2.5 text-xs text-gray-600 mb-6">
              <div class="flex justify-between">
                <span>Tạm tính tiền chè:</span>
                <span class="font-bold text-brand-dark-green">{{ cartStore.subtotal.toLocaleString('vi-VN') }}đ</span>
              </div>

              <div class="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span v-if="cartStore.shippingFee === 0" class="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                  Miễn phí giao hàng
                </span>
                <span v-else class="font-bold text-gray-700">
                  {{ cartStore.shippingFee.toLocaleString('vi-VN') }}đ
                </span>
              </div>

              <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-red-600">
                <span>Giảm giá khuyến mãi:</span>
                <span class="font-bold">-{{ cartStore.discountAmount.toLocaleString('vi-VN') }}đ</span>
              </div>

              <div v-if="pointsDiscount > 0" class="flex justify-between text-red-600">
                <span>Dùng {{ pointsToUse.toLocaleString('vi-VN') }} điểm:</span>
                <span class="font-bold">-{{ pointsDiscount.toLocaleString('vi-VN') }}đ</span>
              </div>

              <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-brand-dark-green">
                <span class="font-heading font-bold text-base">Tổng thanh toán:</span>
                <span class="font-heading font-bold text-2xl text-brand-gold">
                  {{ grandTotal.toLocaleString('vi-VN') }}đ
                </span>
              </div>
            </div>

            <!-- Place Order CTA -->
            <p v-if="submitError" class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
              {{ submitError }}
            </p>
            <button 
              class="w-full bg-brand-dark-green text-brand-cream py-4 rounded-2xl font-bold hover:bg-[#1a4132] transition-all transform active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base group disabled:opacity-60 disabled:cursor-wait" 
              :disabled="isSubmitting"
              @click="submitOrder"
            >
              <span>{{ isSubmitting ? 'Đang gửi đơn...' : 'Xác nhận đặt hàng' }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>

            <!-- Trust badges -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-around text-center text-[10px] text-gray-400">
              <span class="flex items-center gap-1"><AppIcon name="lock" /> Bảo mật thông tin</span>
              <span>•</span>
              <span class="flex items-center gap-1"><AppIcon name="shield" /> Chế biến sạch</span>
              <span>•</span>
              <span class="flex items-center gap-1"><AppIcon name="zap" /> Giao nóng/lạnh chuẩn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import { orderInput } from '#shared/schemas/orders'
import type { PlacedOrder } from '#shared/types/orders'
import type { CustomerAddressView } from '#shared/types/customers'

useHead({
  title: 'Thanh Toán Đơn Hàng — Chè Cốc',
  meta: [
    { name: 'description', content: 'Xác nhận thông tin giao hàng và thanh toán nhanh chóng, an toàn tại Chè Cốc.' }
  ]
})

const cartStore = useCartStore()
const uiStore = useUiStore()
const config = useRuntimeConfig()

const bankReady = isBankConfigured(config.public.bank)

const { data: accountData } = await useCustomerAccount()
const account = computed(() => accountData.value.account)
const smsReady = computed(() => accountData.value.smsReady)

const form = reactive({
  fullName: '',
  phone: '',
  city: 'Hà Nội',
  district: 'Cầu Giấy',
  address: '',
  note: '',
  paymentMethod: (bankReady ? 'vietqr' : 'cod') as 'cod' | 'vietqr'
})

// Prefill from the signed-in account (most recently used address first)
const useAddress = (a: CustomerAddressView) => Object.assign(form, { city: a.city, district: a.district, address: a.address })
watch(
  account,
  (a) => {
    if (!a) return
    if (!form.fullName) form.fullName = a.name
    if (!form.phone) form.phone = a.phone
    if (!form.address && a.addresses[0]) useAddress(a.addresses[0])
  },
  { immediate: true }
)

// Points: the server re-checks all of this; here it only drives the checkbox and the totals
const usePoints = ref(false)
const phoneMatchesAccount = computed(() => !!account.value && normalizePhone(form.phone) === account.value.phone)
const redeemablePoints = computed(() =>
  account.value ? maxRedeemablePoints(account.value.points, cartStore.subtotal - cartStore.discountAmount) : 0
)
const pointsToUse = computed(() => (usePoints.value && phoneMatchesAccount.value ? redeemablePoints.value : 0))
const pointsDiscount = computed(() => pointsValue(pointsToUse.value))
const grandTotal = computed(() => Math.max(0, cartStore.orderTotal - pointsDiscount.value))

const errors = reactive({
  fullName: '',
  phone: '',
  address: ''
})

const couponCodeInput = ref('')
const couponMessage = ref('')
const couponMessageSuccess = ref(false)

const isApplyingCoupon = ref(false)

const handleApplyCoupon = async () => {
  if (isApplyingCoupon.value) return
  couponMessage.value = ''
  isApplyingCoupon.value = true
  const res = await cartStore.applyCoupon(couponCodeInput.value, form.phone)
  isApplyingCoupon.value = false
  couponMessage.value = res.message
  couponMessageSuccess.value = res.success
  if (res.success) {
    uiStore.showToast(res.message)
    couponCodeInput.value = ''
  }
}

const isSubmitting = ref(false)
const submitError = ref('')

// Prices are not sent: the server prices every line from the current menu
const buildOrder = () => ({
  ...form,
  couponCode: cartStore.appliedCoupon?.code ?? null,
  pointsToUse: pointsToUse.value,
  items: cartStore.items.map(item => ({
    productId: item.id,
    quantity: item.quantity,
    sugar: item.options.sugar,
    ice: item.options.ice,
    toppings: item.options.toppings.map(t => t.name),
    note: item.options.note ?? ''
  }))
})

const showFieldErrors = (fieldErrors: FieldErrors) => {
  errors.fullName = fieldErrors.fullName ?? ''
  errors.phone = fieldErrors.phone ?? ''
  errors.address = fieldErrors.address ?? ''
}

const submitOrder = async () => {
  if (isSubmitting.value) return
  submitError.value = ''

  const result = validateForm(orderInput, buildOrder())
  showFieldErrors(result.errors ?? {})
  if (!result.data) {
    uiStore.showToast('Vui lòng kiểm tra lại thông tin nhận hàng', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    const placed = await $fetch<PlacedOrder>('/api/orders', { method: 'POST', body: result.data })
    uiStore.showToast(`Đặt hàng thành công! Mã đơn: ${placed.code}`)
    await navigateTo({ path: `/orders/${placed.trackingToken}`, query: { new: '1' } })
    // The balance changed if points were used
    if (pointsToUse.value) refreshNuxtData('account:me')
    // Cleared after leaving the page, so the empty-cart state never flashes
    cartStore.clearCart()
  } catch (error) {
    showFieldErrors(apiFieldErrors(error))
    submitError.value = apiErrorMessage(error, 'Không gửi được đơn hàng, vui lòng thử lại')
    // The coupon was rejected (expired, used up, minimum not met): drop it so the totals are honest
    if (apiStatus(error) === 400 && cartStore.appliedCoupon) {
      cartStore.removeCoupon()
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
