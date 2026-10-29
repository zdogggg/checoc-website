# Chè Cốc

Website bán chè & đồ ăn vặt — Nuxt 4, Pinia, Tailwind CSS.
Lộ trình backend / CRUD / ERP / CRM: [docs/plan-crud-erp-crm.md](docs/plan-crud-erp-crm.md).

## Chạy bằng Docker (khuyên dùng)

```bash
cp .env.example .env
docker compose up -d --build
```

- Website: http://localhost:3005
- Trang quản trị: http://localhost:3005/admin
- PostgreSQL: `localhost:5433` (user / pass / db: `checoc`)

Migration tự chạy khi server khởi động. Lần đầu, nạp dữ liệu mẫu (thực đơn, tuỳ chọn, mã giảm giá)
và tạo tài khoản chủ quán từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`:

```bash
docker compose exec frontend npm run db:seed
```

Seed chạy lại an toàn: thực đơn chỉ được nạp vào DB trống, tài khoản admin không bị ghi đè mật khẩu.

Sau khi `package.json` thay đổi, phải build lại image **và** làm mới volume `node_modules`
(nếu không container vẫn dùng bộ package cũ):

```bash
docker compose up -d --build --renew-anon-volumes
```

Không chạy `nuxi build` / `nuxi cleanup` trên máy host trong lúc container dev đang chạy —
thư mục `.nuxt` được dùng chung qua bind mount.

## Chạy trực tiếp trên máy

Cần Node `^22.21` hoặc `>=24.11` (Nuxt 4.6 không chạy dev được với Node 22.14).

```bash
npm install
npm run dev
```

## Lệnh hữu ích

| Lệnh | Việc |
|------|------|
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run typecheck` | Kiểm tra kiểu TypeScript (chạy trong container: `docker compose exec frontend npm run typecheck`) |
| `npm run format` | Prettier |
| `npm test` | Vitest (`tests/`) |
| `npm run build` | Build production vào `.output/` |
| `npm run db:generate` | Sinh migration mới sau khi sửa `server/db/schema.ts` |
| `npm run db:seed` | Nạp dữ liệu mẫu + tạo tài khoản chủ quán |
| `npm run db:studio` | Mở Drizzle Studio để xem dữ liệu |

## Cấu trúc backend

- `server/db/schema.ts` — bảng dữ liệu (Drizzle ORM, PostgreSQL); migration trong `server/db/migrations/`
- `server/api/` — API công khai (`/api/products`, `/api/categories`, `/api/options`, `/api/coupons/validate`,
  `/api/orders` đặt hàng, `/api/orders/:token` theo dõi đơn, `/api/orders/lookup` tra cứu bằng mã đơn + SĐT)
- `server/api/admin/` — API quản trị, cần đăng nhập; chỉ `owner` / `manager` được sửa thực đơn
- `shared/` — kiểu dữ liệu, Zod schema và hàm tính giá dùng chung cho client và server

## Đơn hàng

- Server tự tính lại toàn bộ giá từ thực đơn hiện tại; client không gửi giá.
- Khu vực giao hàng (TP.HCM, danh sách quận) nằm ở `shared/utils/delivery.ts`; thanh toán chỉ cho chọn các khu vực này
  và API đặt hàng từ chối mọi khu vực khác. Thông tin quán (SĐT, địa chỉ, giờ mở cửa, link mạng xã hội) ở
  `shared/utils/site.ts`.
- Mã đơn tuần tự (`CC1001`, ...) để đọc qua điện thoại; khách theo dõi đơn qua link có token ngẫu nhiên.
- Trạng thái: chờ xác nhận → đã xác nhận → đang chuẩn bị → đang giao → hoàn tất (huỷ được ở mọi bước trước hoàn tất,
  bắt buộc ghi lý do; huỷ đơn trả lại lượt dùng mã giảm giá). Đơn COD tự chuyển "đã thanh toán" khi hoàn tất.
- Chuyển khoản VietQR: cấu hình `NUXT_PUBLIC_BANK_*` trong `.env`; quán xác nhận đã nhận tiền thủ công trong trang đơn.
- Thông báo đơn mới: trang admin tự kiểm tra mỗi 20 giây (badge, tiếng chuông, toast); thêm Telegram nếu cấu hình
  `NUXT_TELEGRAM_*`.
- Giờ hiển thị luôn theo múi giờ của quán (Asia/Ho_Chi_Minh).

## Khách hàng & tích điểm (CRM)

- Mỗi số điện thoại là một khách hàng, tự tạo khi đặt đơn (không bắt buộc đăng ký); địa chỉ giao được lưu lại.
- Quy tắc điểm và hạng nằm trong `shared/utils/loyalty.ts`: 1.000đ tiền món = 1 điểm (Bạc ×1,2, Vàng ×1,5),
  cộng khi đơn hoàn tất; 1 điểm = 50đ khi đổi, từ 100 điểm, tối đa 50% tiền món; huỷ đơn hoàn lại điểm đã dùng.
  Mọi thay đổi điểm được ghi vào `loyalty_ledger`.
- Khách đăng nhập bằng mã OTP (`/account`) để xem đơn, điểm và **dùng điểm** khi thanh toán:
  - **Email qua Resend** (`server/utils/mail.ts`, cấu hình `NUXT_RESEND_API_KEY` + `NUXT_MAIL_FROM`). Khách nhập email
    (không bắt buộc) lúc đặt hàng; email chỉ được **gắn vào khách khi đơn đó hoàn tất** (quán đã giao tới đúng chủ SĐT),
    không ghi đè email đã có, và mỗi email chỉ thuộc một khách. Email chưa gắn nhận câu trả lời giống hệt nhưng không
    có mã, để form không lộ ai là khách của quán.
  - **SMS** (tuỳ chọn, để sau): cấu hình `NUXT_SMS_PROVIDER` và bổ sung code gửi tin trong `server/utils/sms.ts`.
  - Ở môi trường dev, kênh chưa cấu hình hiện mã ngay trên màn hình. Ở production, kênh chưa cấu hình bị ẩn.
- Admin `/admin/customers`: phân khúc (khách mới, thân thiết, thường xuyên, sắp rời bỏ, đã lâu không mua), lọc theo
  hạng và sinh nhật trong tháng, xuất CSV; hồ sơ khách có đơn hàng, lịch sử điểm, điều chỉnh điểm có lý do,
  ghi chú chăm sóc, nhãn và tặng mã giảm giá riêng (chỉ dùng được với SĐT của khách đó).

## Kho, giá vốn & chi phí (ERP)

- **Nguyên liệu** (`/admin/inventory`): tồn kho, mức tối thiểu, giá vốn bình quân gia quyền (cập nhật mỗi lần nhận
  hàng). Mọi thay đổi tồn được ghi vào `stock_movements` (nhập hàng, dùng cho đơn, kiểm kho, hao hụt).
- **Định mức**: khai báo nguyên liệu cho 1 phần trong trang sửa món, và cho từng tuỳ chọn (topping, đường, đá) ở trang
  "Đường · Đá · Topping". Khi đơn **hoàn tất**, kho tự trừ theo định mức và giá vốn được lưu vào đơn (`orders.cogs`).
  Kho được phép âm (món đã giao) và hiện đỏ để kiểm lại.
- **Tự tắt món**: khi một nguyên liệu không đủ cho 1 phần, món tự chuyển "tạm hết"; khi nhập hàng / kiểm kho đủ lại thì
  tự mở bán. Món do người tắt tay không bị tự bật lại.
- **Nhập hàng** (`/admin/purchases`): lập phiếu (chờ nhận hàng) → "Đã nhận hàng" để cộng kho; phiếu đã nhận không sửa được.
- **Chi phí & lãi lỗ** (`/admin/expenses`): chi phí vận hành theo tháng; doanh thu, giá vốn, lãi gộp, lợi nhuận ròng
  tính trên đơn hoàn tất. Logic tính toán thuần nằm ở `shared/utils/inventory.ts`.

## Báo cáo (`/admin/reports`)

- Chọn khoảng ngày (hôm nay, 7/30/90 ngày, tháng này, tháng trước hoặc tự chọn, tối đa 366 ngày); mọi số liệu so với
  kỳ trước cùng độ dài.
- Doanh thu, số đơn, giá trị trung bình/đơn, lãi gộp, tỉ lệ huỷ, khách mới / quay lại; biểu đồ doanh thu theo ngày và
  số đơn theo giờ (có chế độ xem bảng); món bán chạy, theo danh mục, phương thức thanh toán, khách mua nhiều nhất.
- Xuất CSV theo đơn hàng hoặc theo món (mở được bằng Excel).
- Quy ước chung cho báo cáo, lãi lỗ tháng và Tổng quan: doanh thu = tiền món sau giảm giá, **không gồm phí ship**,
  theo ngày đặt (giờ Việt Nam). Báo cáo và lãi lỗ chỉ tính đơn đã hoàn tất; Tổng quan là số "đang chạy" nên tính cả
  đơn chưa hoàn tất (trừ đơn huỷ).

## Tài khoản & nhật ký (chủ quán)

- `/admin/users`: thêm nhân viên / quản lý, đổi vai trò, khoá tài khoản (có hiệu lực ngay, kể cả phiên đang mở),
  đặt lại mật khẩu. Không tự khoá chính mình; luôn còn ít nhất một chủ quán.
- `/admin/audit`: mọi thao tác ghi dữ liệu trong trang quản trị và các lần đăng nhập (kể cả thất bại), kèm IP.

## Web app cài lên điện thoại (PWA)

- `public/manifest.webmanifest` + icon trong `public/icons/`: khách bấm "Thêm vào Màn hình chính" (iPhone: nút Chia sẻ
  trong Safari) là có biểu tượng Chè Cốc, mở toàn màn hình.
- Service worker `public/sw.js` (chỉ đăng ký ở production): lưu sẵn file build và ảnh món để mở nhanh; trang luôn lấy
  từ mạng (giá, tình trạng món, tài khoản luôn mới); mất mạng thì hiện `public/offline.html`. Đổi `VERSION` trong
  `sw.js` khi sửa cách cache.
- **Thông báo đẩy** theo từng đơn: trang theo dõi đơn có nút "Bật thông báo"; mỗi lần quán đổi trạng thái, khách nhận
  thông báo kể cả khi đã đóng trang. Trên iPhone chỉ hoạt động khi mở từ màn hình chính (iOS 16.4 trở lên).
  Cấu hình `NUXT_PUBLIC_VAPID_PUBLIC_KEY`, `NUXT_VAPID_PRIVATE_KEY`, `NUXT_VAPID_SUBJECT`
  (`npx web-push generate-vapid-keys`, tạo một lần và giữ nguyên). Đăng ký bị xoá khi đơn hoàn tất hoặc huỷ; server
  chỉ gửi tới dịch vụ push của trình duyệt (Google, Apple, Mozilla, Microsoft).

## SEO

- `robots.txt` và `sitemap.xml` sinh động (`server/routes/`), sitemap gồm các trang chính và mọi món đang bán.
- Canonical, Open Graph cho mọi trang; JSON-LD `Restaurant` ở trang chủ và `Product` ở trang món
  (thông tin quán trong `shared/utils/site.ts`). Trang riêng tư (admin, thanh toán, theo dõi đơn) có `noindex`.
- `NUXT_PUBLIC_INDEXABLE=false` cho bản staging để chặn công cụ tìm kiếm.

## Production

Deploy lên VPS bằng `docker-compose.prod.yml` (Caddy HTTPS, PostgreSQL, backup hằng ngày): xem
[docs/deploy.md](docs/deploy.md). Kiểm tra sống: `GET /api/health`.
