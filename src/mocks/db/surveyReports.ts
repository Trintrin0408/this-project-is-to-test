import type { BadgeVariant } from '@/components/ui/Badge';
import { getAdminOrders } from './orders';
import { getAdminQuotations } from './quotations';
// SURVEY_ASSIGNEE_OPTIONS KHÔNG re-export ở đây (khác bản gốc adminSurveyReportsMock.ts) — vì file
// này giờ nằm trong barrel `db/index.ts` cùng với employees.ts (nguồn export chính thức của
// SURVEY_ASSIGNEE_OPTIONS), re-export lại sẽ gây xung đột tên qua `export *`. Import trực tiếp từ
// `@/mocks/db` (đã có sẵn qua `export * from './employees'`).
import { SURVEY_ASSIGNEE_OPTIONS } from './employees';

// Trang /admin/reports/survey (Báo cáo khảo sát) hiện code THUẦN GIAO DIỆN theo mục 0 CLAUDE.md,
// port từ docs/components/SurveySection.tsx do người dùng cung cấp (bố cục dạng drawer trượt từ
// phải, không phải trang chi tiết riêng). Trước đây là src/mocks/adminSurveyReportsMock.ts — chuyển
// vào đây theo DEMO_CHECKLIST.md Task 20. Store mock module-scope, cho list/thêm/sửa/xóa/xác nhận
// hoạt động qua lại trong phiên làm việc (mất khi reload). Không dùng file này làm nguồn tham chiếu
// nghiệp vụ thật — khác với src/types/survey.ts (model khảo sát thật dùng ở luồng Manager).

export type SurveyReportStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'CONFIRMED';

export const SURVEY_REPORT_STATUS_META: Record<SurveyReportStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: 'Nháp', variant: 'neutral' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
};

export interface SurveyMeasurement {
  key: string;
  value: string;
}

export interface SurveyRentalItem {
  name: string;
  quantity: number;
  notes: string;
}

export interface SurveyQuoteItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
}

export interface AdminSurveyReport {
  id: string; // BCKS-2026-0001
  orderId: string;
  customerName: string;
  eventName: string;
  surveyDate: string; // YYYY-MM-DD
  eventDate: string; // YYYY-MM-DD
  location: string;
  assignee: string;
  submittedTime: string; // "YYYY-MM-DD HH:mm"
  status: SurveyReportStatus;
  content: string;
  measurements: SurveyMeasurement[];
  notes: string;
  images: string[];
  rentalItems: SurveyRentalItem[];
  quoteItems: SurveyQuoteItem[];
  /** Báo giá được đối chiếu số liệu khảo sát — dùng ở mục "Đối chiếu khảo sát" tại chi tiết báo giá. */
  quotationId?: string;
}

// Đơn đặt mục tiêu để chọn khi tạo báo cáo khảo sát — DEMO_CHECKLIST.md Task 20: trỏ đơn THẬT từ
// db/orders.ts (trước đây là 3 bản ghi bịa `ĐĐ-2026-0099`/`0102`/`0115`, không khớp bất kỳ đơn nào
// trong db/orders.ts). Lọc theo trạng thái `NEW` (mới tạo, chưa xác nhận) vì đây là bước GẦN đúng
// nhất với "đơn đang chờ khảo sát" trong enum `BookingStatus` hiện có (chưa có trạng thái khảo sát
// riêng — xem CLAUDE.md mục 0 phần state machine Order chưa implement đầy đủ).
export const SURVEY_TARGET_ORDERS = getAdminOrders()
  .filter((o) => o.status === 'NEW')
  .map((o) => ({
    id: o.orderId,
    customerName: o.customerName,
    eventName: `Lễ cưới ${o.customerName}`,
    location: `Riverside Palace (${o.venue})`,
  }));

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1511578314322-379afb47686e?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=280&fit=crop',
];

const CONTENT_POOL = [
  'Mặt bằng sảnh tiệc rộng rãi, trần cao thuận tiện lắp đặt kết cấu treo đèn và backdrop sân khấu. Lối vào đủ rộng để vận chuyển thiết bị cỡ lớn.',
  'Sảnh có sẵn sân khấu cố định, cần bổ sung backdrop và hệ thống âm thanh ánh sáng rời. Lối vận chuyển thiết bị hẹp, cần chia nhỏ đợt vận chuyển.',
  'Không gian ngoài trời, cần phương án dự phòng thời tiết (bạt che, quạt hơi nước). Nguồn điện tại chỗ hạn chế, cần máy phát dự phòng.',
];

const NOTES_POOL = [
  'Ban quản lý sảnh yêu cầu hoàn tất setup trước 22h, tránh gây ồn khu vực lân cận.',
  'Thang máy chở hàng chỉ hoạt động đến 21h — cần sắp xếp vận chuyển thiết bị trước giờ đó.',
  'Cần xin phép trước với ban quản lý tòa nhà nếu dùng máy phát điện hoặc khoan lắp kết cấu.',
];

const RENTAL_ITEM_POOL: SurveyRentalItem[][] = [
  [
    { name: 'Khung sắt bọc 3m x 6m', quantity: 1, notes: 'Khung truss sân khấu chính' },
    { name: 'Hệ thống Loa sân khấu JBL JRX215', quantity: 4, notes: 'Kèm cục đẩy công suất lớn' },
    { name: 'Đèn Par LED 54 bóng', quantity: 12, notes: 'Ánh sáng ấm trang trí sảnh tiệc' },
  ],
  [
    { name: 'Sân khấu ghép di động', quantity: 1, notes: 'Cao 0.4m, trải thảm đỏ' },
    { name: 'Màn LED P3 sân khấu', quantity: 1, notes: 'Kích thước 4m x 3m' },
  ],
  [
    { name: 'Cổng hoa lụa cao cấp', quantity: 1, notes: 'Lắp tại lối vào chính' },
    { name: 'Bàn gallery ảnh cưới', quantity: 2, notes: 'Kèm khung ảnh trang trí' },
  ],
];

const QUOTE_ITEM_POOL: SurveyQuoteItem[][] = [
  [
    { name: 'Khung sắt bọc 3m x 6m (Báo giá nháp)', quantity: 1, unit: 'Bộ', price: 3_500_000, category: 'Thi công' },
    { name: 'Loa sân khấu JBL JRX215 (Báo giá nháp)', quantity: 4, unit: 'Bộ', price: 1_200_000, category: 'Thiết bị' },
    { name: 'Đèn Par LED 54 bóng (Báo giá nháp)', quantity: 12, unit: 'Cái', price: 250_000, category: 'Thiết bị' },
  ],
  [
    { name: 'Sân khấu ghép di động (Báo giá nháp)', quantity: 1, unit: 'Bộ', price: 1_500_000, category: 'Thi công' },
    { name: 'Màn LED P3 (Báo giá nháp)', quantity: 1, unit: 'Bộ', price: 8_000_000, category: 'Thiết bị' },
  ],
  [
    { name: 'Cổng hoa lụa cao cấp (Báo giá nháp)', quantity: 1, unit: 'Bộ', price: 3_500_000, category: 'Trang trí' },
    { name: 'Bàn gallery ảnh cưới (Báo giá nháp)', quantity: 2, unit: 'Cái', price: 800_000, category: 'Trang trí' },
  ],
];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateMockReports(): AdminSurveyReport[] {
  const today = new Date('2026-07-10');
  const statusSequence: SurveyReportStatus[] = [
    ...Array(10).fill('CONFIRMED'),
    ...Array(8).fill('PENDING_CONFIRM'),
    ...Array(4).fill('DRAFT'),
  ];

  return statusSequence.map((status, index) => {
    const order = SURVEY_TARGET_ORDERS[index % SURVEY_TARGET_ORDERS.length];
    const surveyDate = addDays(today, -(index * 2 + 1));
    const eventDate = addDays(today, 7 + (index % 10) * 3);
    const assignee = SURVEY_ASSIGNEE_OPTIONS[index % SURVEY_ASSIGNEE_OPTIONS.length];

    return {
      id: `BCKS-2026-${String(index + 1).padStart(4, '0')}`,
      orderId: order.id,
      customerName: order.customerName,
      eventName: order.eventName,
      surveyDate,
      eventDate,
      location: order.location,
      assignee,
      submittedTime: `${surveyDate} 09:30`,
      status,
      content: CONTENT_POOL[index % CONTENT_POOL.length],
      measurements: [
        { key: 'Diện tích sân khấu chính', value: `${8 + (index % 5)}m (rộng) x ${4 + (index % 3)}m (sâu) x 0.6m (cao)` },
        { key: 'Chiều cao trần (Clearance)', value: `${(4.5 + (index % 3) * 0.3).toFixed(1)}m đến dầm treo đèn` },
        { key: 'Công suất nguồn điện khả dụng', value: index % 3 === 0 ? '3-phase 380V / 60A' : '1-phase 220V / 32A' },
        { key: 'Lối vận chuyển đồ', value: `Thang máy chở hàng số ${(index % 4) + 1} (1.5 tấn)` },
      ],
      notes: NOTES_POOL[index % NOTES_POOL.length],
      images: [IMAGE_POOL[index % IMAGE_POOL.length], IMAGE_POOL[(index + 1) % IMAGE_POOL.length]],
      rentalItems: RENTAL_ITEM_POOL[index % RENTAL_ITEM_POOL.length],
      quoteItems: QUOTE_ITEM_POOL[index % QUOTE_ITEM_POOL.length],
    };
  });
}

// Số lượng "chênh lệch" so với báo giá gốc, xen kẽ theo index để demo đủ 3 trạng thái Khớp/Phát
// sinh/Giảm bớt ở khối đối chiếu khảo sát.
const QUANTITY_DELTA_CYCLE = [0, 2, -1, 1];

function buildComparisonQuoteItems(quotation: ReturnType<typeof getAdminQuotations>[number], poolIndex: number): SurveyQuoteItem[] {
  // Phần khớp với hạng mục báo giá gốc (có chênh lệch số lượng thực tế khảo sát) ...
  const fromQuotation: SurveyQuoteItem[] = quotation.items.map((item, i) => {
    const delta = QUANTITY_DELTA_CYCLE[(poolIndex + i) % QUANTITY_DELTA_CYCLE.length];
    return {
      name: item.name,
      quantity: Math.max(1, item.quantity + delta),
      unit: item.unit ?? 'Cái',
      price: item.unitPrice,
      category: item.category,
    };
  });
  // ...cộng thêm 1-2 thiết bị phát sinh mới phát hiện lúc khảo sát thực địa (chưa có trong báo giá
  // gốc) để khối kiểm tra tồn kho có dữ liệu minh họa.
  const discovered = QUOTE_ITEM_POOL[poolIndex % QUOTE_ITEM_POOL.length].slice(0, 2);
  return [...fromQuotation, ...discovered];
}

// Gắn báo cáo khảo sát vào TẤT CẢ báo giá đang ở trạng thái "Đang khảo sát" (mock) — dùng cho khối
// "Đối chiếu khảo sát" ở chi tiết báo giá. Trạng thái "Đang khảo sát" theo nghiệp vụ nghĩa là khảo
// sát viên đã nộp báo cáo, nên mọi báo giá ở trạng thái này đều phải có báo cáo liên kết (không giới
// hạn số lượng liên kết), nếu không nút "Xem đối chiếu khảo sát" sẽ không hiện ra cho phần lớn báo
// giá đang khảo sát. quoteItems của báo cáo được sinh dựa trên chính hạng mục báo giá gốc (có biến
// thiên số lượng) để phần so sánh Khớp/Phát sinh/Giảm bớt có ý nghĩa.
function linkReportsToSurveyingQuotations(reports: AdminSurveyReport[]): AdminSurveyReport[] {
  const surveyingQuotations = getAdminQuotations().filter((q) => q.status === 'surveying');
  const linkCount = Math.min(reports.length, surveyingQuotations.length);
  return reports.map((report, index) => {
    if (index >= linkCount) return report;
    const quotation = surveyingQuotations[index];
    return { ...report, quotationId: quotation.quotationId, quoteItems: buildComparisonQuoteItems(quotation, index) };
  });
}

let store: AdminSurveyReport[] = linkReportsToSurveyingQuotations(generateMockReports());

export function getAdminSurveyReports(): AdminSurveyReport[] {
  return store;
}

export function getAdminSurveyReportById(id: string): AdminSurveyReport | undefined {
  return store.find((r) => r.id === id);
}

export function getSurveyReportByQuotationId(quotationId: string): AdminSurveyReport | undefined {
  return store.find((r) => r.quotationId === quotationId);
}

export function addAdminSurveyReport(report: AdminSurveyReport): void {
  store = [report, ...store];
}

export function updateAdminSurveyReport(id: string, patch: Partial<AdminSurveyReport>): void {
  store = store.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export function deleteAdminSurveyReport(id: string): void {
  store = store.filter((r) => r.id !== id);
}

export function nextAdminSurveyReportId(): string {
  const maxNum = store.reduce((max, r) => {
    const num = Number(r.id.split('-').pop());
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `BCKS-2026-${String(maxNum + 1).padStart(4, '0')}`;
}
