import { z } from 'zod'
import { normalizePhone, VN_MOBILE_REGEX } from '../utils/orders'
import { DELIVERY_CITY, isDeliveryArea } from '../utils/delivery'
import { optionalEmail } from './customers'

export const orderItemInput = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(50),
  // Option labels as shown in the cart; the server resolves them to current prices
  sugar: z.string().trim().max(60).default(''),
  ice: z.string().trim().max(60).default(''),
  toppings: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
  note: z.string().trim().max(200).default(''),
})
export type OrderItemInput = z.infer<typeof orderItemInput>

export const orderInput = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên của bạn').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại nhận hàng')
    .transform(normalizePhone)
    .refine((p) => VN_MOBILE_REGEX.test(p), 'Số điện thoại chưa đúng định dạng (VD: 0988123456)'),
  // Optional; linked to the customer as their sign-in email when the order is completed
  email: optionalEmail,
  city: z.literal(DELIVERY_CITY, { error: `Quán hiện chỉ giao trong ${DELIVERY_CITY}` }),
  district: z.string().trim().min(1, 'Vui lòng chọn khu vực giao hàng').refine(isDeliveryArea, 'Khu vực này quán chưa giao tới, vui lòng chọn khu vực trong danh sách'),
  address: z.string().trim().min(1, 'Vui lòng cung cấp địa chỉ số nhà/tòa nhà chi tiết').max(255),
  note: z.string().trim().max(500).default(''),
  paymentMethod: z.enum(['cod', 'vietqr']),
  couponCode: z.string().trim().max(40).nullish(),
  // Loyalty points to spend; requires being signed in with the same phone
  pointsToUse: z.coerce.number().int().min(0).max(1_000_000).default(0),
  items: z.array(orderItemInput).min(1, 'Giỏ hàng đang trống').max(30),
})
export type OrderInput = z.infer<typeof orderInput>

export const orderStatusInput = z
  .object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled']),
    note: z.string().trim().max(255).default(''),
  })
  .refine((v) => v.status !== 'cancelled' || v.note.length > 0, {
    message: 'Vui lòng ghi lý do huỷ đơn',
    path: ['note'],
  })

export const paymentStatusInput = z.object({
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
})

// An order received on ShopeeFood, entered by staff after it is done. Prices default to
// the website menu; `subtotal` overrides them with the amount shown in the app.
export const platformOrderInput = z
  .object({
    externalCode: z.string().trim().min(1, 'Vui lòng nhập mã đơn ShopeeFood').max(40),
    // When the order was placed on ShopeeFood (defaults to now); never in the future
    placedAt: z.coerce.date().optional(),
    items: z
      .array(
        z.object({
          productId: z.coerce.number().int().positive(),
          quantity: z.coerce.number().int().min(1).max(50),
          toppings: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
        }),
      )
      .min(1, 'Chọn ít nhất một món')
      .max(30),
    subtotal: z.coerce.number().int().min(0).max(100_000_000).optional(),
    // Voucher the shop itself paid for (platform-funded vouchers do not change shop revenue)
    discount: z.coerce.number().int().min(0).default(0),
    feePercent: z.coerce.number().min(0).max(60, 'Phí tối đa 60%').default(0),
    note: z.string().trim().max(500).default(''),
  })
  .refine((v) => !v.placedAt || v.placedAt.getTime() <= Date.now() + 5 * 60 * 1000, {
    message: 'Thời gian đặt không được ở tương lai',
    path: ['placedAt'],
  })
export type PlatformOrderInput = z.infer<typeof platformOrderInput>

export const voidOrderInput = z.object({
  reason: z.string().trim().min(1, 'Vui lòng ghi lý do').max(255),
})
