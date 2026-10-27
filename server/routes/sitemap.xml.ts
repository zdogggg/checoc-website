import { and, eq, isNull } from 'drizzle-orm'

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)

export default defineEventHandler(async (event) => {
  const { products, categories } = schema
  const origin = siteOrigin(event)

  const rows = await useDb()
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(isNull(products.deletedAt), eq(categories.isActive, true)))
    .orderBy(products.sortOrder, products.id)

  const urls = [
    ...STATIC_PAGES.map((path) => ({ loc: absoluteUrl(origin, path), lastmod: null as Date | null })),
    ...rows.map((r) => ({ loc: absoluteUrl(origin, `/products/${r.slug}`), lastmod: r.updatedAt })),
  ]

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
})
