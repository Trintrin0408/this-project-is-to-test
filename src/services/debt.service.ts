// Không có API /debt riêng — công nợ Supplier suy ra (derive) từ
// GET /supplier-transactions?paymentStatus=UNPAID phía client (xem procurement.service.ts),
// không cần gọi qua service riêng này. Giữ export rỗng để không phá vỡ import hiện có.
export const debtApiService = {};
