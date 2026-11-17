import { z } from 'zod'

export const STAFF_ROLES = ['owner', 'manager', 'staff'] as const

const password = z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự').max(200)

export const userUpdateInput = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(120),
  role: z.enum(STAFF_ROLES),
  isActive: z.boolean(),
})
export type UserUpdateInput = z.infer<typeof userUpdateInput>

export const userCreateInput = userUpdateInput.extend({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').max(255),
  password,
  isActive: z.boolean().default(true),
})
export type UserCreateInput = z.infer<typeof userCreateInput>

export const passwordResetInput = z.object({ password })

// A staff member changing their own password
export const passwordChangeInput = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Mật khẩu nhập lại không khớp', path: ['confirm'] })
  .refine((v) => v.password !== v.currentPassword, { message: 'Mật khẩu mới phải khác mật khẩu cũ', path: ['password'] })
