import type { BadgeVariant } from '@/components/ui/Badge';
import { createMockStore, nextSequentialId } from './utils';
import { getAdminCustomers } from './customers';
import { ASSIGNEE_POOL } from './employees';

// ASSIGNEE_POOL re-export để các file đang import từ '@/mocks/db/quotations' (thay vì trực tiếp từ
// './employees') không cần sửa lại đường dẫn — giá trị THẬT lấy từ db/employees.ts (Task 18, nguồn
// nhân sự dùng chung duy nhất), không còn khai riêng ở đây nữa.
export { ASSIGNEE_POOL };

// Nguồn Quotation DUY NHẤT cho toàn bộ UI (Admin + Manager) — trước đây là src/mocks/adminQuotationsMock.ts,
// chuyển vào đây theo DEMO_CHECKLIST.md Task 15 (Giai đoạn 2 — hợp nhất mock data, 19 nơi dùng — nhiều
// nhất trong toàn bộ đợt migrate). Khác bản gốc ở điểm quan trọng nhất: mỗi báo giá giờ có `customerId`
// trỏ THẬT tới 1 bản ghi trong db/customers.ts (trước đây `customerName`/`customerPhone` tự sinh độc
// lập từ 1 pool 20 tên riêng của file này, không liên kết gì với db/customers.ts — cùng vấn đề đã sửa
// cho Order ở Task 14). Dữ liệu lưu qua localStorage (xem utils.ts createMockStore) — sống sót qua F5.
// Không dùng file này làm nguồn tham chiếu nghiệp vụ thật (trang /admin/quotations vẫn code THUẦN GIAO
// DIỆN theo CLAUDE.md mục 0 — không đọc docs/api/08-quotations.md, không gọi quotationApiService).
//
// QUAN TRỌNG — chỉ import ./customers ở đây (1 chiều), KHÔNG import ngược lại bất kỳ thứ gì từ file
// này trong customers.ts. orders.ts được phép import từ file này (đã có sẵn 1 chiều phụ thuộc an toàn
// customers -> quotations -> orders, xem ghi chú đầu customers.ts/orders.ts) — không đảo chiều.

export type AdminQuotationStatus = 'surveying' | 'draft' | 'approved' | 'rejected';

export const QUOTATION_STATUS_META: Record<AdminQuotationStatus, { label: string; variant: BadgeVariant; color: string }> = {
  surveying: { label: 'Đang khảo sát', variant: 'info', color: '#a855f7' },
  draft: { label: 'Bản nháp', variant: 'neutral', color: '#94a3b8' },
  approved: { label: 'Đã duyệt', variant: 'success', color: '#22c55e' },
  rejected: { label: 'Từ chối', variant: 'error', color: '#ef4444' },
};

export const ITEM_CATEGORY_OPTIONS = [
  'Dịch vụ (Sự kiện, MC, Nhạc...)',
  'Trang trí (Hoa, Backdrop...)',
  'Thiết bị (Âm thanh, Ánh sáng...)',
  'Khác',
];

// Danh mục thiết bị/dịch vụ mẫu để "thêm nhanh" khi sửa hạng mục báo giá — port từ
// docs/components/Quotations (1).tsx do người dùng cung cấp.
export interface QuotationCatalogueItem {
  name: string;
  category: string;
  unit: string;
  price: number;
}

export const QUOTATION_CATALOGUE: QuotationCatalogueItem[] = [
  { name: 'Hệ thống Loa Line Array RCF cao cấp', category: 'Thiết bị (Âm thanh, Ánh sáng...)', unit: 'Bộ', price: 18_000_000 },
  { name: 'Đèn Moving Head Beam 450 siêu sáng', category: 'Thiết bị (Âm thanh, Ánh sáng...)', unit: 'Cái', price: 1_200_000 },
  { name: 'Màn hình LED P3 Indoor siêu nét', category: 'Thiết bị (Âm thanh, Ánh sáng...)', unit: 'm2', price: 1_000_000 },
  { name: 'Khung truss nhôm treo đèn sân khấu', category: 'Thiết bị (Âm thanh, Ánh sáng...)', unit: 'Mét', price: 400_000 },
  { name: 'Sân khấu lắp ráp khung thép chịu lực', category: 'Khác', unit: 'm2', price: 300_000 },
  { name: 'Gói hoa tươi trang trí và Backdrop chụp ảnh', category: 'Trang trí (Hoa, Backdrop...)', unit: 'Gói', price: 15_000_000 },
  { name: 'MC Hoạt náo & dẫn chương trình chuyên nghiệp', category: 'Dịch vụ (Sự kiện, MC, Nhạc...)', unit: 'Buổi', price: 3_500_000 },
  { name: 'Ca sĩ hát chính dòng nhạc Acoustic', category: 'Dịch vụ (Sự kiện, MC, Nhạc...)', unit: 'Người', price: 5_000_000 },
];

export interface AdminQuotationLineItem {
  id: string;
  name: string;
  category: string;
  unit?: string;
  unitPrice: number;
  quantity: number;
  discount?: number; // giảm giá trên mỗi đơn vị (per item), số tiền
}

export interface QuotationSurveyAssignment {
  assigneeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

export interface AdminQuotationRow {
  quotationId: string;
  code: string;
  /** FK thật tới AdminCustomer.customerId (db/customers.ts) — Task 15, trước đây không tồn tại. */
  customerId: string;
  version: number;
  servicePackage: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  tablePrice: number;
  items: AdminQuotationLineItem[];
  subtotal: number; // tổng trước giảm
  discount: number; // giảm giá
  totalAmount: number; // tổng tiền (= subtotal - discount)
  status: AdminQuotationStatus;
  assignee: string;
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD — lần chỉnh sửa/đổi trạng thái gần nhất
  validUntil: string; // YYYY-MM-DD
  notes?: string;
  surveyAssignment?: QuotationSurveyAssignment;
}

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'rejected';

export interface AdminQuotationTimelineStep {
  key: string;
  label: string;
  detail: string;
  state: TimelineStepState;
}

export interface AdminQuotationHistoryEntry {
  timestamp: string;
  actor: string;
  action: string;
}

export interface AdminQuotationDetail {
  row: AdminQuotationRow;
  eventName: string;
  eventDate: string;
  venue: string;
  notes: string;
  customerCode: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  timeline: AdminQuotationTimelineStep[];
  history: AdminQuotationHistoryEntry[];
}

const PACKAGE_POOL = [
  'Gói Tiệc Kim Cương Luxury', 'Gói Tiệc Cưới Sảnh Vàng', 'Báo giá Tiệc Cưới Sảnh Bạc',
  'Gói Trang Trí Tiệc Ngoài Trời', 'Gói Dịch Vụ Tiệc Cưới Trọn Gói', 'Gói Tiệc Cưới Tiêu Chuẩn',
  'Gói Trang Trí Tiệc Cưới Cao Cấp', 'Gói Combo Nhà Hàng + Trang Trí',
];


// export để orders.ts dùng chung đúng 1 pool tên địa điểm thật (không tự khai riêng "Riverside
// Palace" hard-code như trước — xem DEMO_CHECKLIST.md mục "Chưa kế thừa dữ liệu").
export const VENUE_POOL = [
  'Riverside Palace (Sảnh Hera)', 'White Palace (Sảnh Rose)', 'Diamond Center (Sảnh Kim Cương)',
  'Grand Palace (Sảnh Ngọc)', 'Rex Hotel (Sảnh Hoàng Gia)', 'Adora Center (Sảnh Adora)',
];

const NOTES_POOL = [
  'Bố trí sảnh tiệc rộng rãi, hoa tươi cao cấp trang trí chính sảnh.',
  'Ưu tiên tông màu pastel, có khu vực chụp ảnh riêng cho cô dâu chú rể.',
  'Cần thêm màn hình LED sân khấu chính, MC song ngữ Việt - Anh.',
  'Khách mời có nhiều người lớn tuổi, ưu tiên bàn gần lối ra vào.',
  'Yêu cầu thực đơn có món chay cho một số bàn khách.',
];

const COMPANY_POOL = [
  'Công ty TNHH Minh Tuấn', 'Công ty Cổ phần Thương mại Phú Gia', 'Công ty TNHH Xây dựng Đại Phát',
  '', '', // một số khách hàng không có công ty/doanh nghiệp đi kèm
];

const HISTORY_ACTIONS_BY_STATUS: Record<AdminQuotationStatus, { label: string; hoursAgo: number }[]> = {
  surveying: [
    { label: 'Thêm sự kiện', hoursAgo: 120 },
    { label: 'Phân công khảo sát hiện trường', hoursAgo: 118 },
  ],
  draft: [
    { label: 'Thêm sự kiện', hoursAgo: 96 },
    { label: 'Tạo báo giá nháp', hoursAgo: 95 },
    { label: 'Cập nhật hạng mục', hoursAgo: 48 },
  ],
  approved: [
    { label: 'Thêm sự kiện', hoursAgo: 168 },
    { label: 'Phân công khảo sát hiện trường', hoursAgo: 166 },
    { label: 'Tạo báo giá nháp', hoursAgo: 120 },
    { label: 'Cập nhật hạng mục', hoursAgo: 96 },
    { label: 'Duyệt báo giá', hoursAgo: 24 },
  ],
  rejected: [
    { label: 'Thêm sự kiện', hoursAgo: 120 },
    { label: 'Phân công khảo sát hiện trường', hoursAgo: 118 },
    { label: 'Tạo báo giá nháp', hoursAgo: 72 },
    { label: 'Cập nhật hạng mục', hoursAgo: 48 },
    { label: 'Từ chối báo giá', hoursAgo: 24 },
  ],
};

const HISTORY_BASE = new Date('2026-07-10T18:00:00');

function lastUpdatedDate(status: AdminQuotationStatus): string {
  const minHoursAgo = Math.min(...HISTORY_ACTIONS_BY_STATUS[status].map((a) => a.hoursAgo));
  return new Date(HISTORY_BASE.getTime() - minHoursAgo * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatDateTime(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

function formatHistoryTimestamp(base: Date, hoursAgo: number): string {
  return formatDateTime(new Date(base.getTime() - hoursAgo * 60 * 60 * 1000));
}

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'surveying', label: 'Khảo sát hiện trường' },
  { key: 'draft', label: 'Tạo nháp' },
  { key: 'decision', label: 'Phê duyệt báo giá' },
  { key: 'converted', label: 'Chuyển đơn đặt' },
];

const TIMELINE_UPCOMING_DETAIL: Record<string, string> = {
  draft: 'Chưa tạo báo giá nháp',
  decision: 'Chờ phê duyệt',
  converted: 'Chờ chuyển đổi',
};

// approved/rejected là 2 nhánh loại trừ nhau ở CÙNG bước 'decision' (không phải bước tuần tự nối
// tiếp nhau) — dùng bảng tra vị trí riêng thay vì indexOf trên mảng trạng thái tuần tự như cũ.
const STATUS_STEP_INDEX: Record<AdminQuotationStatus, number> = {
  surveying: 0,
  draft: 1,
  approved: 2,
  rejected: 2,
};

function buildTimeline(status: AdminQuotationStatus, assignee: string, createdAt: string): AdminQuotationTimelineStep[] {
  const reachedIndex = STATUS_STEP_INDEX[status];
  const base = new Date(createdAt);

  return TIMELINE_STEPS.map((step, index) => {
    const label = step.key === 'decision' && status === 'rejected' ? 'Từ chối báo giá' : step.label;

    if (index > reachedIndex) {
      return {
        key: step.key,
        label,
        detail: TIMELINE_UPCOMING_DETAIL[step.key] ?? 'Chưa thực hiện',
        state: 'upcoming' as TimelineStepState,
      };
    }

    const hoursForward = (index + 1) * 4;
    const at = new Date(base.getTime() + hoursForward * 60 * 60 * 1000);
    const detail = `${formatDateTime(at)} bởi ${assignee}`;

    if (index < reachedIndex) {
      return { key: step.key, label, detail, state: 'done' as TimelineStepState };
    }
    if (step.key === 'decision' && status === 'rejected') {
      return { key: step.key, label, detail, state: 'rejected' as TimelineStepState };
    }
    return { key: step.key, label, detail, state: 'current' as TimelineStepState };
  });
}

function buildStatusSequence(counts: Record<AdminQuotationStatus, number>): AdminQuotationStatus[] {
  const order: AdminQuotationStatus[] = ['approved', 'draft', 'surveying', 'rejected'];
  const remaining = { ...counts };
  const total = order.reduce((sum, s) => sum + counts[s], 0);
  const sequence: AdminQuotationStatus[] = [];

  for (let i = 0; i < total; i++) {
    let best = order[0];
    let bestRatio = -1;
    for (const s of order) {
      if (remaining[s] <= 0) continue;
      const ratio = remaining[s] / counts[s];
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = s;
      }
    }
    sequence.push(best);
    remaining[best] -= 1;
  }
  return sequence;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Hạng mục "Thiết bị (Âm thanh, Ánh sáng...)" trong catalogue — dùng để mỗi báo giá mock có ít nhất
// 1 hạng mục thiết bị vật lý thật, để khối "Kiểm tra & dự báo khả dụng tồn kho thiết bị" ở trang
// Picklist chi tiết báo giá (equipmentCheckItems trong admin/quotations/[id]/page.tsx, lọc theo
// category chứa "Thiết bị"/"Thi công") có dữ liệu để hiển thị thay vì luôn rơi vào trạng thái rỗng.
const EQUIPMENT_CATALOGUE_POOL = QUOTATION_CATALOGUE.filter((c) => c.category.includes('Thiết bị'));

function generateMockQuotations(): AdminQuotationRow[] {
  const statusSequence = buildStatusSequence({ approved: 58, draft: 32, surveying: 20, rejected: 14 });
  const today = new Date('2026-07-10');

  // customerId/customerName/customerPhone thật lấy vòng qua danh sách khách hàng đã có trong
  // db/customers.ts — mỗi báo giá trỏ đúng 1 khách thật (không tự sinh tên/SĐT độc lập nữa).
  const customers = getAdminCustomers();

  return statusSequence.map((status, index) => {
    const customer = customers[index % customers.length];
    const guestCount = 150 + ((index * 37) % 350);
    const tablePrice = 4_500_000 + ((index * 250_000) % 3_500_000);
    const tableCount = Math.ceil(guestCount / 10);
    const decorTotal = 8_000_000 + ((index * 1_100_000) % 20_000_000);
    const equipment = EQUIPMENT_CATALOGUE_POOL[index % EQUIPMENT_CATALOGUE_POOL.length];
    const equipmentQuantity = 2 + (index % 6);
    const equipmentTotal = equipment.price * equipmentQuantity;
    const subtotal = tablePrice * tableCount + decorTotal + equipmentTotal;
    const discount = status === 'approved' ? Math.round(subtotal * ((index % 6) / 100)) : 0;
    const totalAmount = subtotal - discount;
    const createdAt = addDays(today, -((index * 3) % 90));
    // Mọi trạng thái sau "Bản nháp" đều đã trải qua bước phân công khảo sát (khớp với mốc "Phân
    // công khảo sát hiện trường" trong HISTORY_ACTIONS_BY_STATUS phía trên) — không thể ở trạng thái
    // "Đang khảo sát"/"Đã duyệt"/"Từ chối" mà thẻ "Phân công khảo sát báo giá" lại trống người phụ trách.
    const surveyAssignment =
      status === 'draft'
        ? undefined
        : {
            assigneeName: ASSIGNEE_POOL[(index + 1) % ASSIGNEE_POOL.length],
            date: addDays(new Date(createdAt), 2),
            time: '09:00',
            notes: '',
          };

    return {
      quotationId: `bg-${index + 1}`,
      code: `BG${String(index + 1).padStart(3, '0')}`,
      customerId: customer.customerId,
      version: 1 + (index % 3),
      servicePackage: PACKAGE_POOL[index % PACKAGE_POOL.length],
      customerName: customer.customerName,
      customerPhone: customer.phone,
      guestCount,
      tablePrice,
      items: [
        {
          id: `${index + 1}-tiec-ban`,
          name: 'Tiệc bàn - Menu ẩm thực cao cấp',
          category: 'Dịch vụ (Sự kiện, MC, Nhạc...)',
          unit: 'Bàn',
          unitPrice: tablePrice,
          quantity: tableCount,
          discount: 0,
        },
        {
          id: `${index + 1}-1`,
          name: 'Trang trí cổng hoa tươi sảnh, đèn led',
          category: ITEM_CATEGORY_OPTIONS[1],
          unit: 'Gói',
          unitPrice: decorTotal,
          quantity: 1,
          discount: 0,
        },
        {
          id: `${index + 1}-2`,
          name: equipment.name,
          category: equipment.category,
          unit: equipment.unit,
          unitPrice: equipment.price,
          quantity: equipmentQuantity,
          discount: 0,
        },
      ],
      subtotal,
      discount,
      totalAmount,
      status,
      assignee: ASSIGNEE_POOL[index % ASSIGNEE_POOL.length],
      createdAt,
      // "Cập nhật cuối" theo mốc chung của status (lastUpdatedDate) nhưng không được SỚM HƠN ngày tạo
      // — createdAt dao động rộng (0-89 ngày trước "hôm nay") trong khi lastUpdatedDate chỉ trong vòng
      // 7 ngày gần "hôm nay", nên với báo giá có createdAt gần "hôm nay" (index nhỏ), lastUpdatedDate có
      // thể rơi vào TRƯỚC createdAt nếu không chặn — vô lý (cập nhật trước khi tạo).
      updatedAt: [createdAt, lastUpdatedDate(status)].sort().at(-1) as string,
      validUntil: addDays(today, 20 + (index % 15)),
      surveyAssignment,
    };
  });
}

const quotationStore = createMockStore<AdminQuotationRow>('quotations', generateMockQuotations(), 'quotationId');

export function getAdminQuotations(): AdminQuotationRow[] {
  return quotationStore.getAll();
}

export function getAdminQuotationById(id: string): AdminQuotationRow | undefined {
  return quotationStore.getById(id);
}

export function addAdminQuotation(row: AdminQuotationRow): void {
  quotationStore.add(row);
}

export function updateAdminQuotation(id: string, patch: Partial<AdminQuotationRow>): void {
  quotationStore.update(id, patch);
}

export function deleteAdminQuotation(id: string): void {
  quotationStore.remove(id);
}

export function nextAdminQuotationCode(): string {
  return nextSequentialId(quotationStore.getAll(), 'code', 'BG', 3);
}

// Sinh chi tiết báo giá (sự kiện, khách hàng, hạng mục, tiến trình, lịch sử) từ AdminQuotationRow —
// tính lại mỗi lần gọi thay vì lưu riêng, để chi tiết luôn khớp với thay đổi mới nhất trên danh sách
// (sửa/đổi trạng thái ở trang tạo/sửa sẽ phản ánh ngay khi mở lại trang chi tiết).
export function getAdminQuotationDetail(id: string): AdminQuotationDetail | undefined {
  const row = getAdminQuotationById(id);
  if (!row) return undefined;

  const seedIndex = Number(row.quotationId.replace(/\D/g, '')) || 0;
  const eventDate = addDays(new Date(row.validUntil), 20 + (seedIndex % 10));

  const historyActions = HISTORY_ACTIONS_BY_STATUS[row.status];
  const history: AdminQuotationHistoryEntry[] = [...historyActions]
    .reverse()
    .map((entry) => ({
      timestamp: formatHistoryTimestamp(HISTORY_BASE, entry.hoursAgo),
      actor: row.assignee,
      action: entry.label,
    }));

  // customerEmail/customerAddress lấy TỪ bản ghi khách hàng thật (db/customers.ts) qua customerId FK
  // — trước đây tự sinh độc lập (slugifyEmail + ADDRESS_POOL riêng của file này), có thể lệch với
  // thông tin khách hàng thật hiển thị ở các trang khác. customerCompany vẫn lấy từ pool vì
  // AdminCustomer không có field công ty/doanh nghiệp.
  const customer = getAdminCustomers().find((c) => c.customerId === row.customerId);

  return {
    row,
    eventName: `Lễ cưới & Sự kiện của khách hàng ${row.customerName}`,
    eventDate,
    venue: VENUE_POOL[seedIndex % VENUE_POOL.length],
    notes: row.notes ?? NOTES_POOL[seedIndex % NOTES_POOL.length],
    customerCode: row.customerId,
    customerEmail: customer?.email ?? '',
    customerCompany: COMPANY_POOL[seedIndex % COMPANY_POOL.length],
    customerAddress: customer?.address ?? '',
    timeline: buildTimeline(row.status, row.assignee, row.createdAt),
    history,
  };
}
