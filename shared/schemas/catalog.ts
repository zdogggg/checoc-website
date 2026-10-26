import { z } from 'zod'

// Input schemas for the admin API. Used by the server to validate requests and
// by the admin forms for client-side validation, so both stay in sync.

const slug = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập slug')
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang')

const money = z.coerce.number().int('Giá phải là số nguyên').min(0, 'Giá không được âm')

export const categoryInput = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(120),
  slug,
  icon: z.string().trim().max(16).default(''),
  image: z.string().trim().nullish(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})
export type CategoryInput = z.infer<typeof categoryInput>

export const productInput = z
  .object({
    categoryId: z.coerce.number().int().positive('Vui lòng chọn danh mục'),
    name: z.string().trim().min(1, 'Vui lòng nhập tên món').max(160),
    slug,
    shortDescription: z.string().trim().max(300).default(''),
    description: z.string().trim().default(''),
    price: money,
    originalPrice: money.nullish(),
    image: z.string().trim().default(''),
    galleryImages: z.array(z.string().trim().min(1)).default([]),
    badge: z.enum(['best-seller', 'new', 'sale', 'signature']).nullish(),
    toppings: z.array(z.string().trim().min(1)).default([]),
    ingredients: z.array(z.string().trim().min(1)).default([]),
    nutrition: z
      .object({
        calories: z.string().trim().default(''),
        sugar: z.string().trim().default(''),
        fat: z.string().trim().default(''),
        serving: z.string().trim().default(''),
      })
      .nullish(),
    prepTime: z.string().trim().max(40).default(''),
    isAvailable: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((p) => p.originalPrice == null || p.originalPrice >= p.price, {
    message: 'Giá gốc phải lớn hơn hoặc bằng giá bán',
    path: ['originalPrice'],
  })
export type ProductInput = z.infer<typeof productInput>

export const optionInput = z.object({
  groupId: z.coerce.number().int().positive(),
  label: z.string().trim().min(1, 'Vui lòng nhập tên tuỳ chọn').max(160),
  shortLabel: z.string().trim().min(1, 'Vui lòng nhập tên ngắn').max(60),
  price: money.default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})
export type OptionInput = z.infer<typeof optionInput>

export const couponInput = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Mã tối thiểu 3 ký tự')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, - và _')
      .transform((s) => s.toUpperCase()),
    type: z.enum(['percent', 'fixed', 'free_shipping']),
    value: z.coerce.number().int().min(0).default(0),
    description: z.string().trim().max(200).default(''),
    minOrder: money.default(0),
    maxDiscount: money.nullish(),
    startsAt: z.coerce.date().nullish(),
    endsAt: z.coerce.date().nullish(),
    usageLimit: z.coerce.number().int().positive().nullish(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== 'percent' || (c.value > 0 && c.value <= 100), {
    message: 'Phần trăm giảm phải từ 1 đến 100',
    path: ['value'],
  })
  .refine((c) => c.type !== 'fixed' || c.value > 0, {
    message: 'Số tiền giảm phải lớn hơn 0',
    path: ['value'],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.endsAt > c.startsAt, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endsAt'],
  })
export type CouponInput = z.infer<typeof couponInput>

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const couponValidateInput = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá').max(40),
  subtotal: z.coerce.number().int().min(0),
  // Needed for personal coupons
  phone: z.string().trim().max(20).nullish(),
})
