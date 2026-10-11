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
            <span class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
            <span class="hidden sm:inline">1. Chọn món</span>
          </div>
          <div class="flex-grow h-0.5 bg-green-200 mx-2 sm:mx-4"></div>
          <div class="flex items-center gap-2" :class="isOrderPlaced ? 'text-green-700' : 'text-brand-gold'">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="isOrderPlaced ? 'bg-green-100 text-green-700' : 'bg-brand-dark-green text-brand-cream'">
              {{ isOrderPlaced ? '✓' : '2' }}
            </span>
            <span>2. Thông tin & Thanh toán</span>
          </div>
          <div class="flex-grow h-0.5 mx-2 sm:mx-4" :class="isOrderPlaced ? 'bg-green-200' : 'bg-gray-200'"></div>
          <div class="flex items-center gap-2" :class="isOrderPlaced ? 'text-brand-gold' : 'text-gray-400'">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs" :class="isOrderPlaced ? 'bg-brand-dark-green text-brand-cream font-bold' : 'bg-gray-100 text-gray-400'">
              3
            </span>
            <span class="hidden sm:inline">3. Hoàn tất</span>
          </div>
        </div>
      </div>

      <!-- STATE 1: Empty Cart -->
      <div v-if="cartStore.items.length === 0 && !isOrderPlaced" class="bg-white rounded-3xl p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm border border-gray-100">
        <div class="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
          🥣
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

      <!-- STATE 2: Order Placed Success View -->
      <div v-else-if="isOrderPlaced" class="bg-white rounded-3xl p-6 sm:p-12 max-w-3xl mx-auto shadow-md border border-brand-gold/20">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-3 py-1 rounded-full">
            Đặt hàng thành công
          </span>
          <h2 class="font-heading text-2xl sm:text-4xl font-bold text-brand-dark-green mt-3 mb-2">
            Cảm ơn bạn đã đặt chè tại Chè Cốc!
          </h2>
          <p class="text-gray-600 text-xs sm:text-sm max-w-md mx-auto">
            Mã đơn hàng: <strong class="text-brand-dark-green font-mono text-base font-bold">{{ placedOrderCode }}</strong>
          </p>
        </div>

        <!-- Estimated Timeline -->
        <div class="bg-brand-cream/50 rounded-2xl p-5 mb-8 border border-brand-gold/15">
          <h4 class="font-bold text-sm text-brand-dark-green mb-4 flex items-center gap-2">
            <span>🛵</span> Tiến độ giao hàng ước tính (khoảng 30 phút)
          </h4>
          <div class="grid grid-cols-4 text-center text-xs gap-2">
            <div class="flex flex-col items-center">
              <span class="w-7 h-7 rounded-full bg-brand-dark-green text-brand-cream flex items-center justify-center text-xs font-bold mb-1 shadow-sm">1</span>
              <span class="font-bold text-brand-dark-green">Đã nhận đơn</span>
              <span class="text-[10px] text-gray-400">Vừa xong</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-7 h-7 rounded-full bg-brand-gold text-brand-dark-green flex items-center justify-center text-xs font-bold mb-1 animate-pulse shadow-sm">2</span>
              <span class="font-bold text-brand-gold">Chuẩn bị món</span>
              <span class="text-[10px] text-gray-500">Đang nấu mới</span>
            </div>
            <div class="flex flex-col items-center opacity-60">
              <span class="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold mb-1">3</span>
              <span class="font-medium text-gray-600">Đang giao</span>
              <span class="text-[10px] text-gray-400">Shipper nhận</span>
            </div>
            <div class="flex flex-col items-center opacity-60">
              <span class="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold mb-1">4</span>
              <span class="font-medium text-gray-600">Hoàn tất</span>
              <span class="text-[10px] text-gray-400">Thưởng thức</span>
            </div>
          </div>
        </div>

        <!-- Order Summary Recap -->
        <div class="border border-gray-100 rounded-2xl p-5 mb-8 bg-gray-50/50 text-xs sm:text-sm">
          <h4 class="font-bold text-brand-dark-green mb-3 pb-2 border-b border-gray-200">
            Thông tin người nhận
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
            <div><strong>Người nhận:</strong> {{ form.fullName }}</div>
            <div><strong>Số điện thoại:</strong> {{ form.phone }}</div>
            <div class="sm:col-span-2"><strong>Địa chỉ:</strong> {{ form.address }}, {{ form.district }}, {{ form.city }}</div>
            <div v-if="form.note" class="sm:col-span-2"><strong>Ghi chú:</strong> "{{ form.note }}"</div>
            <div><strong>Phương thức thanh toán:</strong> {{ paymentMethodLabel(form.paymentMethod) }}</div>
            <div><strong>Tổng tiền thanh toán:</strong> <span class="font-bold text-brand-gold text-base">{{ placedOrderTotal.toLocaleString('vi-VN') }}đ</span></div>
          </div>
        </div>

        <!-- Support Info & Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div class="text-xs text-gray-500 text-center sm:text-left">
            Cần hỗ trợ gấp? Gọi ngay hotline: <strong class="text-brand-dark-green text-sm">1900 8888</strong> (08:00 - 22:30)
          </div>
          <NuxtLink 
            to="/" 
            @click="resetOrderState"
            class="bg-brand-dark-green text-brand-cream font-bold px-6 py-3 rounded-full hover:bg-[#1a4132] transition-colors text-xs sm:text-sm shadow-md"
          >
            Quay về trang chủ
          </NuxtLink>
        </div>
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
                  type="radio" 
                  value="cod" 
                  v-model="form.paymentMethod" 
                  class="mt-1 w-4 h-4 text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green"
                />
                <div class="flex-grow">
                  <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                    <span>💵</span>
                    <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Thanh toán trực tiếp bằng tiền mặt cho tài xế giao hàng khi nhận cốc chè mát lạnh.
                  </p>
                </div>
              </label>

              <!-- Method 2: VietQR / Bank Transfer -->
              <label 
                class="flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer"
                :class="form.paymentMethod === 'vietqr' ? 'border-brand-gold bg-brand-cream/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input 
                  type="radio" 
                  value="vietqr" 
                  v-model="form.paymentMethod" 
                  class="mt-1 w-4 h-4 text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green"
                />
                <div class="flex-grow">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                      <span>🏦</span>
                      <span>Chuyển khoản VietQR (Mọi ngân hàng)</span>
                    </div>
                    <span class="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                      Khuyên dùng
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Quét mã QR tự động điền số tiền và nội dung, xác nhận trong 10 giây qua 30+ ngân hàng.
                  </p>

                  <!-- Dynamic QR Preview Box when selected -->
                  <div v-if="form.paymentMethod === 'vietqr'" class="mt-4 p-4 bg-white rounded-xl border border-brand-gold/30 flex flex-col sm:flex-row items-center gap-4">
                    <div class="w-32 h-32 bg-gray-100 rounded-lg p-1.5 shrink-0 border border-gray-200 flex items-center justify-center">
                      <img 
                        :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CHECOC_${cartStore.orderTotal}_${encodeURIComponent(form.fullName || 'KHACH')}`" 
                        alt="QR Ngân hàng" 
                        class="w-full h-full object-contain"
                      />
                    </div>
                    <div class="text-xs space-y-1 text-gray-600">
                      <div>Ngân hàng: <strong class="text-brand-dark-green">MB Bank (Quân Đội)</strong></div>
                      <div>Số tài khoản: <strong class="text-brand-dark-green font-mono text-sm">8888 6688 9999</strong></div>
                      <div>Tên thụ hưởng: <strong class="text-brand-dark-green">CHE COC VIET NAM</strong></div>
                      <div>Số tiền: <strong class="text-brand-gold font-bold text-sm">{{ cartStore.orderTotal.toLocaleString('vi-VN') }}đ</strong></div>
                      <div>Nội dung CK: <strong class="text-brand-dark-green font-mono bg-yellow-100 px-1 py-0.5 rounded">CHECOC {{ form.phone || 'DONHANG' }}</strong></div>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Method 3: MoMo -->
              <label 
                class="flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer"
                :class="form.paymentMethod === 'momo' ? 'border-brand-gold bg-brand-cream/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input 
                  type="radio" 
                  value="momo" 
                  v-model="form.paymentMethod" 
                  class="mt-1 w-4 h-4 text-brand-dark-green focus:ring-brand-gold accent-brand-dark-green"
                />
                <div class="flex-grow">
                  <div class="flex items-center gap-2 font-bold text-sm text-brand-dark-green">
                    <span class="w-5 h-5 rounded-md bg-[#A50064] text-white flex items-center justify-center text-[10px] font-bold">M</span>
                    <span>Ví điện tử MoMo</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Thanh toán tiện lợi qua ứng dụng MoMo trên điện thoại.
                  </p>
                </div>
              </label>
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
                      +{{ item.options.toppings.map((t: any) => t.name).join(', ') }}
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
                  @click="handleApplyCoupon" 
                  class="bg-brand-dark-green text-brand-cream px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1a4132] transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>

              <!-- Applied coupon chip -->
              <div v-if="cartStore.appliedCoupon" class="flex items-center justify-between bg-green-50 text-green-800 text-xs px-3 py-1.5 rounded-xl border border-green-200">
                <div class="flex items-center gap-1.5">
                  <span>🎟️</span>
                  <strong>{{ cartStore.appliedCoupon.code }}:</strong>
                  <span>{{ cartStore.appliedCoupon.description }}</span>
                </div>
                <button @click="cartStore.removeCoupon" class="text-green-700 hover:text-red-600 font-bold ml-2">✕</button>
              </div>

              <div v-if="couponMessage" class="text-xs mt-1.5" :class="couponMessageSuccess ? 'text-green-600' : 'text-red-500'">
                {{ couponMessage }}
              </div>
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

              <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-brand-dark-green">
                <span class="font-heading font-bold text-base">Tổng thanh toán:</span>
                <span class="font-heading font-bold text-2xl text-brand-gold">
                  {{ cartStore.orderTotal.toLocaleString('vi-VN') }}đ
                </span>
              </div>
            </div>

            <!-- Place Order CTA -->
            <button 
              @click="submitOrder" 
              class="w-full bg-brand-dark-green text-brand-cream py-4 rounded-2xl font-bold hover:bg-[#1a4132] transition-all transform active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base group"
            >
              <span>Xác nhận đặt hàng</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>

            <!-- Trust badges -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-around text-center text-[10px] text-gray-400">
              <span class="flex items-center gap-1">🔒 Bảo mật thông tin</span>
              <span>•</span>
              <span class="flex items-center gap-1">🥣 Chế biến sạch</span>
              <span>•</span>
              <span class="flex items-center gap-1">⚡ Giao nóng/lạnh chuẩn</span>
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

useHead({
  title: 'Thanh Toán Đơn Hàng — Chè Cốc',
  meta: [
    { name: 'description', content: 'Xác nhận thông tin giao hàng và thanh toán nhanh chóng, an toàn tại Chè Cốc.' }
  ]
})

const cartStore = useCartStore()
const uiStore = useUiStore()

const isOrderPlaced = ref(false)
const placedOrderCode = ref('')
const placedOrderTotal = ref(0)

const form = reactive({
  fullName: '',
  phone: '',
  city: 'Hà Nội',
  district: 'Cầu Giấy',
  address: '',
  note: '',
  paymentMethod: 'vietqr'
})

const errors = reactive({
  fullName: '',
  phone: '',
  address: ''
})

const couponCodeInput = ref('')
const couponMessage = ref('')
const couponMessageSuccess = ref(false)

const handleApplyCoupon = () => {
  couponMessage.value = ''
  const res = cartStore.applyCoupon(couponCodeInput.value)
  couponMessage.value = res.message
  couponMessageSuccess.value = res.success
  if (res.success) {
    uiStore.showToast(res.message)
    couponCodeInput.value = ''
  }
}

const paymentMethodLabel = (val: string) => {
  if (val === 'cod') return 'Tiền mặt khi nhận hàng (COD)'
  if (val === 'vietqr') return 'Chuyển khoản VietQR MB Bank'
  if (val === 'momo') return 'Ví điện tử MoMo'
  return val
}

const validate = () => {
  let valid = true
  errors.fullName = ''
  errors.phone = ''
  errors.address = ''

  if (!form.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên của bạn'
    valid = false
  }

  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  if (!form.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại nhận hàng'
    valid = false
  } else if (!phoneRegex.test(form.phone.trim().replace(/\s+/g, ''))) {
    errors.phone = 'Số điện thoại chưa đúng định dạng (VD: 0988123456)'
    valid = false
  }

  if (!form.address.trim()) {
    errors.address = 'Vui lòng cung cấp địa chỉ số nhà/tòa nhà chi tiết'
    valid = false
  }

  return valid
}

const submitOrder = () => {
  if (!validate()) {
    uiStore.showToast('Vui lòng kiểm tra lại thông tin nhận hàng', 'warning')
    return
  }

  // Generate random order ID
  const randomNum = Math.floor(10000 + Math.random() * 90000)
  placedOrderCode.value = `CC-${randomNum}`
  placedOrderTotal.value = cartStore.orderTotal

  // Set order placed state
  isOrderPlaced.value = true
  uiStore.showToast(`Đặt hàng thành công! Mã đơn: ${placedOrderCode.value}`)

  // Clear cart
  cartStore.clearCart()

  // Scroll to top
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const resetOrderState = () => {
  isOrderPlaced.value = false
  placedOrderCode.value = ''
  placedOrderTotal.value = 0
}
</script>
