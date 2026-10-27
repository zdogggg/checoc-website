import { z } from 'zod'

const quantity = z.coerce
  .number()
  .finite()
  .refine((n) => Math.abs(n) < 1e10, 'Số lượng quá lớn')
const positiveQty = quantity.refine((n) => n > 0, 'Số lượng phải lớn hơn 0')
const cost = z.coerce.number().finite().min(0, 'Giá không được âm')

export const ingredientInput = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nguyên liệu').max(120),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị').max(16),
  minStock: quantity.min(0, 'Không được âm').default(0),
  note: z.string().trim().max(255).default(''),
  isActive: z.boolean().default(true),
})
export type IngredientInput = z.infer<typeof ingredientInput>

// Creating an ingredient may record the stock already on the shelf
export const ingredientCreateInput = ingredientInput.extend({
  openingStock: quantity.min(0).default(0),
  openingCost: cost.default(0),
})

// count: the counted quantity replaces the recorded stock; waste: quantity thrown away
export const stockAdjustInput = z
  .object({
    mode: z.enum(['count', 'waste']),
    quantity: quantity.min(0, 'Không được âm'),
    note: z.string().trim().max(255).default(''),
  })
  .refine((v) => v.mode !== 'waste' || v.quantity > 0, { message: 'Số lượng hao hụt phải lớn hơn 0', path: ['quantity'] })
  .refine((v) => v.mode !== 'waste' || v.note.length > 0, { message: 'Vui lòng ghi lý do hao hụt', path: ['note'] })

export const recipeInput = z.object({
  items: z
    .array(z.object({ ingredientId: z.coerce.number().int().positive(), quantity: positiveQty }))
    .max(30)
    .refine((items) => new Set(items.map((i) => i.ingredientId)).size === items.length, 'Mỗi nguyên liệu chỉ nhập một lần'),
})

export const supplierInput = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nhà cung cấp').max(160),
  phone: z.string().trim().max(20).default(''),
  address: z.string().trim().max(255).default(''),
  note: z.string().trim().max(500).default(''),
  isActive: z.boolean().default(true),
})

export const purchaseInput = z.object({
  supplierId: z.coerce.number().int().positive().nullish(),
  note: z.string().trim().max(500).default(''),
  items: z
    .array(
      z.object({
        ingredientId: z.coerce.number().int().positive('Chọn nguyên liệu'),
        quantity: positiveQty,
        unitCost: cost,
      })
    )
    .min(1, 'Phiếu nhập cần ít nhất một dòng')
    .max(100),
})
export type PurchaseInput = z.infer<typeof purchaseInput>

export const expenseInput = z.object({
  category: z.enum(['rent', 'utilities', 'salary', 'marketing', 'packaging', 'equipment', 'other']),
  amount: z.coerce.number().int('Số tiền phải là số nguyên').positive('Số tiền phải lớn hơn 0'),
  spentOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  note: z.string().trim().max(255).default(''),
})
