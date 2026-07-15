// docs/api/08-quotations.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06. Kiến trúc đổi hẳn:
// Quotation giờ thuộc CUSTOMER (không thuộc Order). Order chỉ có `quotationId` FK optional, tham
// chiếu 1 quotation có sẵn để lưu vết — KHÔNG tự copy items từ quotation sang order.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model Quotation/QuotationItem),
// customer.route.ts, quotation.route.ts, quotation.validator.ts, quotation.service.ts.

export type QuotationStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface QuotationItem {
  quotationItemId?: string;
  quotationId?: string;
  itemId: string;
  itemName?: string; // snapshot lúc tạo, do backend tự tra từ Item rồi lưu lại
  quantity: number;
  price: number;
  discount?: number;
  lineTotal?: number; // generated column, chỉ có khi đọc lại (GET)
  // ⚠️ 2026-07-07: "nội dung báo giá" cho hạng mục — theo schema mới phát hiện trên MySQL local
  // (equipment_categories → equipment_type_details → equipment_type_configs → catalog_items, xem
  // docs/database.md mục 3), nội dung này lấy từ `equipment_type_details.description` khi
  // `catalog_items.description` của hạng mục để trống. Bảng quotation_items KHÔNG có cột riêng cho
  // nội dung này — phải resolve qua chuỗi item → config → type_detail lúc hiển thị. Backend hiện
  // chưa có join/endpoint nào cho tầng type_detail/config (docs/more-require.md mục (ii)), nên field
  // này KHÔNG đến từ API — luôn được tính ở client bằng src/utils/catalogItemContent.ts và hiển thị
  // in nghiêng khi là dữ liệu mock.
  content?: string;
}

// GET /api/v1/customers/:customerId/quotations
export interface Quotation {
  quotationId: string;
  quotationCode: string;
  customerId: string;
  version: string; // vd "v1.0" — chuỗi tự do, KHÔNG auto-increment
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  status: QuotationStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/v1/quotations/:id — kèm include items
export interface QuotationDetail extends Quotation {
  items: QuotationItem[];
}

// POST /api/v1/customers/:customerId/quotations, PUT /api/v1/quotations/:id
export interface SaveQuotationPayload {
  version?: string; // bắt buộc khi tạo mới, không dùng khi update
  notes?: string;
  items: { itemId: string; quantity: number; price: number; discount?: number }[]; // tối thiểu 1
}

// PATCH /api/v1/quotations/:id/status
export interface UpdateQuotationStatusPayload {
  status: QuotationStatus;
}
