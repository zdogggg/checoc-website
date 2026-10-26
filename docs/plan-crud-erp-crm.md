# Chè Cốc — Plan hoàn thiện: Backend, CRUD, ERP, CRM

> Viết ngày 26/10/2026, dựa trên code ở commit `71052c2`.
> Bổ sung cho `che-coc-website-plan.md` (bản đó vẫn ghi Nuxt 3 + Laravel; code thực tế là **Nuxt 4**).

---

## 0. Hiện trạng (kết quả soát code)

**Đã có (frontend, chạy bằng mock data):** trang chủ, danh sách + chi tiết sản phẩm, quick view,
giỏ hàng (Pinia + localStorage, có tuỳ chọn đường/đá/topping), checkout có validate, coupon.
`npm run build` chạy thành công, không lỗi.

**Chưa có:** backend, database, đăng nhập, lưu đơn hàng, admin. Toàn bộ dữ liệu nằm trong
`app/utils/mockData.ts`; đặt hàng chỉ sinh mã ngẫu nhiên `CC-xxxxx` rồi xoá giỏ, đơn không được lưu ở đâu cả.

### Lỗi / điểm cần sửa trước khi làm backend

| # | Vị trí | Vấn đề | Cách sửa |
|---|--------|--------|----------|
| 1 | `app/stores/cart.ts:37` | Đọc `localStorage` ngay khi tạo store → server render giỏ rỗng, client render có hàng → **hydration mismatch** (badge giỏ hàng, drawer). | Đọc storage trong `onMounted`/plugin `.client.ts`, hoặc bọc badge bằng `<ClientOnly>`. Dùng `useLocalStorage` của VueUse (đã cài). |
| 2 | `app/pages/checkout.vue:532` | Regex SĐT `/(84\|0[3\|5\|7\|8\|9])+([0-9]{8})\b/` không có `^...$`, và `[3\|5...]` khớp cả ký tự `\|` → chuỗi rác chứa số vẫn qua. | `/^(0\|\+?84)(3\|5\|7\|8\|9)\d{8}$/`. |
| 3 | `app/stores/cart.ts:203` | Mã giảm giá + phí ship + tổng tiền hard-code và tính ở client → ai cũng sửa được. | Khi có backend: server tính lại toàn bộ giá, client chỉ hiển thị. |
| 4 | `app/pages/products/[slug].vue:15` | Slug không tồn tại vẫn trả HTTP 200 (soft 404, xấu cho SEO). | `throw createError({ statusCode: 404 })` khi không có sản phẩm. |
| 5 | `app/stores/cart.ts:175` | `removeItem(id: number)` xoá **mọi biến thể** của cùng món (khác topping). | Chỉ nhận `cartKey`. |
| 6 | `assets/css/tailwind.css` (gốc) | Bản sao thừa — Nuxt 4 dùng `app/assets/...`. | Xoá thư mục `assets/` ở gốc. |
| 7 | `Dockerfile` | Chỉ chạy `npm run dev`, không có bản production. | Multi-stage: build → `node .output/server/index.mjs`. |
| 8 | `package.json` | `pinia`, `@pinia/nuxt`… nằm trong `devDependencies`. | Chuyển sang `dependencies`. |
| 9 | Toàn site | 53 ảnh hotlink Unsplash/pravatar; link mạng xã hội `href="#"`; trang about/contact/news là placeholder. | Tải ảnh thật vào storage, dùng `@nuxt/image`; hoàn thiện nội dung. |
| 10 | Toàn site | Chưa có ESLint/Prettier, chưa có test. | Thêm `@nuxt/eslint`, Vitest cho store, Playwright cho flow đặt hàng. |

---

## 1. Quyết định kiến trúc

**Khuyến nghị: giữ 1 stack TypeScript, không tách Laravel.**

```
Nuxt 4 (1 repo)
├── app/            → website khách hàng  (/)
├── app/pages/admin → trang quản trị       (/admin, layout riêng)
└── server/         → API Nitro (/api/*)
        │
     Drizzle ORM
        │
   PostgreSQL 16  (hoặc MySQL 8)    + Redis (session, rate-limit — tuỳ chọn)
```

Lý do: một ngôn ngữ, chung type giữa client/server (Zod schema dùng lại cho validate form + API),
một container deploy, đủ cho quy mô 1–vài chi nhánh. Nếu team quen PHP thì Laravel vẫn ổn —
**data model ở mục 2 giữ nguyên**, chỉ đổi tầng API.

Thư viện đề xuất: `drizzle-orm` + `drizzle-kit` (migration), `zod`, `nuxt-auth-utils` (session cookie),
`@nuxt/image`, `@tanstack/vue-table` cho bảng admin, `chart.js`/`echarts` cho dashboard.

---

## 2. Data model

### Bán hàng (core)
```
categories        id, name, slug, icon, sort, is_active
products          id, category_id, slug, name, short_desc, description, price, original_price,
                  image, badge, is_available, is_featured, prep_time, deleted_at
product_images    id, product_id, url, sort
option_groups     id, name (Đường / Đá / Topping), type (single|multi)
options           id, group_id, name, price_delta, is_default
product_option_groups  product_id, group_id
orders            id, code, customer_id, branch_id, status, payment_status, payment_method,
                  subtotal, discount, shipping_fee, total, address snapshot, note, created_at
order_items       id, order_id, product_id, name_snapshot, unit_price, qty, options_json
order_status_logs id, order_id, from, to, by_user_id, at
payments          id, order_id, provider, amount, txn_ref, status, raw_payload, paid_at
coupons           id, code, type (percent|fixed|free_ship), value, min_order, max_discount,
                  starts_at, ends_at, usage_limit, per_customer_limit, segment_id?
coupon_usages     id, coupon_id, customer_id, order_id
reviews           id, product_id, customer_id, order_id, rating, comment, status (pending|approved)
```

### ERP (kho – nguyên liệu – giá vốn)
```
ingredients       id, name, unit (g, ml, cái), min_stock, cost_per_unit
recipes           product_id, ingredient_id, quantity          ← định mức: 1 cốc chè = 40g đậu xanh…
option_recipes    option_id, ingredient_id, quantity           ← topping cũng trừ kho
suppliers         id, name, phone, address, note
purchase_orders   id, supplier_id, branch_id, status (draft|ordered|received|cancelled), total
purchase_items    id, po_id, ingredient_id, qty, unit_cost
stock_movements   id, branch_id, ingredient_id, type (in|out|adjust|waste), qty, ref_type, ref_id, at
branches          id, name, address, phone (để sẵn, ban đầu 1 chi nhánh)
expenses          id, branch_id, category (điện, mặt bằng, lương…), amount, date, note
```
Tồn kho = tổng `stock_movements` (không lưu cột số lượng rời rạc → luôn đối soát được).
Khi đơn chuyển `completed` → sinh `out` theo `recipes`; huỷ đơn → sinh movement đảo.

### CRM
```
customers         id, phone (unique, khoá chính để nhận diện), name, email, birthday,
                  tier, points, total_spent, order_count, last_order_at, tags[], note
addresses         id, customer_id, label, city, district, detail, is_default
loyalty_ledger    id, customer_id, delta, reason (order|redeem|birthday|manual), ref_id
segments          id, name, rule_json   (VD: "chưa mua 30 ngày", "chi > 1tr")
campaigns         id, segment_id, coupon_id, channel (zalo|sms|email), sent_at, stats
customer_notes    id, customer_id, by_user_id, content, at
```
Khách **không bắt buộc đăng ký**: checkout bằng SĐT → tự tạo/ghép `customers`.
Đăng nhập (OTP SĐT hoặc email) chỉ để xem lịch sử đơn & điểm.

### Nhân sự / phân quyền
```
users             id, name, email, password_hash, role (owner|manager|staff|kitchen), branch_id
audit_logs        id, user_id, action, entity, entity_id, diff_json, at
```

---

## 3. Lộ trình triển khai

Mỗi phase kết thúc bằng thứ dùng được thật. Ước lượng cho 1 dev full-time.

### Phase A — Dọn nền (2–3 ngày)
- Sửa 10 mục ở bảng mục 0.
- Thêm ESLint, Prettier, Vitest; `.env.example`.
- Docker: thêm service `db` (Postgres) vào `docker-compose.yml`, Dockerfile multi-stage.

**Xong khi:** build sạch, không còn hydration warning, có CI chạy lint + test.

### Phase B — Backend + CRUD sản phẩm (1–1,5 tuần)
- `server/db/schema.ts` (Drizzle) cho nhóm *Bán hàng*, migration, seed từ `mockData.ts`.
- API công khai: `GET /api/categories`, `GET /api/products?category=&q=`, `GET /api/products/:slug`.
- Frontend: thay import `mockData` bằng `useFetch` (component giữ nguyên, chỉ đổi nguồn dữ liệu).
- Auth admin: `nuxt-auth-utils`, middleware `server/middleware/admin.ts` + route middleware `admin`.
- **Admin CRUD:** danh mục, sản phẩm (upload ảnh, giá, ẩn/hiện, nổi bật), nhóm tuỳ chọn/topping, coupon.

**Xong khi:** thêm/sửa/xoá món trong `/admin` → hiện ngay trên website.

### Phase C — Đơn hàng thật (1 tuần)
- `POST /api/orders`: server tự tính giá từ DB + kiểm tra coupon, lưu snapshot, sinh mã đơn tuần tự.
- Trang tra cứu đơn `/orders/:code` (khách xem trạng thái).
- **Admin đơn hàng:** danh sách realtime (polling/SSE), lọc theo trạng thái, đổi trạng thái
  `pending → confirmed → preparing → shipping → completed / cancelled`, in phiếu bếp.
- Thông báo đơn mới cho quán (âm thanh trên admin + Telegram/Zalo bot).
- Thanh toán: COD + VietQR (đối soát thủ công hoặc qua webhook Casso/SePay) trước; MoMo/VNPay sau.

**Xong khi:** khách đặt → admin thấy đơn → xử lý xong → khách thấy trạng thái.

### Phase D — CRM (1 tuần)
- Tạo/ghép `customers` theo SĐT khi đặt hàng; cập nhật `total_spent`, `order_count`, `last_order_at`.
- Đăng nhập khách (OTP), trang "Tài khoản": lịch sử đơn, sổ địa chỉ, điểm.
- Tích điểm (VD 1.000đ = 1 điểm), hạng thành viên (Đồng/Bạc/Vàng), đổi điểm lấy voucher.
- **Admin khách hàng:** danh sách + tìm theo SĐT, hồ sơ 360° (đơn, chi tiêu, ghi chú, tag), phân khúc RFM.
- Review chỉ cho khách đã mua; admin duyệt review.
- Chiến dịch: coupon theo phân khúc (sinh nhật, khách lâu không quay lại).

### Phase E — ERP (1,5–2 tuần)
- CRUD nguyên liệu, nhà cung cấp, định mức (recipe) cho từng món + topping.
- Phiếu nhập hàng (PO) → nhận hàng → cộng kho.
- Tự trừ kho khi đơn `completed`; kiểm kho/điều chỉnh/hao hụt.
- Cảnh báo tồn dưới `min_stock`; tự **tắt món** khi thiếu nguyên liệu.
- Giá vốn từng món, lãi gộp theo đơn/ngày; nhập chi phí vận hành.

### Phase F — Dashboard & báo cáo (4–5 ngày)
- Doanh thu hôm nay/tuần/tháng, số đơn, AOV, món bán chạy, giờ cao điểm.
- Lãi gộp, giá trị tồn kho, khách mới vs quay lại.
- Xuất Excel/CSV.

### Phase G — Production (3–4 ngày)
- SEO (sitemap, schema.org Product), `@nuxt/image`, Lighthouse > 90.
- Bảo mật: rate-limit API đặt hàng/OTP, CSRF, phân quyền theo role, `audit_logs`.
- Deploy: VPS + Docker Compose (app + Postgres + backup hằng ngày) hoặc Vercel/Railway + Neon.
- Theo dõi lỗi (Sentry), uptime.

---

## 4. Cấu trúc thư mục mục tiêu

```
app/
  pages/
    admin/
      index.vue                  dashboard
      products/ categories/ options/ coupons/
      orders/ customers/ reviews/
      inventory/ ingredients/ suppliers/ purchase-orders/
      reports/ users/ settings/
    account/                     khách: đơn hàng, điểm, địa chỉ
    orders/[code].vue
  layouts/admin.vue
  middleware/admin.ts
  composables/useApi.ts
server/
  api/                           public
  api/admin/                     cần role
  db/schema.ts  db/seed.ts
  services/pricing.ts            tính giá + coupon (dùng chung client hiển thị)
  services/inventory.ts          trừ/cộng kho
  services/loyalty.ts
  utils/auth.ts
shared/schemas/                  zod schema dùng chung client + server
```

---

## 5. Thứ tự ưu tiên nếu thời gian ít

1. Phase A + B + C → **bán hàng thật được** (MVP, ~3 tuần).
2. Phase D (CRM cơ bản: khách theo SĐT + tích điểm) → giữ chân khách.
3. Phase E, F → khi đã có đơn đều đặn và cần kiểm soát nguyên liệu/lãi.
