# Chè Cốc

Website bán chè & đồ ăn vặt — Nuxt 4, Pinia, Tailwind CSS.
Lộ trình backend / CRUD / ERP / CRM: [docs/plan-crud-erp-crm.md](docs/plan-crud-erp-crm.md).

## Chạy bằng Docker (khuyên dùng)

```bash
cp .env.example .env
docker compose up -d --build
```

- Website: http://localhost:3005
- PostgreSQL: `localhost:5433` (user / pass / db: `checoc`)

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

Image production: `docker build --target prod -t checoc .` rồi `docker run -p 3000:3000 checoc`.
