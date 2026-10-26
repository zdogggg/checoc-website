import { z } from 'zod'
import { normalizePhone, VN_MOBILE_REGEX } from '../utils/orders'

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
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1, 'Vui lòng chọn quận / huyện').max(80),
  address: z.string().trim().min(1, 'Vui lòng cung cấp địa chỉ số nhà/tòa nhà chi tiết').max(255),
  note: z.string().trim().max(500).default(''),
  paymentMethod: z.enum(['cod', 'vietqr']),
  couponCode: z.string().trim().max(40).nullish(),
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
