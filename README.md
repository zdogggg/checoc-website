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
| `npm run format` | Prettier |
| `npm test` | Vitest (`tests/`) |
| `npm run build` | Build production vào `.output/` |
| `npm run db:generate` | Sinh migration mới sau khi sửa `server/db/schema.ts` |
| `npm run db:seed` | Nạp dữ liệu mẫu + tạo tài khoản chủ quán |
| `npm run db:studio` | Mở Drizzle Studio để xem dữ liệu |

## Cấu trúc backend

- `server/db/schema.ts` — bảng dữ liệu (Drizzle ORM, PostgreSQL); migration trong `server/db/migrations/`
- `server/api/` — API công khai (`/api/products`, `/api/categories`, `/api/options`, `/api/coupons/validate`)
- `server/api/admin/` — API quản trị, cần đăng nhập; chỉ `owner` / `manager` được sửa thực đơn
- `shared/` — kiểu dữ liệu, Zod schema và hàm tính giá dùng chung cho client và server

## Production

```bash
docker build --target prod -t checoc .
docker run -p 3000:3000 --env-file .env -v checoc_uploads:/app/.data checoc
```

Ảnh tải lên lưu trong `/app/.data/uploads` — cần mount volume để không mất ảnh khi deploy lại.
