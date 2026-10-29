# Deploy Chè Cốc lên VPS

Một máy chủ Linux (Ubuntu 22.04/24.04, tối thiểu 1 vCPU · 2 GB RAM) chạy toàn bộ bằng Docker Compose:

```
Internet ──443──> Caddy (HTTPS tự động) ──> app (Nuxt, cổng 3000) ──> PostgreSQL
                                                         backup ──> ./backups (mỗi ngày 03:00)
```

Chỉ Caddy mở cổng ra ngoài (80, 443). App và database không nhận kết nối trực tiếp từ Internet.

## 1. Chuẩn bị

1. Trỏ tên miền: tạo bản ghi **A** `checoc.vn` (và `www`) về IP của VPS. Đợi DNS cập nhật trước khi chạy bước 3,
   nếu không Caddy chưa lấy được chứng chỉ HTTPS.
2. Cài Docker trên VPS:

   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

3. Mở tường lửa cho SSH, 80, 443:

   ```bash
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443/tcp && ufw allow 443/udp && ufw enable
   ```

## 2. Cấu hình

```bash
git clone <repo> checoc && cd checoc
cp .env.example .env
```

Sửa `.env` cho production:

| Biến | Giá trị |
|------|---------|
| `DOMAIN` | `checoc.vn` (không có `https://`) |
| `NUXT_PUBLIC_SITE_URL` | `https://checoc.vn` |
| `POSTGRES_PASSWORD` | chuỗi ngẫu nhiên dài; **không đổi** sau lần chạy đầu (database đã tạo với mật khẩu này) |
| `NUXT_SESSION_PASSWORD` | ≥ 32 ký tự ngẫu nhiên (thiếu là app không khởi động) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | tài khoản chủ quán đầu tiên, chỉ được tạo khi chưa có tài khoản nào |
| `NUXT_PUBLIC_BANK_*` | tài khoản nhận chuyển khoản VietQR (bỏ trống để tắt) |
| `NUXT_TELEGRAM_*` | nhận tin đơn mới **và cảnh báo lỗi máy chủ** |
| `NUXT_RESEND_API_KEY`, `NUXT_MAIL_FROM` | gửi mã đăng nhập cho khách qua email (xem mục Email bên dưới) |
| `NUXT_PUBLIC_VAPID_PUBLIC_KEY`, `NUXT_VAPID_PRIVATE_KEY`, `NUXT_VAPID_SUBJECT` | thông báo đẩy trạng thái đơn; tạo bằng `npx web-push generate-vapid-keys`, **không đổi** sau khi chạy thật (đổi là mọi khách đã bật thông báo mất đăng ký). `NUXT_VAPID_SUBJECT` phải là `mailto:` một email thật, nếu không thông báo tới iPhone bị Apple từ chối |

### Email đăng nhập (Resend)

1. Tạo tài khoản ở resend.com → **Domains** → thêm tên miền (ví dụ `checoc.vn`) và thêm các bản ghi DNS
   (SPF, DKIM) Resend đưa ra vào nơi quản lý tên miền. Đợi trạng thái **Verified**.
2. **API Keys** → tạo key quyền "Sending access" → đặt vào `NUXT_RESEND_API_KEY`.
3. `NUXT_MAIL_FROM="Chè Cốc <no-reply@checoc.vn>"` (địa chỉ phải thuộc tên miền đã xác thực).

Gói miễn phí: 3.000 email/tháng, 100 email/ngày. Nếu Resend báo lỗi (key sai, tên miền chưa xác thực),
khách thấy "Không gửi được email lúc này" và chi tiết lỗi nằm trong log của app.

Tạo chuỗi ngẫu nhiên:

```bash
openssl rand -hex 32
```

`DATABASE_URL` trong `.env` không cần sửa: `docker-compose.prod.yml` tự trỏ app tới database bên trong.

## 3. Chạy

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app
```

Khi khởi động, app tự chạy migration và tạo tài khoản chủ quán. Mở `https://checoc.vn/admin`, đăng nhập,
rồi **đổi mật khẩu** (Tài khoản → Đặt mật khẩu) và xoá `ADMIN_PASSWORD` khỏi `.env`.

Thực đơn mẫu không được nạp ở production; nhập món thật trong trang quản trị.
Nếu muốn nạp thực đơn mẫu một lần, chạy từ máy có mã nguồn với `DATABASE_URL` trỏ tới server
(qua SSH tunnel) rồi `npm run db:seed`.

Tài khoản nhân viên tạo trong **Tài khoản** (chỉ chủ quán thấy). Mọi thay đổi trong trang quản trị được ghi ở
**Nhật ký thao tác**.

## 4. Cập nhật phiên bản mới

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build app
```

Migration mới tự chạy khi app khởi động lại. Nên có bản backup mới nhất trước khi cập nhật (xem dưới).

## 5. Backup và khôi phục

Service `backup` dump database lúc khởi động và mỗi ngày 03:00 vào `./backups/checoc-YYYYMMDD-HHMM.dump`,
giữ 14 ngày (`BACKUP_KEEP_DAYS`). Thư mục này nằm trên cùng VPS: **chép định kỳ ra nơi khác**
(Google Drive bằng `rclone`, máy khác bằng `rsync`), vì hỏng ổ đĩa sẽ mất cả database lẫn backup.

Ảnh món tải lên nằm trong volume `uploads`; sao lưu bằng:

```bash
docker run --rm -v checoc_uploads:/data -v "$PWD/backups":/out alpine tar czf /out/uploads-$(date +%F).tgz -C /data .
```

Backup thủ công ngay:

```bash
docker compose -f docker-compose.prod.yml exec backup sh -c 'pg_dump -Fc -f /backups/manual-$(date +%Y%m%d-%H%M).dump'
```

Khôi phục (ghi đè dữ liệu hiện tại):

```bash
docker compose -f docker-compose.prod.yml stop app
docker compose -f docker-compose.prod.yml exec backup pg_restore --clean --if-exists -d checoc /backups/checoc-20261027-0300.dump
docker compose -f docker-compose.prod.yml start app
```

Hãy thử khôi phục một lần trên máy khác để chắc bản backup dùng được.

## 6. Theo dõi

- **Uptime**: tạo monitor HTTP miễn phí (UptimeRobot, Better Stack) gọi `https://checoc.vn/api/health` mỗi 5 phút.
  Trả 200 khi app và database chạy, 503 khi mất kết nối database.
- **Lỗi máy chủ**: nếu đã cấu hình Telegram, mỗi lỗi 5xx gửi một tin (cùng một lỗi tối đa 10 phút/lần).
- **Log**: `docker compose -f docker-compose.prod.yml logs --since 1h app`.

## 7. Môi trường thử (staging)

Chạy thêm một bản trên tên miền phụ (ví dụ `staging.checoc.vn`) với `.env` riêng và `NUXT_PUBLIC_INDEXABLE=false`:
`robots.txt` khi đó chặn mọi công cụ tìm kiếm để bản thử không lên Google.

## Bảo mật đã có sẵn

- HTTPS bắt buộc (Caddy), HSTS, Content-Security-Policy, chặn nhúng trang vào iframe.
- Chặn yêu cầu ghi dữ liệu từ website khác (CSRF) ngoài cookie `SameSite=Lax`.
- Giới hạn tần suất: đăng nhập, gửi OTP, đặt đơn, tra cứu đơn.
- Khoá tài khoản nhân viên có hiệu lực ngay cả với phiên đang đăng nhập; luôn còn ít nhất một chủ quán.
- Mật khẩu băm scrypt; app không khởi động nếu thiếu `NUXT_SESSION_PASSWORD`.
