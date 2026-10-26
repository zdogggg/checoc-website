// Seed the catalog and the first admin account.
//   npm run db:seed            (needs DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD)
// Safe to re-run: the catalog is only inserted into an empty database, and the
// admin account is created once (its password is never overwritten).
import { fileURLToPath } from 'node:url'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'
import { seedCategories, seedIce, seedProducts, seedSugar, seedToppings } from './seed-data'
import { hashPassword } from '../utils/password'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const client = postgres(url, { max: 1, onnotice: () => {} })
const db = drizzle(client, { schema })

async function seedCatalog() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.categories)
  if (count > 0) {
    console.log('• Catalog already present, skipping')
    return
  }

  await db.transaction(async (tx) => {
    // Old mock category id -> new DB id
    const categoryIds = new Map<number, number>()
    const realCategories = seedCategories.filter((c) => c.slug !== 'all')
    for (const [index, c] of realCategories.entries()) {
      const [row] = await tx
        .insert(schema.categories)
        .values({ name: c.name, slug: c.slug, icon: c.icon, sortOrder: index })
        .returning({ id: schema.categories.id })
      categoryIds.set(c.id, row!.id)
    }

    for (const [index, p] of seedProducts.entries()) {
      const [row] = await tx
        .insert(schema.products)
        .values({
          categoryId: categoryIds.get(p.categoryId)!,
          slug: p.slug,
          name: p.name,
          shortDescription: p.shortDescription,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice ?? null,
          image: p.image,
          badge: p.badge ?? null,
          rating: p.rating,
          reviewCount: p.reviewCount,
          toppings: p.toppings,
          ingredients: p.ingredients,
          nutrition: p.nutrition,
          prepTime: p.prepTime,
          isAvailable: p.isAvailable,
          isFeatured: p.badge === 'best-seller' || p.badge === 'signature',
          sortOrder: index,
        })
        .returning({ id: schema.products.id })
      if (p.galleryImages.length) {
        await tx
          .insert(schema.productImages)
          .values(p.galleryImages.map((url, i) => ({ productId: row!.id, url, sortOrder: i })))
      }
    }

    const groups = [
      { code: 'sugar' as const, name: 'Độ ngọt', multiple: false, items: seedSugar },
      { code: 'ice' as const, name: 'Lượng đá', multiple: false, items: seedIce },
    ]
    for (const [index, g] of groups.entries()) {
      const [group] = await tx
        .insert(schema.optionGroups)
        .values({ code: g.code, name: g.name, multiple: g.multiple, sortOrder: index })
        .returning({ id: schema.optionGroups.id })
      await tx.insert(schema.options).values(
        g.items.map((o, i) => ({
          groupId: group!.id,
          label: o.label,
          shortLabel: o.shortLabel,
          isDefault: !!o.default,
          sortOrder: i,
        }))
      )
    }
    const [toppingGroup] = await tx
      .insert(schema.optionGroups)
      .values({ code: 'topping', name: 'Topping thêm', multiple: true, sortOrder: 2 })
      .returning({ id: schema.optionGroups.id })
    await tx.insert(schema.options).values(
      seedToppings.map((t, i) => ({
        groupId: toppingGroup!.id,
        label: t.name,
        shortLabel: t.name,
        price: t.price,
        sortOrder: i,
      }))
    )

    // The three codes that used to be hard-coded in the cart store
    await tx.insert(schema.coupons).values([
      { code: 'CHECOC10', type: 'percent', value: 10, description: 'Giảm 10% tổng đơn hàng' },
      { code: 'FREESHIP', type: 'free_shipping', value: 0, description: 'Miễn phí vận chuyển toàn quốc' },
      { code: 'CHAOHE', type: 'fixed', value: 20000, description: 'Giảm 20.000đ cho đơn đầu mùa hè' },
    ])
  })
  console.log(`✔ Seeded ${seedProducts.length} products and options/coupons`)
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log('• ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin account')
    return
  }
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
  if (existing) {
    console.log(`• Admin ${email} already exists, skipping`)
    return
  }
  await db.insert(schema.users).values({
    email,
    name: 'Chủ quán',
    passwordHash: await hashPassword(password),
    role: 'owner',
  })
  console.log(`✔ Created owner account ${email}`)
}

try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) })
  await seedCatalog()
  await seedAdmin()
} finally {
  await client.end()
}
