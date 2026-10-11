export interface Product {
  id: number
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  originalPrice?: number
  image: string
  galleryImages: string[]
  categoryId: number
  categoryName: string
  badge?: 'best-seller' | 'new' | 'sale' | 'signature'
  rating: number
  reviewCount: number
  toppings: string[]
  ingredients: string[]
  nutrition: {
    calories: string
    sugar: string
    fat: string
    serving: string
  }
  prepTime: string
  isAvailable: boolean
}

export interface Category {
  id: number
  name: string
  icon: string
  slug: string
}

export interface CustomOption {
  id: string
  label: string
  shortLabel: string
  default?: boolean
}

export interface ToppingOption {
  id: string
  name: string
  price: number
}

export interface ProductReview {
  id: number
  author: string
  avatar: string
  rating: number
  date: string
  comment: string
}

export const mockCategories: Category[] = [
  { id: 1, name: 'Tất cả món', icon: '🥣', slug: 'all' },
  { id: 2, name: 'Chè truyền thống', icon: '🫘', slug: 'che-truyen-thong' },
  { id: 3, name: 'Chè trái cây', icon: '🥭', slug: 'che-trai-cay' },
  { id: 4, name: 'Chè thập cẩm', icon: '🥥', slug: 'che-thap-cam' },
  { id: 5, name: 'Chè khúc bạch', icon: '🧀', slug: 'che-khuc-bach' },
  { id: 6, name: 'Chè khoai dẻo', icon: '🍠', slug: 'che-khoai-deo' },
  { id: 7, name: 'Đồ ăn vặt', icon: '🍢', slug: 'do-an-vat' }
]

export const sugarOptions: CustomOption[] = [
  { id: '100', label: '100% Đường tiêu chuẩn (Chuẩn vị quán)', shortLabel: '100% đường', default: true },
  { id: '70', label: '70% Ít ngọt vừa phải', shortLabel: '70% đường' },
  { id: '50', label: '50% Ngọt thanh tự nhiên', shortLabel: '50% đường' },
  { id: '30', label: '30% Rất ít ngọt', shortLabel: '30% đường' },
  { id: '0', label: '0% Không thêm đường', shortLabel: 'Không đường' }
]

export const iceOptions: CustomOption[] = [
  { id: '100', label: 'Đá riêng mát lạnh (Khuyên dùng)', shortLabel: 'Đá riêng', default: true },
  { id: '70', label: '70% Vừa đá (Đá chung)', shortLabel: '70% đá' },
  { id: '30', label: '30% Ít đá', shortLabel: 'Ít đá' },
  { id: '0', label: '0% Không đá (Chỉ chè lạnh)', shortLabel: 'Không đá' },
  { id: 'hot', label: 'Ăn nóng ấm bụng', shortLabel: 'Chè nóng' }
]

export const extraToppings: ToppingOption[] = [
  { id: 'top_1', name: 'Trân châu trắng giòn 3Q', price: 5000 },
  { id: 'top_2', name: 'Dừa non Bến Tre nạo sợi', price: 5000 },
  { id: 'top_3', name: 'Hạt sen Huế bùi thơm', price: 8000 },
  { id: 'top_4', name: 'Viên khoai dẻo ngũ sắc', price: 6000 },
  { id: 'top_5', name: 'Thạch sương sáo cốt lá nếp', price: 5000 },
  { id: 'top_6', name: 'Nước cốt dừa tươi đặc biệt', price: 5000 },
  { id: 'top_7', name: 'Hạnh nhân lát sấy giòn', price: 6000 }
]

export const mockProducts: Product[] = [
  {
    id: 1,
    slug: 'che-thap-cam',
    name: 'Chè Thập Cẩm Cung Đình',
    shortDescription: 'Đậu xanh, đậu đỏ, cốt dừa, trân châu giòn, thạch sương sáo',
    description: 'Chè thập cẩm gia truyền chuẩn vị kinh kỳ với sự hòa quyện của hơn 8 loại nguyên liệu: đậu xanh tán nhuyễn, đậu đỏ bùi dẻo, cùi bưởi giòn sần sật, trân châu nhân dừa và nước cốt dừa tươi sánh mịn béo ngậy.',
    price: 35000,
    originalPrice: 40000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 4,
    categoryName: 'Chè thập cẩm',
    badge: 'best-seller',
    rating: 4.9,
    reviewCount: 128,
    toppings: ['Trân châu trắng', 'Dừa tươi sợi', 'Thạch đen sương sáo'],
    ingredients: ['Đậu xanh cà vỏ', 'Đậu đỏ loại 1', 'Nước cốt dừa Bến Tre', 'Đường phèn Quảng Ngãi', 'Lá dứa tươi'],
    nutrition: {
      calories: '285 kcal',
      sugar: '18g',
      fat: '5.2g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5-7 phút',
    isAvailable: true
  },
  {
    id: 2,
    slug: 'che-thai-sau-rieng',
    name: 'Chè Thái Sầu Riêng Tươi',
    shortDescription: 'Cơm sầu riêng Ri6 tươi nguyên chất, mít thái vàng giòn, thạch lá dứa',
    description: 'Bùng nổ vị giác với cơm sầu riêng Ri6 Tây Nguyên tươi rói được bóc hạt trong ngày, kết hợp cùng sợi mít giòn ngọt, hạt é, sương sa hạt lựu và nước sữa dừa béo thơm ngất ngây.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 3,
    categoryName: 'Chè trái cây',
    badge: 'signature',
    rating: 4.9,
    reviewCount: 215,
    toppings: ['Cơm sầu riêng thêm', 'Mít thái giòn', 'Thạch củ năng'],
    ingredients: ['Sầu riêng Ri6 tươi', 'Mít tố nữ & mít thái', 'Sữa tươi thanh trùng', 'Cốt dừa non', 'Thạch ngọc trai'],
    nutrition: {
      calories: '340 kcal',
      sugar: '24g',
      fat: '8.5g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5-10 phút',
    isAvailable: true
  },
  {
    id: 3,
    slug: 'che-khuc-bach',
    name: 'Chè Khúc Bạch Phô Mai Hạnh Nhân',
    shortDescription: 'Khúc bạch phô mai mềm tan, nhãn lồng mọng nước, hạnh nhân rang bơ',
    description: 'Từng viên khúc bạch phô mai sữa béo mịn tan ngay nơi đầu lưỡi, chìm đắm trong làn nước đường phèn hoa nhài thanh mát ngát hương, điểm xuyết nhãn lồng giòn ngọt và hạnh nhân lát nướng thơm lừng.',
    price: 42000,
    originalPrice: 48000,
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 5,
    categoryName: 'Chè khúc bạch',
    badge: 'best-seller',
    rating: 4.8,
    reviewCount: 94,
    toppings: ['Hạnh nhân nướng thêm', 'Khúc bạch phô mai thêm', 'Nhãn Hưng Yên'],
    ingredients: ['Whipping cream New Zealand', 'Sữa tươi không đường', 'Gelatin hữu cơ', 'Nhãn lồng', 'Hạnh nhân lát Mỹ'],
    nutrition: {
      calories: '260 kcal',
      sugar: '15g',
      fat: '7.0g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5 phút',
    isAvailable: true
  },
  {
    id: 4,
    slug: 'che-khoai-deo',
    name: 'Chè Khoai Dẻo Đài Loan Cốt Dừa',
    shortDescription: 'Viên khoai môn tím, khoai vàng bùi dẻo, thạch cao quy linh thảo mộc',
    description: 'Khoai lang vàng, khoai tím và khoai môn được nhào nặn công phu thành những viên dẻo quẹo thơm nức, ăn kèm thạch thảo mộc giải nhiệt, rưới đẫm nước cốt dừa thơm béo chuẩn vị Đài Loan.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 6,
    categoryName: 'Chè khoai dẻo',
    badge: 'best-seller',
    rating: 4.8,
    reviewCount: 89,
    toppings: ['Dừa non nạo', 'Thạch sương sáo', 'Trân châu đường đen'],
    ingredients: ['Khoai lang mật Đà Lạt', 'Khoai môn sáp', 'Bột năng cao cấp', 'Đường thốt nốt', 'Cốt dừa tươi'],
    nutrition: {
      calories: '310 kcal',
      sugar: '20g',
      fat: '4.8g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5-8 phút',
    isAvailable: true
  },
  {
    id: 5,
    slug: 'che-buoi-an-giang',
    name: 'Chè Bưởi Cốm Non An Giang',
    shortDescription: 'Cùi bưởi giòn sần sật khử đắng 100%, cốm non thơm lừng, đậu xanh mịn',
    description: 'Món chè đặc sản nức tiếng miền Tây Nam Bộ với cùi bưởi da xanh được sơ chế tỉ mỉ hết sạch vị đắng mà vẫn giữ độ giòn sần sật, hòa cùng cốm mộc làng Vòng thơm dịu và đỗ xanh cà vỏ bùi bùi.',
    price: 36000,
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 2,
    categoryName: 'Chè truyền thống',
    badge: 'signature',
    rating: 4.9,
    reviewCount: 167,
    toppings: ['Dừa nạo sợi', 'Cùi bưởi thêm', 'Đậu phộng rang'],
    ingredients: ['Cùi bưởi da xanh Bến Tre', 'Cốm non Hà Nội', 'Đậu xanh tiêu', 'Đường phèn tinh khiết'],
    nutrition: {
      calories: '240 kcal',
      sugar: '16g',
      fat: '3.5g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5 phút',
    isAvailable: true
  },
  {
    id: 6,
    slug: 'che-dau-do-hat-sen',
    name: 'Chè Đậu Đỏ Hạt Sen Cốt Dừa',
    shortDescription: 'Đậu đỏ hạt to ninh nhừ thơm mềm, hạt sen Đồng Tháp bùi ngậy bồi bổ',
    description: 'Món quà dinh dưỡng và giải nhiệt tuyệt hảo: đậu đỏ tuyển chọn ninh nhừ mềm thơm kết hợp hạt sen tươi Đồng Tháp bùi ngậy, thanh nhiệt an thần, ăn nóng hay lạnh đều cực kỳ cuốn hút.',
    price: 32000,
    originalPrice: 38000,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 2,
    categoryName: 'Chè truyền thống',
    badge: 'sale',
    rating: 4.7,
    reviewCount: 78,
    toppings: ['Trân châu hoàng kim', 'Cốt dừa thêm'],
    ingredients: ['Đậu đỏ Tây Bắc', 'Hạt sen tươi Đồng Tháp', 'Đường hoa mai', 'Nước cốt dừa tươi'],
    nutrition: {
      calories: '220 kcal',
      sugar: '14g',
      fat: '2.8g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5 phút',
    isAvailable: true
  },
  {
    id: 7,
    slug: 'che-hat-sen-long-nhan',
    name: 'Chè Hạt Sen Long Nhãn Tiến Vua',
    shortDescription: 'Hạt sen Huế lồng trong cùi nhãn Hưng Yên dày cùi giòn ngọt',
    description: 'Món tráng miệng quý tộc với từng hạt sen Huế thơm bùi được khéo léo bọc trọn bên trong múi long nhãn Hưng Yên trong vắt mọng nước. Nước đường phèn ướp hoa sen mang phong vị thanh tao khó quên.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 2,
    categoryName: 'Chè truyền thống',
    badge: 'signature',
    rating: 5.0,
    reviewCount: 142,
    toppings: ['Nhãn lồng thêm', 'Hạt sen thêm'],
    ingredients: ['Hạt sen hồ Tịnh Tâm Huế', 'Nhãn lồng Hưng Yên', 'Đường phèn kết tinh tự nhiên', 'Nước hoa nhài'],
    nutrition: {
      calories: '210 kcal',
      sugar: '16g',
      fat: '1.2g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5-7 phút',
    isAvailable: true
  },
  {
    id: 8,
    slug: 'che-dua-dam-hai-phong',
    name: 'Chè Dừa Dầm Hải Phòng',
    shortDescription: 'Thạch dừa non giòn mát, dừa non nạo, trân châu nhân dừa giòn rụm',
    description: 'Cơn lốc chè dừa dầm trứ danh đất Cảng với sự kết hợp đỉnh cao từ dừa: dừa non nạo sợi sần sật, thạch dừa thanh mát, trân châu nhân cùi dừa giòn tan ngập trong sữa dừa béo ngậy lạnh buốt.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 3,
    categoryName: 'Chè trái cây',
    badge: 'new',
    rating: 4.8,
    reviewCount: 65,
    toppings: ['Dừa khô giòn', 'Trân châu nhân dừa'],
    ingredients: ['Cơm dừa non Bến Tre', 'Nước dừa xiêm', 'Sữa đặc nguyên kem', 'Thạch rau câu dừa'],
    nutrition: {
      calories: '320 kcal',
      sugar: '21g',
      fat: '9.2g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5 phút',
    isAvailable: true
  },
  {
    id: 9,
    slug: 'che-xoai-tran-chau',
    name: 'Chè Xoài Trân Châu Cốt Dừa',
    shortDescription: 'Xoài Cát Chu chín mọng vàng ươm, trân châu sương sa, cốt dừa thơm ngát',
    description: 'Vị chua ngọt thanh mát tự nhiên từ những quả xoài Cát Chu Đồng Tháp chín cây xay nhuyễn mịn màng, kết hợp các miếng xoài tươi xắt hạt lựu và trân châu ngọc trai dẻo giòn.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 3,
    categoryName: 'Chè trái cây',
    badge: 'new',
    rating: 4.8,
    reviewCount: 52,
    toppings: ['Xoài tươi xắt miếng', 'Trân châu trắng'],
    ingredients: ['Xoài Cát Chu chín cây', 'Cốt dừa tươi ép lạnh', 'Trân châu giòn 3Q', 'Bột báng lá dứa'],
    nutrition: {
      calories: '250 kcal',
      sugar: '19g',
      fat: '4.1g',
      serving: '1 cốc 450ml'
    },
    prepTime: '5-7 phút',
    isAvailable: true
  },
  {
    id: 10,
    slug: 'nem-chua-ran-pho-co',
    name: 'Nem Chua Rán Phố Cổ (6 chiếc)',
    shortDescription: 'Vỏ xù giòn tan rụm, thịt nem dai dẻo đậm đà chấm tương ớt cay nồng',
    description: 'Món ăn vặt kinh điển của giới trẻ Hà Thành. Nem chua tẩm bột chiên xù vàng óng, bên ngoài giòn rụm bên trong dai dẻo thơm ngon béo bùi, chấm kèm tương ớt Mường Khương chuẩn bài.',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 7,
    categoryName: 'Đồ ăn vặt',
    badge: 'best-seller',
    rating: 4.9,
    reviewCount: 110,
    toppings: ['Tương ớt đặc biệt', 'Sốt mayonnaise cay'],
    ingredients: ['Thịt nạc mông tươi', 'Bì lợn sạch thái chỉ', 'Thính gạo nếp rang', 'Bột xù Nhật Bản'],
    nutrition: {
      calories: '350 kcal',
      sugar: '3g',
      fat: '14g',
      serving: 'Đĩa 6 chiếc'
    },
    prepTime: '8-10 phút',
    isAvailable: true
  },
  {
    id: 11,
    slug: 'khoai-lang-ken',
    name: 'Khoai Lang Kén Mật Ong',
    shortDescription: 'Khoai lang vàng nhuyễn bọc nước cốt dừa, áo mè đen chiên giòn rụm',
    description: 'Từng kén khoai vàng óng thơm lừng mùi nước cốt dừa và mè đen rang. Lớp vỏ giòn mỏng bao bọc phần ruột khoai mịn màng ngọt ngào, chấm mật ong hoa rừng ngọt dịu.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 7,
    categoryName: 'Đồ ăn vặt',
    rating: 4.7,
    reviewCount: 45,
    toppings: ['Sốt phô mai béo'],
    ingredients: ['Khoai lang Nhật ruột vàng', 'Nước cốt dừa', 'Mè đen', 'Bột chiên giòn hữu cơ'],
    nutrition: {
      calories: '280 kcal',
      sugar: '12g',
      fat: '7g',
      serving: 'Hộp 200g'
    },
    prepTime: '6-8 phút',
    isAvailable: true
  },
  {
    id: 12,
    slug: 'banh-tart-trung',
    name: 'Bánh Tart Trứng Phô Mai Nướng (2 chiếc)',
    shortDescription: 'Vỏ ngàn lớp xốp giòn, nhân kem trứng phô mai mềm tan béo ngậy thơm lừng',
    description: 'Vỏ bánh ngàn lớp giòn tan theo từng nhát cắn, ôm trọn lớp kem trứng phô mai nướng xém mặt dậy mùi thơm nức mũi, vị ngọt thanh béo ngậy không ngấy ăn kèm chè cực kỳ hợp vị.',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop'
    ],
    categoryId: 7,
    categoryName: 'Đồ ăn vặt',
    badge: 'new',
    rating: 4.8,
    reviewCount: 38,
    toppings: [],
    ingredients: ['Trứng gà tươi Ba Huân', 'Kem tươi whipping', 'Bột mì Pháp', 'Bơ lạt Anchor'],
    nutrition: {
      calories: '290 kcal',
      sugar: '15g',
      fat: '12g',
      serving: 'Set 2 chiếc'
    },
    prepTime: '5 phút',
    isAvailable: true
  }
]

export const mockProductReviews: Record<string, ProductReview[]> = {
  'che-thap-cam': [
    {
      id: 1,
      author: 'Nguyễn Thu Trang',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      rating: 5,
      date: 'Hôm qua',
      comment: 'Chè giao tới vẫn lạnh buốt, đá để riêng rất chu đáo! Cốt dừa béo thơm ngậy không bị ngọt gắt, topping đậu và trân châu nhiều ú ụ ăn no luôn.'
    },
    {
      id: 2,
      author: 'Trần Minh Hoàng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
      rating: 5,
      date: '3 ngày trước',
      comment: 'Vị chè truyền thống rất đúng điệu tuổi thơ, cùi bưởi giòn sần sật không hề có vị đắng. Mình chọn 70% đường ăn vừa miệng cực kỳ.'
    },
    {
      id: 3,
      author: 'Lê Hoàng Yến',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      rating: 4,
      date: 'Tuần trước',
      comment: 'Cốc to, đóng gói sạch sẽ có màng bọc chống tràn cẩn thận. Lần sau sẽ thử thêm chè Thái sầu riêng.'
    }
  ],
  'che-thai-sau-rieng': [
    {
      id: 4,
      author: 'Vũ Hải Đăng',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
      rating: 5,
      date: '2 ngày trước',
      comment: 'Sầu riêng tươi thật chứ không phải siro hay hương liệu! Cơm sầu béo ngậy nguyên múi to đùng, mít giòn ngọt ăn sướng tê người.'
    },
    {
      id: 5,
      author: 'Đỗ Phương Linh',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
      rating: 5,
      date: '4 ngày trước',
      comment: 'Món tủ của mình ở Chè Cốc! Đặt qua app giao trong 20 phút là tới nơi rồi, bao bì sang chảnh.'
    }
  ]
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find(p => p.slug === slug)
}

export function getRelatedProducts(currentId: number, categoryId: number, limit = 4): Product[] {
  const sameCategory = mockProducts.filter(p => p.categoryId === categoryId && p.id !== currentId)
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit)
  }
  const other = mockProducts.filter(p => p.id !== currentId && p.categoryId !== categoryId)
  return [...sameCategory, ...other].slice(0, limit)
}
