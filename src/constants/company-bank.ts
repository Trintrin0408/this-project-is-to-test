// Tài khoản ngân hàng thật của công ty dùng để sinh mã VietQR nhận cọc/quyết toán — do người dùng
// cung cấp trực tiếp (2026-07-21), KHÔNG có trong DB backend (bảng `deposits` chỉ có cột
// `qr_code_url` để LƯU kết quả, không có bảng cấu hình tài khoản ngân hàng công ty nào cả — xem
// docs/api_can_them.md). Hiện đang hardcode ở FE vì chỉ có 1 tài khoản nhận tiền duy nhất cho toàn hệ
// thống; nếu sau này cần đổi tài khoản theo từng khu vực/chi nhánh, phải chuyển sang cấu hình phía
// backend (mục 1 docs/api_can_them.md).
export const COMPANY_BANK_ACCOUNT = {
  /** BIN Vietcombank theo danh sách ngân hàng VietQR hỗ trợ. */
  bankBin: '970436',
  bankName: 'Vietcombank',
  accountNumber: '0828937456',
  /** VietQR hiển thị tên chủ TK dạng không dấu, viết hoa — tên thật trên tài khoản: "Cưới hỏi BN". */
  accountName: 'CUOI HOI BN',
} as const;

interface BuildVietQrImageUrlParams {
  amount: number;
  addInfo: string;
  /** 'qr_only' = chỉ mã QR (trang đã tự hiển thị số tiền/nội dung riêng, tránh lặp chữ trên ảnh). */
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

/** Sinh URL ảnh VietQR thật qua "Quick Link" công khai (img.vietqr.io) — không cần đăng ký/API key,
 * xem https://www.vietqr.io/danh-sach-api/quick-link. Vẫn là do FE tự nhúng trực tiếp
 * (COMPANY_BANK_ACCOUNT hardcode ở trên), không đi qua backend. */
export function buildVietQrImageUrl({ amount, addInfo, template = 'qr_only' }: BuildVietQrImageUrlParams): string {
  const { bankBin, accountNumber, accountName } = COMPANY_BANK_ACCOUNT;
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo,
    accountName,
  });
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-${template}.png?${params.toString()}`;
}
