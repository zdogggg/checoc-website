// Where the shop delivers. Checkout only offers these areas and the order API rejects
// anything else, so this list is the single place to widen or narrow delivery.
//
// Areas use the familiar district names (quận) customers still give for addresses, even
// though HCMC's wards were reorganised in 2025; the street address field holds the rest.

export const DELIVERY_CITY = 'TP. Hồ Chí Minh'

export const DELIVERY_AREAS = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Bình Thạnh',
  'Gò Vấp',
] as const

export type DeliveryArea = (typeof DELIVERY_AREAS)[number]

export const isDeliveryArea = (s: string): s is DeliveryArea => (DELIVERY_AREAS as readonly string[]).includes(s)
