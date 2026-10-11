# Chè Cốc --- Website Development Plan

## 1. Mục tiêu

Xây dựng website quảng bá và bán chè cốc theo hướng **modern / premium /
warm / Vietnamese dessert**, có landing page sinh động, responsive và
kiến trúc sẵn sàng mở rộng thành e-commerce hoàn chỉnh.

### Roadmap

1.  **Phase 1:** Landing page + UI/UX + animation + responsive.
2.  **Phase 2:** Product catalog + product detail + cart + checkout.
3.  **Phase 3:** Laravel REST API + MySQL + authentication + admin.
4.  **Phase 4:** MoMo + VNPay + COD.
5.  **Phase 5:** SEO + performance + security + deployment.

> Nguyên tắc: Phase 1 phải component hóa để sau này nối API/backend mà
> không phải viết lại UI.

------------------------------------------------------------------------

## 2. Stack công nghệ

### Frontend

-   Nuxt 3
-   Vue 3
-   TypeScript
-   Pinia
-   Tailwind CSS
-   Motion for Vue hoặc GSAP
-   Nuxt `$fetch` / Axios
-   ESLint + Prettier

### Backend

-   Laravel
-   PHP 8.3+
-   Laravel Sanctum
-   Eloquent ORM
-   Laravel Validation / Form Request

### Database

-   MySQL 8

### Payment

-   MoMo
-   VNPay
-   COD

### Vì sao Nuxt 3?

-   SSR/SSG tốt cho SEO.
-   Routing tích hợp sẵn.
-   Metadata/SEO dễ quản lý.
-   Có thể prerender landing page.
-   Product detail có thể dùng slug.
-   Dễ mở rộng từ landing page thành e-commerce.

------------------------------------------------------------------------

# 3. Kiến trúc tổng thể

``` text
                    ┌──────────────────────┐
                    │       Nuxt 3         │
                    │      Frontend        │
                    │                      │
                    │ Vue 3 + Pinia       │
                    │ Tailwind + Motion    │
                    └──────────┬───────────┘
                               │
                            REST API
                               │
                    ┌──────────▼───────────┐
                    │       Laravel        │
                    │       Backend        │
                    │                      │
                    │ Auth / Products      │
                    │ Orders / Payments    │
                    │ Admin / Validation   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │        MySQL 8       │
                    └──────────────────────┘

                       Payment providers
                       ┌───────┴───────┐
                       │               │
                     MoMo            VNPay
```

------------------------------------------------------------------------

# 4. Phase 1 --- Landing Page

## 4.1 Mục tiêu

Chưa cần database, authentication hoặc payment.

Sản phẩm dùng mock data:

``` text
data/products.ts
```

Landing page phải có **flow tương tác**, không phải một trang tĩnh.

### Flow

``` text
Hero
 ↓
Category
 ↓
Product carousel
 ↓
Product detail / quick view
 ↓
Add to cart
 ↓
Cart drawer
 ↓
Checkout
```

------------------------------------------------------------------------

# 5. Design Direction

## 5.1 Phong cách

**Modern Vietnamese Dessert --- Premium / Warm / Natural**

Palette:

``` text
Dark Green   #0D241B
Cream        #F7F1E5
Peach        #F6B99F
White        #FFFDF8
Soft Green   #DDE8D6
Gold Accent  #D9A441
```

Dark green:

-   Header
-   Featured section
-   Footer
-   CTA quan trọng

Cream:

-   Background chính

Peach / Gold:

-   Accent
-   Badge
-   CTA phụ

Không dùng quá nhiều màu.

------------------------------------------------------------------------

# 6. Typography

Ưu tiên font hỗ trợ tiếng Việt:

-   Heading: Playfair Display / Fraunces / Be Vietnam Pro
-   Body: Inter / Be Vietnam Pro
-   Script font: chỉ dùng cho slogan/annotation

Không dùng script font cho body text.

------------------------------------------------------------------------

# 7. Landing Page Structure

## 7.1 Navbar

Desktop:

``` text
[Logo Chè Cốc]

Trang chủ
Sản phẩm
Về chúng tôi
Tin tức
Liên hệ

Search
Cart
[Đặt hàng ngay]
```

Mobile:

``` text
Logo       Cart      Menu
```

Behavior:

-   Transparent trên hero.
-   Scroll xuống → nền solid.
-   Sticky top.
-   Transition mượt.
-   Mobile menu dạng drawer/slide.

------------------------------------------------------------------------

# 8. Hero Section

Headline:

``` text
Ngọt lành
từ thiên nhiên
```

Subheadline:

``` text
Một cốc chè là sự kết hợp tinh tế giữa
nguyên liệu tươi ngon, truyền thống và tình yêu ẩm thực Việt.
```

CTA:

``` text
Khám phá thực đơn
```

Secondary CTA:

``` text
Xem video giới thiệu
```

## Visual

-   Một cốc chè lớn làm focal point.
-   Background nguyên liệu.
-   Ánh sáng ấm.
-   Leaf decoration.
-   Handwritten annotation.
-   Floating decoration.

## Animation

``` text
Background → fade
Hero image → scale 1.05 → 1
Heading → slide-up
Description → slide-up + delay
CTA → fade + slide
Decoration → floating nhẹ
```

Animation phải nhẹ và premium.

------------------------------------------------------------------------

# 9. Category Section

Title:

``` text
Danh mục sản phẩm
```

Categories:

``` text
Tất cả
Chè truyền thống
Chè trái cây
Chè thập cẩm
Chè khúc bạch
Chè khoai dẻo
Đồ ăn vặt
```

Mỗi category:

-   Image/icon.
-   Active state.
-   Hover.
-   Mobile horizontal scroll.

Flow:

``` text
Click category
      ↓
Filter products
      ↓
Product list/carousel cập nhật
```

------------------------------------------------------------------------

# 10. Featured Products

Title:

``` text
Sản phẩm nổi bật
```

Product card:

``` text
┌─────────────────────┐
│       IMAGE         │
│ Best Seller     ♡   │
├─────────────────────┤
│ Chè thập cẩm        │
│ Đậu xanh, đậu đỏ... │
│                     │
│ 35.000đ             │
│ [ Thêm vào giỏ ]    │
└─────────────────────┘
```

Interaction:

-   Image zoom nhẹ.
-   Card nâng nhẹ.
-   Heart animation.
-   Button hover.
-   Add-to-cart animation.

Mobile:

-   2 columns hoặc horizontal carousel.

------------------------------------------------------------------------

# 11. Product Data --- Phase 1

``` ts
export interface Product {
  id: number
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  image: string
  categoryId: number
  badge?: 'new' | 'best-seller' | 'sale'
  rating?: number
  toppings?: string[]
}
```

Mock products:

``` text
Chè thập cẩm
Chè thái
Chè khúc bạch
Chè bưởi
Chè khoai dẻo
Chè đậu đỏ
```

------------------------------------------------------------------------

# 12. Brand Story

Title:

``` text
Chè Cốc —
Hương vị truyền thống
trong từng ly hiện đại
```

Layout:

``` text
Text              Image
Text              Product photo
CTA
Stats
```

Stats:

``` text
5+
Năm kinh nghiệm

10+
Loại chè đặc sắc

100%
Nguyên liệu tự nhiên
```

Animation:

-   Image reveal.
-   Text slide-in.
-   Stats count-up khi section xuất hiện.

------------------------------------------------------------------------

# 13. Why Choose Us

4 benefits:

``` text
100% nguyên liệu tươi
Chế biến sạch
Hương vị truyền thống
Giao hàng nhanh
```

Dùng icon line-style, đơn giản.

------------------------------------------------------------------------

# 14. Gallery

Gallery ảnh sản phẩm/nguyên liệu.

Desktop có thể dùng masonry.

Interaction:

-   Hover zoom.
-   Click → lightbox.
-   ESC → đóng.
-   Mobile → carousel.

------------------------------------------------------------------------

# 15. Reviews

Review card:

``` text
Avatar
Tên
Rating
Nội dung
Ngày
```

Ví dụ:

``` text
★★★★★

"Chè ngon, ngọt vừa, topping nhiều.
Đóng gói rất cẩn thận."
```

Có thể làm carousel.

Không autoplay quá nhanh.

------------------------------------------------------------------------

# 16. CTA đặt hàng

``` text
Một cốc chè,
một chút hạnh phúc.

Đặt món yêu thích ngay hôm nay.

[ Đặt hàng ngay ]
```

Ảnh sản phẩm ở cạnh.

------------------------------------------------------------------------

# 17. Footer

``` text
Logo

Liên kết
- Trang chủ
- Sản phẩm
- Về chúng tôi
- Tin tức
- Liên hệ

Thông tin
- Địa chỉ
- Hotline
- Email
- Giờ mở cửa

Social
Facebook
Instagram
TikTok
YouTube

Newsletter
[ Nhập email ] [ → ]
```

Mobile có thể chuyển link groups thành accordion.

------------------------------------------------------------------------

# 18. Animation System

Không animation mọi thứ.

## Page load

Hero stagger:

``` text
Heading
↓
Description
↓
CTA
↓
Decoration
```

## Scroll reveal

``` text
opacity: 0 → 1
translateY: 30px → 0
```

## Product

``` text
hover:
scale image 1.04
translate card -4px
```

## Cart

``` text
Add product
 ↓
Button đổi trạng thái
 ↓
Cart badge +1
 ↓
Cart icon bounce
```

## Navbar

``` text
Top:
transparent

Scroll:
solid + shadow
```

### Library

Ưu tiên Motion for Vue.

Chỉ dùng GSAP khi animation thực sự phức tạp.

------------------------------------------------------------------------

# 19. Responsive

Test tối thiểu:

``` text
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

Mobile phải được thiết kế riêng, không chỉ scale desktop.

### Mobile

Hero:

``` text
Text
↓
CTA
↓
Product image
```

Product:

``` text
2 columns
```

Navbar:

``` text
Logo + Cart + Hamburger
```

Cart:

``` text
Bottom sheet hoặc full-height drawer
```

------------------------------------------------------------------------

# 20. Component Architecture

``` text
components/
│
├── layout/
│   ├── AppNavbar.vue
│   ├── MobileMenu.vue
│   └── AppFooter.vue
│
├── home/
│   ├── HeroSection.vue
│   ├── CategorySection.vue
│   ├── FeaturedProducts.vue
│   ├── BrandStory.vue
│   ├── WhyChooseUs.vue
│   ├── GallerySection.vue
│   ├── ReviewSection.vue
│   └── OrderCTA.vue
│
├── product/
│   ├── ProductCard.vue
│   ├── ProductGrid.vue
│   ├── ProductQuickView.vue
│   └── CategoryFilter.vue
│
└── cart/
    ├── CartDrawer.vue
    ├── CartItem.vue
    └── CartButton.vue
```

Pages:

``` text
pages/
├── index.vue
├── products/
│   ├── index.vue
│   └── [slug].vue
├── about.vue
├── news.vue
└── contact.vue
```

------------------------------------------------------------------------

# 21. State Management

Stores:

``` text
stores/
├── cart.ts
├── product.ts
├── ui.ts
└── user.ts
```

Phase 1:

``` text
cart.ts
ui.ts
```

Cart:

``` text
items
addItem()
removeItem()
updateQuantity()
clearCart()
subtotal
totalItems
```

Persist cart bằng localStorage.

------------------------------------------------------------------------

# 22. Phase 2 --- Product & Shopping Flow

``` text
Home
 ↓
Product listing
 ↓
Product detail
 ↓
Choose toppings/options
 ↓
Add cart
 ↓
Cart drawer
 ↓
Checkout
```

Product detail:

-   Gallery
-   Product name
-   Price
-   Description
-   Toppings
-   Quantity
-   Add to cart
-   Related products
-   Reviews

------------------------------------------------------------------------

# 23. Checkout UX

``` text
1. Giỏ hàng
      ↓
2. Thông tin giao hàng
      ↓
3. Phương thức thanh toán
      ↓
4. Xác nhận
      ↓
5. Thành công
```

Fields:

``` text
Họ tên
Số điện thoại
Địa chỉ
Ghi chú
Phương thức thanh toán
```

------------------------------------------------------------------------

# 24. Phase 3 --- Laravel Backend

Backend:

``` text
Laravel
PHP 8.3+
MySQL 8
```

API:

``` text
/api/products
/api/categories
/api/orders
/api/auth
/api/reviews
/api/coupons
```

------------------------------------------------------------------------

# 25. Database Design

Core tables:

``` text
users
categories
products
product_images
product_options
orders
order_items
payments
reviews
coupons
coupon_usages
```

Relationships:

``` text
Category
   │
   └── hasMany Products

Product
   ├── hasMany Images
   ├── hasMany Options
   └── hasMany OrderItems

Order
   ├── hasMany OrderItems
   └── hasOne Payment
```

------------------------------------------------------------------------

# 26. Order Status

``` text
pending
confirmed
preparing
shipping
completed
cancelled
```

Payment status:

``` text
unpaid
pending
paid
failed
refunded
```

Không gộp order status và payment status vào cùng một field.

------------------------------------------------------------------------

# 27. Authentication

Customer:

``` text
Register
Login
Logout
Profile
Order history
```

Admin:

``` text
Admin login
RBAC
Product management
Category management
Order management
Review management
Coupon management
Dashboard
```

Laravel Sanctum có thể dùng cho authentication.

------------------------------------------------------------------------

# 28. Phase 4 --- MoMo + VNPay

Flow:

``` text
Checkout
   ↓
Create Order
   ↓
Create Payment
   ↓
Generate Payment URL
   ↓
Redirect to MoMo/VNPay
   ↓
Payment callback/IPN
   ↓
Laravel verify
   ↓
Update payment
   ↓
Update order
```

Có thêm:

``` text
COD
```

## Security

Không tin trạng thái thanh toán từ frontend.

Backend phải:

-   Verify signature.
-   Verify order.
-   Verify amount.
-   Verify transaction/reference.
-   Chống xử lý callback nhiều lần.
-   Chỉ đánh dấu `paid` sau khi server xác thực thành công.

------------------------------------------------------------------------

# 29. Phase 5 --- Admin Dashboard

Dashboard:

``` text
Doanh thu hôm nay
Đơn hàng hôm nay
Đơn đang xử lý
Sản phẩm bán chạy
```

Products:

``` text
Create
Read
Update
Delete
Upload images
Set price
Set stock
Set category
Set featured
```

Orders:

``` text
Order ID
Customer
Items
Total
Payment
Status
Created at
```

------------------------------------------------------------------------

# 30. SEO

Nuxt metadata:

``` text
title
description
og:title
og:description
og:image
canonical
```

Product URLs:

``` text
/che-thap-cam
/che-thai
/che-khuc-bach
```

Ưu tiên slug thay vì:

``` text
/product?id=123
```

Thêm:

-   Sitemap
-   Robots.txt
-   Open Graph
-   Product structured data
-   LocalBusiness schema nếu có cửa hàng thực tế

------------------------------------------------------------------------

# 31. Performance

Mục tiêu:

``` text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

Tối ưu:

-   WebP/AVIF.
-   Lazy load ảnh ngoài hero.
-   Responsive images.
-   Không dùng video hero quá nặng.
-   Font preload hợp lý.
-   Code splitting.
-   Giảm JS client.
-   Hạn chế animation nặng trên mobile.

------------------------------------------------------------------------

# 32. Accessibility

Cần có:

``` text
alt cho ảnh
aria-label cho icon button
keyboard navigation
focus state
contrast đủ tốt
button không dùng div
form label rõ ràng
```

------------------------------------------------------------------------

# 33. Project Structure

``` text
che-coc/
│
├── frontend/
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   ├── public/
│   ├── app.vue
│   ├── nuxt.config.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── resources/
│   ├── storage/
│   └── composer.json
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── PAYMENT.md
│
└── README.md
```

------------------------------------------------------------------------

# 34. Phase 1 Implementation Order

Thực hiện theo thứ tự:

``` text
1. Project setup
2. Global styles / design tokens
3. Navbar
4. Hero
5. Categories
6. Product cards
7. Featured products
8. Brand story
9. Why choose us
10. Gallery
11. Reviews
12. CTA
13. Footer
14. Responsive
15. Animation
16. Performance
17. Accessibility
18. Final visual polish
```

------------------------------------------------------------------------

# 35. Definition of Done --- Phase 1

-   [ ] Desktop đẹp.
-   [ ] Mobile đẹp.
-   [ ] Navbar sticky.
-   [ ] Hero animation hoàn chỉnh.
-   [ ] Category carousel hoạt động.
-   [ ] Product carousel hoạt động.
-   [ ] Product card hover.
-   [ ] Add-to-cart interaction mock.
-   [ ] Cart badge hoạt động.
-   [ ] Cart drawer hoạt động cơ bản.
-   [ ] Scroll reveal.
-   [ ] Gallery lightbox.
-   [ ] Review carousel.
-   [ ] Footer responsive.
-   [ ] Không horizontal overflow.
-   [ ] Ảnh được tối ưu.
-   [ ] SEO metadata cơ bản.
-   [ ] Keyboard navigation cơ bản.
-   [ ] Không console error.
-   [ ] Không hard-code layout lặp lại trong page.

------------------------------------------------------------------------

# 36. Mock Data Strategy

Phase 1:

``` text
data/products.ts
```

Phase 2:

``` text
Laravel API
```

Frontend interface không phụ thuộc trực tiếp vào database.

``` ts
interface Product {
  id: number
  slug: string
  name: string
  price: number
  image: string
  description: string
}
```

Sau này API trả cùng shape thì UI gần như không cần sửa.

------------------------------------------------------------------------

# 37. Git Workflow

Branches:

``` text
main
develop
feature/landing-page
feature/product
feature/cart
feature/checkout
feature/payment-momo
feature/payment-vnpay
feature/admin
```

Commit examples:

``` text
feat: create hero section
feat: add product cards
feat: implement cart drawer
style: improve mobile layout
fix: prevent cart overflow
perf: optimize hero image
```

------------------------------------------------------------------------

# 38. Milestones

## Milestone 1

``` text
Setup
 ↓
Navbar
 ↓
Hero
```

## Milestone 2

``` text
Categories
 ↓
Products
 ↓
Brand story
```

## Milestone 3

``` text
Gallery
 ↓
Reviews
 ↓
Footer
```

## Milestone 4

``` text
Responsive
 ↓
Animation
 ↓
Polish
```

## Milestone 5

``` text
Cart
 ↓
Product detail
 ↓
Checkout
```

## Milestone 6

``` text
Laravel
 ↓
MySQL
 ↓
REST API
```

## Milestone 7

``` text
MoMo
 ↓
VNPay
 ↓
Order management
```

------------------------------------------------------------------------

# 39. Recommended Final Stack

``` text
Frontend
──────────────
Nuxt 3
Vue 3
TypeScript
Tailwind CSS
Pinia
Motion / GSAP

Backend
──────────────
Laravel
PHP 8.3+
Laravel Sanctum
Eloquent

Database
──────────────
MySQL 8

Payment
──────────────
MoMo
VNPay
COD

Deployment
──────────────
Nginx
Ubuntu
SSL/HTTPS
Docker (optional)
```

------------------------------------------------------------------------

# 40. Development Philosophy

Ưu tiên:

``` text
UI/UX
  ↓
Interaction
  ↓
Responsive
  ↓
Performance
  ↓
API
  ↓
Database
  ↓
Payment
  ↓
Admin
  ↓
Production
```

Không bắt đầu bằng payment/database khi UI/flow chưa ổn.

Mục tiêu cảm nhận của landing page:

> "Đây là một thương hiệu chè thật và mình muốn đặt một cốc ngay."

Không phải:

> "Đây là một bài tập CRUD bán chè."
