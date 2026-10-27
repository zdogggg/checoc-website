// Shop identity used for SEO (meta tags, structured data). Keep in sync with the footer.

export const SHOP = {
  name: 'Chè Cốc',
  description:
    'Chè truyền thống, chè Thái, chè khúc bạch và đồ ăn vặt nấu mới mỗi ngày tại Chè Cốc. Đặt online, giao nhanh trong khu vực.',
  phone: '0778142044',
  address: {
    street: '394/21 Nguyễn Tri Phương',
    ward: 'Vườn Lài',
    city: 'Hồ Chí Minh',
    country: 'VN',
  },
  opens: '08:00',
  closes: '22:00',
  themeColor: '#0D241B',
} as const

// Absolute URL for links shared outside the site (canonical, og:image, sitemap).
// Paths that are already absolute (external images) are returned unchanged.
export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
