// Turns an audited API call (method + path) into a readable Vietnamese line for the admin log.

const RESOURCES: Record<string, string> = {
  categories: 'danh mục',
  coupons: 'mã giảm giá',
  customers: 'khách hàng',
  expenses: 'chi phí',
  ingredients: 'nguyên liệu',
  options: 'tuỳ chọn',
  orders: 'đơn hàng',
  products: 'món',
  purchases: 'phiếu nhập',
  suppliers: 'nhà cung cấp',
  uploads: 'ảnh',
  users: 'tài khoản',
}

const SUB_ACTIONS: Record<string, string> = {
  status: 'Đổi trạng thái',
  payment: 'Cập nhật thanh toán',
  recipe: 'Sửa định mức',
  adjust: 'Điều chỉnh tồn',
  receive: 'Nhận hàng',
  cancel: 'Huỷ',
  coupon: 'Tặng mã giảm giá cho',
  notes: 'Ghi chú cho',
  points: 'Điều chỉnh điểm của',
  password: 'Đặt lại mật khẩu',
}

const VERBS: Record<string, string> = { POST: 'Thêm', PUT: 'Sửa', PATCH: 'Sửa', DELETE: 'Xoá' }

export function describeAudit(method: string, path: string, status: number): string {
  const clean = path.split('?')[0]!
  if (clean === '/api/auth/login') return status < 400 ? 'Đăng nhập' : 'Đăng nhập thất bại'
  if (clean === '/api/auth/logout') return 'Đăng xuất'

  const [resource, id, sub] = clean.replace(/^\/api\/admin\//, '').split('/')
  const noun = RESOURCES[resource ?? '']
  if (!noun) return `${method} ${clean}`
  const target = id && /^\d+$/.test(id) ? ` #${id}` : ''
  if (sub && SUB_ACTIONS[sub]) return `${SUB_ACTIONS[sub]} ${noun}${target}`
  return `${VERBS[method] ?? method} ${noun}${target}`
}
