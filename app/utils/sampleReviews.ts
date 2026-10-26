import type { ProductReview } from '#shared/types/catalog'

// Placeholder reviews shown on product pages until reviews are stored in the DB (Phase D)
export const sampleReviews: Record<string, ProductReview[]> = {
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
