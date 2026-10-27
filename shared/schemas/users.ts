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
