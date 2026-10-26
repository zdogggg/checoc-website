import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  real,
  date,
  uniqueIndex,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

// Money is stored as integer VND everywhere.

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// ---------------------------------------------------------------------------
// Staff accounts (admin area)
// ---------------------------------------------------------------------------

export const userRole = pgEnum('user_role', ['owner', 'manager', 'staff'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('staff'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  icon: varchar('icon', { length: 16 }).notNull().default('🥣'),
  image: text('image'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

export const productBadge = pgEnum('product_badge', ['best-seller', 'new', 'sale', 'signature'])

export interface Nutrition {
  calories: string
  sugar: string
  fat: string
  serving: string
}

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  shortDescription: varchar('short_description', { length: 300 }).notNull().default(''),
  description: text('description').notNull().default(''),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  image: text('image').notNull().default(''),
  badge: productBadge('badge'),
  // Denormalised until reviews move into the DB (Phase D)
  rating: real('rating').notNull().default(5),
  reviewCount: integer('review_count').notNull().default(0),
  // Display-only lists shown on the product page
  toppings: jsonb('toppings').$type<string[]>().notNull().default([]),
  ingredients: jsonb('ingredients').$type<string[]>().notNull().default([]),
  nutrition: jsonb('nutrition').$type<Nutrition>(),
  prepTime: varchar('prep_time', { length: 40 }).notNull().default(''),
  isAvailable: boolean('is_available').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  // Soft delete: products will be referenced by order items later on
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
})

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// Customisation options: sugar level, ice level, extra toppings
export const optionGroupCode = pgEnum('option_group_code', ['sugar', 'ice', 'topping'])

export const optionGroups = pgTable('option_groups', {
  id: serial('id').primaryKey(),
  code: optionGroupCode('code').notNull().unique(),
  name: varchar('name', { length: 80 }).notNull(),
  multiple: boolean('multiple').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => optionGroups.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 160 }).notNull(),
  shortLabel: varchar('short_label', { length: 60 }).notNull(),
  price: integer('price').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export const couponType = pgEnum('coupon_type', ['percent', 'fixed', 'free_shipping'])

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 40 }).notNull().unique(),
  type: couponType('type').notNull(),
  // percent: 0-100, fixed: VND, free_shipping: ignored
  value: integer('value').notNull().default(0),
  description: varchar('description', { length: 200 }).notNull().default(''),
  minOrder: integer('min_order').notNull().default(0),
  maxDiscount: integer('max_discount'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  // Personal coupon: only this customer (matched by phone at checkout) can use it
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  ...timestamps,
})

// ---------------------------------------------------------------------------
// CRM: customers are identified by phone number; an account is optional
// ---------------------------------------------------------------------------

export const customerTier = pgEnum('customer_tier', ['member', 'silver', 'gold'])

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull().default(''),
  email: varchar('email', { length: 255 }),
  birthday: date('birthday'),
  tier: customerTier('tier').notNull().default('member'),
  points: integer('points').notNull().default(0),
  // Completed orders only
  totalSpent: integer('total_spent').notNull().default(0),
  completedOrders: integer('completed_orders').notNull().default(0),
  // Any order placed, whatever its status
  lastOrderAt: timestamp('last_order_at', { withTimezone: true }),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  // Internal note shown on the admin profile
  note: text('note').notNull().default(''),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [index('customers_last_order_at_idx').on(t.lastOrderAt)])

export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  city: varchar('city', { length: 80 }).notNull(),
  district: varchar('district', { length: 80 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('customer_addresses_unique').on(t.customerId, t.city, t.district, t.address)])

export const loyaltyReason = pgEnum('loyalty_reason', ['order_earn', 'order_redeem', 'redeem_refund', 'manual'])

// Every change to a customer's points; customers.points is the running balance
export const loyaltyLedger = pgTable('loyalty_ledger', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  reason: loyaltyReason('reason').notNull(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  note: varchar('note', { length: 255 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('loyalty_ledger_customer_idx').on(t.customerId)])

export const customerNotes = pgTable('customer_notes', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  content: varchar('content', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('customer_notes_customer_idx').on(t.customerId)])

// One-time login codes sent by SMS; only a hash is stored
export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('otp_codes_phone_idx').on(t.phone)])

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// Order status and payment status are separate on purpose (see the website plan)
export const orderStatus = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'completed',
  'cancelled',
])
export const paymentStatus = pgEnum('payment_status', ['unpaid', 'paid', 'refunded'])
export const paymentMethod = pgEnum('payment_method', ['cod', 'vietqr'])

// Human-friendly order codes: CC1001, CC1002, ...
export const orderCodeSeq = pgSequence('order_code_seq', { startWith: 1001 })

export interface OrderItemTopping {
  name: string
  price: number
}

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 })
    .notNull()
    .unique()
    .default(sql`'CC' || nextval('order_code_seq')`),
  // Unguessable id for the customer's tracking link (the code is sequential)
  trackingToken: varchar('tracking_token', { length: 32 }).notNull().unique(),
  status: orderStatus('status').notNull().default('pending'),
  paymentStatus: paymentStatus('payment_status').notNull().default('unpaid'),
  paymentMethod: paymentMethod('payment_method').notNull(),
  // Delivery details are a snapshot taken at checkout
  customerName: varchar('customer_name', { length: 120 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  city: varchar('city', { length: 80 }).notNull(),
  district: varchar('district', { length: 80 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  note: varchar('note', { length: 500 }).notNull().default(''),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shippingFee: integer('shipping_fee').notNull().default(0),
  total: integer('total').notNull(),
  couponId: integer('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  couponCode: varchar('coupon_code', { length: 40 }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  // Loyalty: points spent on this order and the discount they gave, points granted on completion
  pointsUsed: integer('points_used').notNull().default(0),
  pointsDiscount: integer('points_discount').notNull().default(0),
  pointsEarned: integer('points_earned').notNull().default(0),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [
  index('orders_status_idx').on(t.status),
  index('orders_created_at_idx').on(t.createdAt),
  index('orders_customer_phone_idx').on(t.customerPhone),
  index('orders_customer_id_idx').on(t.customerId),
])

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  // Snapshots, so the order stays correct after the menu changes
  productName: varchar('product_name', { length: 160 }).notNull(),
  productImage: text('product_image').notNull().default(''),
  basePrice: integer('base_price').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: integer('line_total').notNull(),
  sugar: varchar('sugar', { length: 60 }).notNull().default(''),
  ice: varchar('ice', { length: 60 }).notNull().default(''),
  toppings: jsonb('toppings').$type<OrderItemTopping[]>().notNull().default([]),
  note: varchar('note', { length: 200 }).notNull().default(''),
}, (t) => [index('order_items_order_id_idx').on(t.orderId)])

export const orderStatusLogs = pgTable('order_status_logs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: orderStatus('from_status'),
  toStatus: orderStatus('to_status').notNull(),
  // null = placed by the customer
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  note: varchar('note', { length: 255 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('order_status_logs_order_id_idx').on(t.orderId)])

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}))

export const optionGroupsRelations = relations(optionGroups, ({ many }) => ({
  options: many(options),
}))

export const optionsRelations = relations(options, ({ one }) => ({
  group: one(optionGroups, { fields: [options.groupId], references: [optionGroups.id] }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  logs: many(orderStatusLogs),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  ledger: many(loyaltyLedger),
  notes: many(customerNotes),
  orders: many(orders),
}))

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, { fields: [customerAddresses.customerId], references: [customers.id] }),
}))

export const loyaltyLedgerRelations = relations(loyaltyLedger, ({ one }) => ({
  customer: one(customers, { fields: [loyaltyLedger.customerId], references: [customers.id] }),
  order: one(orders, { fields: [loyaltyLedger.orderId], references: [orders.id] }),
  user: one(users, { fields: [loyaltyLedger.userId], references: [users.id] }),
}))

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, { fields: [customerNotes.customerId], references: [customers.id] }),
  user: one(users, { fields: [customerNotes.userId], references: [users.id] }),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}))

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  order: one(orders, { fields: [orderStatusLogs.orderId], references: [orders.id] }),
  user: one(users, { fields: [orderStatusLogs.userId], references: [users.id] }),
}))
