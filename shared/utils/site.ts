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
  // Fill in the shop's real pages; empty ones are not shown anywhere
  social: {
    facebook: '',
    instagram: '',
    tiktok: '',
  },
} as const

export const SHOP_ADDRESS_LINE = `${SHOP.address.street}, ${SHOP.address.ward}, ${SHOP.address.city}`

// Opens the address in Google Maps (no embed, so no third-party frame or cookies on the page)
export const SHOP_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP_ADDRESS_LINE)}`

// Zalo chat with the shop's phone number
export const SHOP_ZALO_URL = `https://zalo.me/${SHOP.phone}`

// Absolute URL for links shared outside the site (canonical, og:image, sitemap).
// Paths that are already absolute (external images) are returned unchanged.
export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
