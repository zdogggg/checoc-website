import { z } from 'zod'
import { normalizePhone, VN_MOBILE_REGEX } from '../utils/orders'

export const phoneField = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số điện thoại')
  .transform(normalizePhone)
  .refine((p) => VN_MOBILE_REGEX.test(p), 'Số điện thoại chưa đúng định dạng (VD: 0988123456)')

export const otpRequestInput = z.object({ phone: phoneField })

export const otpVerifyInput = z.object({
  phone: phoneField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Mã gồm 6 chữ số'),
})

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ')
  .nullish()
  .or(z.literal('').transform(() => null))

// What a customer may edit about themselves
export const accountProfileInput = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(120),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').max(255).nullish().or(z.literal('').transform(() => null)),
  birthday: optionalDate,
})

// What staff may edit on a customer profile
export const adminCustomerInput = accountProfileInput.extend({
  name: z.string().trim().max(120),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  note: z.string().trim().max(2000).default(''),
})

export const pointsAdjustInput = z.object({
  delta: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, 'Số điểm phải khác 0')
    .refine((n) => Math.abs(n) <= 100_000, 'Tối đa 100.000 điểm mỗi lần'),
  note: z.string().trim().min(1, 'Vui lòng ghi lý do').max(255),
})

export const customerNoteInput = z.object({
  content: z.string().trim().min(1, 'Ghi chú trống').max(1000),
})

export const personalCouponInput = z
  .object({
    type: z.enum(['percent', 'fixed', 'free_shipping']),
    value: z.coerce.number().int().min(0).default(0),
    description: z.string().trim().max(200).default(''),
    minOrder: z.coerce.number().int().min(0).default(0),
    // Days the coupon stays valid
    validDays: z.coerce.number().int().min(1).max(365).default(30),
  })
  .refine((c) => c.type !== 'percent' || (c.value > 0 && c.value <= 100), {
    message: 'Phần trăm giảm phải từ 1 đến 100',
    path: ['value'],
  })
  .refine((c) => c.type !== 'fixed' || c.value > 0, { message: 'Số tiền giảm phải lớn hơn 0', path: ['value'] })
