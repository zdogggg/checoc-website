<template>
  <div class="pt-28 sm:pt-32 pb-20 min-h-screen bg-[var(--color-cream)]">
    <article class="container mx-auto max-w-3xl px-4 sm:px-6 text-brand-dark-green">
      <h1 class="font-heading text-3xl sm:text-4xl font-bold mb-2">Chính sách bảo mật</h1>
      <p class="text-sm text-gray-500 mb-8">Cập nhật ngày {{ UPDATED }}</p>

      <div class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 space-y-8 text-gray-700 leading-relaxed">
        <p>
          Trang này nói rõ {{ SHOP.name }} lưu những thông tin gì của bạn khi bạn đặt món trên website, dùng để làm gì
          và bạn có thể yêu cầu gì với thông tin đó.
        </p>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">1. Thông tin quán lưu</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Khi bạn đặt hàng:</strong> họ tên, số điện thoại, địa chỉ giao hàng, ghi chú cho đơn, và email nếu bạn nhập.</li>
            <li><strong>Tài khoản tích điểm:</strong> số điện thoại hoặc email để đăng nhập, sinh nhật nếu bạn tự điền, lịch sử đơn hàng và điểm.</li>
            <li><strong>Thông báo trạng thái đơn:</strong> nếu bạn bật, trình duyệt cấp cho quán một địa chỉ để gửi thông báo về đúng đơn đó. Địa chỉ này bị xoá khi đơn giao xong hoặc bị huỷ.</li>
            <li><strong>Trên máy của bạn:</strong> giỏ hàng được lưu trong trình duyệt của bạn. Đăng nhập dùng một cookie phiên. Website không dùng cookie quảng cáo hay công cụ theo dõi.</li>
          </ul>
        </section>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">2. Quán dùng thông tin để</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>Làm món, giao hàng và gọi cho bạn khi cần xác nhận đơn.</li>
            <li>Gửi mã đăng nhập, cộng và trừ điểm thưởng.</li>
            <li>Gửi mã giảm giá riêng, nếu quán có chương trình dành cho bạn.</li>
            <li>Chống đặt đơn giả và dò mã giảm giá.</li>
          </ul>
          <p class="mt-3">Quán không bán thông tin của bạn và không dùng nó để quảng cáo cho bên khác.</p>
        </section>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">3. Ai khác thấy thông tin</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Nhân viên quán và người giao hàng:</strong> tên, số điện thoại và địa chỉ của đơn họ phụ trách.</li>
            <li v-if="telegramOn"><strong>Telegram:</strong> mỗi đơn mới được báo vào nhóm Telegram nội bộ của quán, gồm mã đơn, tên, số điện thoại, địa chỉ giao, món, số tiền và ghi chú, để nhân viên nhận đơn ngay.</li>
            <li><strong>Dịch vụ gửi email</strong> (Resend): địa chỉ email và mã đăng nhập, chỉ để gửi thư cho bạn.</li>
            <li><strong>Dịch vụ thông báo của trình duyệt</strong> (Google, Apple, Mozilla): chỉ khi bạn bật thông báo đơn hàng.</li>
            <li><strong>Mã QR chuyển khoản</strong> được tạo bởi VietQR từ số tiền và mã đơn, không kèm tên hay số điện thoại của bạn.</li>
          </ul>
        </section>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">4. Lưu trong bao lâu</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>Đơn hàng được giữ để đối chiếu doanh thu và giải quyết khiếu nại.</li>
            <li>Mã đăng nhập hết hạn sau 5 phút và được xoá sau 1 ngày.</li>
            <li>Điểm thưởng hết hạn nếu {{ POINTS_EXPIRE_AFTER_MONTHS }} tháng liền bạn không được cộng thêm điểm nào.</li>
          </ul>
        </section>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">5. Quyền của bạn</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>Xem và sửa tên, sinh nhật, email, xoá địa chỉ đã lưu trong trang <NuxtLink to="/account" class="underline">Tài khoản</NuxtLink>.</li>
            <li>Yêu cầu quán cho biết đang lưu gì về bạn, bằng cách gọi hoặc nhắn Zalo cho quán.</li>
            <li>
              Yêu cầu xoá thông tin cá nhân, cũng qua điện thoại hoặc Zalo. Quán hỏi lại để chắc đó đúng là bạn, rồi xoá tài khoản,
              điểm thưởng, địa chỉ đã lưu và xoá trắng tên, số điện thoại, email, địa chỉ trên các đơn cũ. Đơn hàng vẫn được giữ
              ở dạng không còn thông tin cá nhân, vì quán cần chúng để đối chiếu doanh thu. Nếu bạn còn đơn đang giao, quán xoá sau
              khi đơn đó xong. Điểm chưa dùng sẽ mất khi xoá.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="font-heading text-xl font-bold text-brand-dark-green mb-3">6. Liên hệ</h2>
          <p>
            {{ SHOP.name }} · {{ SHOP_ADDRESS_LINE }}<br>
            Điện thoại / Zalo: <a :href="`tel:${SHOP.phone}`" class="underline">{{ SHOP.phone }}</a>
          </p>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
const UPDATED = '17/11/2026'

// The Telegram line only applies when order alerts are set up. Decided during server rendering
// (the bot token is server-only config) and handed to the browser as a plain yes/no.
const telegramOn = useState('privacy:telegram', () => Boolean(useRuntimeConfig().telegramChatId))

useSeoMeta({
  title: 'Chính sách bảo mật — Chè Cốc',
  description: `${SHOP.name} lưu những thông tin gì khi bạn đặt món, dùng để làm gì và cách yêu cầu xem hoặc xoá.`,
})
</script>
