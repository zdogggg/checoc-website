import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
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
  ...timestamps,
})

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
