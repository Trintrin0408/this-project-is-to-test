import type { BadgeVariant } from '@/components/ui/Badge';
import { getStatusBadgeVariant } from '@/components/ui/Badge';
import { ORDER_STATUS_LABEL } from '@/constants/order-status';
import type { OrderStatus } from '@/types/order';
import { getAdminQuotations } from './quotations';
import { getAdminCustomers, getAdminCustomerById, type AdminCustomer } from './customers';
import { createMockStore, nextSequentialId } from './utils';
import { COORDINATOR_POOL } from './employees';

// COORDINATOR_POOL re-export để các file đang import từ '@/mocks/db/orders' (thay vì trực tiếp từ
// './employees') không cần sửa lại đường dẫn — giá trị THẬT lấy từ db/employees.ts (Task 18, nguồn
// nhân sự dùng chung duy nhất), không còn khai riêng ở đây nữa.
export { COORDINATOR_POOL };

// Nguồn Order DUY NHẤT cho toàn bộ UI (Admin + Manager) — trước đây là src/mocks/adminOrdersMock.ts,
// chuyển vào đây theo DEMO_CHECKLIST.md Task 14 (Giai đoạn 2 — hợp nhất mock data). Khác bản gốc ở
// điểm quan trọng nhất: mỗi đơn giờ có `customerId` trỏ THẬT tới 1 bản ghi trong db/customers.ts
// (trước đây customerName/customerPhone là chuỗi tự sinh độc lập, không có FK nào cả — xem báo cáo
// audit trong lịch sử task). Dữ liệu lưu qua localStorage (utils.ts createMockStore).
//
// QUAN TRỌNG — chỉ import customers.ts theo 1 CHIỀU DUY NHẤT (file này -> customers.ts): customers.ts
// KHÔNG được import ngược lại bất kỳ giá trị nào từ file này (kể cả bên trong 1 hàm) — import ES
// module là eager theo toàn bộ statement, không phải theo thời điểm gọi hàm, nên vòng lặp 2 chiều sẽ
// gây "Cannot access '...' before initialization" lúc chạy (đã gặp thật lúc build Task 13/14, xem
// lịch sử task — ban đầu tưởng "gọi trong hàm thì lazy nên an toàn" là SAI). getAdminCustomerDetail
// đặt ở ĐÂY (không phải customers.ts) chính vì lý do này — cần dữ liệu cả 2 phía mà chỉ file này có
// sẵn phụ thuộc 1 chiều an toàn.

export type BookingStatus = OrderStatus;

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; variant: BadgeVariant; color: string }> = {
  NEW: { label: ORDER_STATUS_LABEL.NEW, variant: getStatusBadgeVariant('NEW'), color: '#94a3b8' },
  CONFIRMED: { label: ORDER_STATUS_LABEL.CONFIRMED, variant: getStatusBadgeVariant('CONFIRMED'), color: '#3b82f6' },
  IN_PROGRESS: { label: ORDER_STATUS_LABEL.IN_PROGRESS, variant: getStatusBadgeVariant('IN_PROGRESS'), color: '#f97316' },
  COMPLETED: { label: ORDER_STATUS_LABEL.COMPLETED, variant: getStatusBadgeVariant('COMPLETED'), color: '#22c55e' },
  CANCELLED: { label: ORDER_STATUS_LABEL.CANCELLED, variant: getStatusBadgeVariant('CANCELLED'), color: '#ef4444' },
};

export const VENUE_OPTIONS = ['Sảnh Hera', 'Sảnh Artemis', 'Sảnh Zeus', 'Sảnh Aphrodite'];
export const PACKAGE_OPTIONS = ['Lễ cưới - Gói Platinum', 'Lễ cưới - Gói Diamond', 'Lễ cưới - Gói Gold', 'Lễ cưới - Gói Silver', 'Lễ cưới - Gói Standard'];

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface SurveyAssignment {
  assigneeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

export type PaymentStatus = 'UNPAID' | 'DEPOSITED' | 'PAID';

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  UNPAID: { label: 'Chưa đặt cọc', variant: 'warning' },
  DEPOSITED: { label: 'Đã đặt cọc 50%', variant: 'info' },
  PAID: { label: 'Đã thanh toán 100%', variant: 'success' },
};

export type OrderItemSource = 'internal' | 'external';

export const ORDER_ITEM_SOURCE_META: Record<OrderItemSource, { label: string; variant: BadgeVariant }> = {
  internal: { label: 'Kho nhà', variant: 'info' },
  external: { label: 'Thuê ngoài', variant: 'warning' },
};

export type OrderItemStatus = 'confirmed' | 'preparing' | 'pending' | 'optional';

export const ORDER_ITEM_STATUS_META: Record<OrderItemStatus, { label: string; variant: BadgeVariant }> = {
  confirmed: { label: 'Đã xác nhận', variant: 'success' },
  preparing: { label: 'Đang chuẩn bị', variant: 'info' },
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  optional: { label: 'Tùy chọn', variant: 'neutral' },
};

export interface AdminOrderLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  status: OrderItemStatus;
  source: OrderItemSource;
  preparedQty: number;
  preparedBy: string;
}

export const LIVE_SHOW_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'backdrop', label: 'Bàn giao nghiệm thu bối cảnh khung Backdrop / LED' },
  { key: 'soundTest', label: 'Thử âm thanh (Sound-check) micro không dây tốt' },
  { key: 'powerBackup', label: 'Đấu nối tủ điện nguồn dự phòng khẩn cấp' },
  { key: 'operatorReady', label: 'Kỹ thuật viên đứng Mixer & bàn ánh sáng túc trực' },
];

export interface AdminOrderRow {
  orderId: string; // DD0001
  /** FK thật tới AdminCustomer.customerId (db/customers.ts) — Task 14, trước đây không tồn tại. */
  customerId: string;
  customerName: string;
  customerPhone: string;
  weddingDate: string; // YYYY-MM-DD
  venue: string;
  guestCount: number;
  totalPrice: number;
  depositAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  coordinatorName: string;
  packageType: string;
  notes: string;
  checklist: ChecklistItem[];
  surveyAssignment?: SurveyAssignment;
  quotationId?: string;
  items: AdminOrderLineItem[];
  liveChecklist: Record<string, boolean>;
  /** Thời điểm Manager đánh dấu đã xuất kho toàn bộ phiếu chuẩn bị (picklist) của đơn — dùng cho màn
   * hình "Pick-list xuất kho" độc lập, khác preparedQty vốn theo dõi tiến độ chuẩn bị từng hạng mục. */
  pickedUpAt?: string;
  /** Đóng đơn hàng — mốc cuối cùng trong vòng đời vận hành, khác trạng thái COMPLETED (có thể đã hoàn
   * thành sự kiện nhưng chưa chốt sổ). Khi đã đóng, không cho đổi trạng thái/hủy đơn nữa. */
  closedAt?: string;
  closedBy?: string;
  disputeLogs: DisputeLogEntry[];
}

/** Ghi log nội bộ khi xử lý tranh chấp với khách hàng — giao tiếp thật diễn ra ngoài hệ thống (gọi
 * điện, Zalo...), hệ thống chỉ lưu vết nội bộ (mục 1 CLAUDE.md: "Xử lý tranh chấp... chỉ ghi log nội
 * bộ"). */
export interface DisputeLogEntry {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
  resolved: boolean;
}


function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildChecklist(index: number): ChecklistItem[] {
  const tasks = ['Xác nhận thực đơn với khách', 'Chốt số lượng bàn tiệc', 'Kiểm tra thiết bị âm thanh', 'Xác nhận nhân sự phục vụ'];
  return tasks.map((task, i) => ({ id: `${index}-cl-${i}`, task, completed: (index + i) % 3 !== 0 }));
}

// Trạng thái đơn càng tiến xa thì càng có khả năng đã đóng cọc/thanh toán — mô phỏng hợp lý cho mock,
// không phải quy tắc nghiệp vụ thật (xem quy tắc thật trong CLAUDE.md nếu cần đối chiếu sau này).
function derivePaymentStatus(status: BookingStatus, index: number): PaymentStatus {
  if (status === 'COMPLETED') return 'PAID';
  if (status === 'CANCELLED') return 'UNPAID';
  if (status === 'IN_PROGRESS') return index % 4 === 0 ? 'PAID' : 'DEPOSITED';
  if (status === 'CONFIRMED') return index % 3 === 0 ? 'UNPAID' : 'DEPOSITED';
  return 'UNPAID';
}

// Xuất ra để trang tạo đơn đặt mới sinh sẵn hạng mục mặc định hợp lý (mock) cho đơn vừa tạo.
export function buildOrderItems(orderId: string, totalPrice: number, venue: string, status: BookingStatus): AdminOrderLineItem[] {
  const banquetCost = Math.round(totalPrice * 0.55);
  const decorCost = Math.round(totalPrice * 0.2);
  const mcSoundCost = Math.round(totalPrice * 0.15);
  const filmingCost = totalPrice - banquetCost - decorCost - mcSoundCost;
  const tableCount = Math.max(1, Math.round(totalPrice / 25_000_000));

  const isPrepared = status === 'IN_PROGRESS' || status === 'COMPLETED';

  return [
    {
      id: `${orderId}-1`,
      category: 'Tiệc bàn',
      description: `Thực đơn tiệc cưới cao cấp, phục vụ ${tableCount} bàn`,
      quantity: tableCount,
      unitPrice: Math.round(banquetCost / tableCount),
      status: 'confirmed',
      source: 'internal',
      preparedQty: isPrepared ? tableCount : 0,
      preparedBy: isPrepared ? 'Kho bếp trung tâm' : '',
    },
    {
      id: `${orderId}-2`,
      category: 'Trang trí sảnh',
      description: `Trang trí ${venue} theo phong cách đã chọn`,
      quantity: 1,
      unitPrice: decorCost,
      status: 'preparing',
      source: 'internal',
      preparedQty: isPrepared ? 1 : 0,
      preparedBy: isPrepared ? 'Tổ trang trí' : '',
    },
    {
      id: `${orderId}-3`,
      category: 'MC & âm thanh',
      description: 'MC dẫn chương trình, dàn âm thanh ánh sáng sân khấu',
      quantity: 1,
      unitPrice: mcSoundCost,
      status: 'confirmed',
      source: 'external',
      preparedQty: status === 'COMPLETED' ? 1 : 0,
      preparedBy: status === 'COMPLETED' ? 'Đối tác Âm thanh Gold' : '',
    },
    {
      id: `${orderId}-4`,
      category: 'Quay phim',
      description: 'Ê-kíp quay phim, chụp ảnh phóng sự cưới',
      quantity: 1,
      unitPrice: Math.max(filmingCost, 0),
      status: 'optional',
      source: 'external',
      preparedQty: 0,
      preparedBy: '',
    },
  ];
}

function generateMockOrders(): AdminOrderRow[] {
  const today = new Date('2026-07-10');
  const statusSequence: BookingStatus[] = [
    ...Array(10).fill('NEW'),
    ...Array(12).fill('CONFIRMED'),
    ...Array(20).fill('IN_PROGRESS'),
    ...Array(16).fill('COMPLETED'),
    ...Array(6).fill('CANCELLED'),
  ];

  // customerId thật lấy vòng qua danh sách khách hàng đã có trong db/customers.ts — mỗi đơn trỏ
  // đúng 1 khách thật, customerName/customerPhone lấy TỪ bản ghi đó (không tự sinh độc lập nữa).
  const customers = getAdminCustomers();

  return statusSequence.map((status, index) => {
    const customer = customers[index % customers.length];
    const guestCount = 150 + ((index * 41) % 350);
    const totalPrice = 180_000_000 + ((index * 15_500_000) % 420_000_000);
    const dayOffset = status === 'COMPLETED' ? -(10 + index * 3) : 5 + index * 3;
    const venue = VENUE_OPTIONS[index % VENUE_OPTIONS.length];
    const orderId = `DD${String(index + 1).padStart(4, '0')}`;

    return {
      orderId,
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerPhone: customer.phone,
      weddingDate: addDays(today, dayOffset),
      venue,
      guestCount,
      totalPrice,
      depositAmount: Math.round(totalPrice * 0.3),
      status,
      paymentStatus: derivePaymentStatus(status, index),
      coordinatorName: COORDINATOR_POOL[index % COORDINATOR_POOL.length],
      packageType: PACKAGE_OPTIONS[index % PACKAGE_OPTIONS.length],
      notes: index % 4 === 0 ? 'Khách yêu cầu trang trí tông màu pastel, có khu vực chụp ảnh riêng.' : '',
      checklist: buildChecklist(index),
      items: buildOrderItems(orderId, totalPrice, venue, status),
      liveChecklist: {},
      disputeLogs: [],
    };
  });
}

const orderStore = createMockStore<AdminOrderRow>('orders', generateMockOrders(), 'orderId');

export function getAdminOrders(): AdminOrderRow[] {
  return orderStore.getAll();
}

export function getAdminOrderById(id: string): AdminOrderRow | undefined {
  return orderStore.getById(id);
}

/** Task 14 — điểm chứng minh quan hệ chéo thật: đơn hàng của đúng 1 khách hàng cụ thể. */
export function getOrdersByCustomerId(customerId: string): AdminOrderRow[] {
  return orderStore.getAll().filter((row) => row.customerId === customerId);
}

export function addAdminOrder(row: AdminOrderRow): void {
  orderStore.add(row);
}

export function updateAdminOrder(id: string, patch: Partial<AdminOrderRow>): void {
  orderStore.update(id, patch);
}

export function deleteAdminOrder(id: string): void {
  orderStore.remove(id);
}

export function nextAdminOrderId(): string {
  return nextSequentialId(orderStore.getAll(), 'orderId', 'DD', 4);
}

export function updateAdminOrderItem(orderId: string, itemId: string, patch: Partial<AdminOrderLineItem>): void {
  const row = orderStore.getById(orderId);
  if (!row) return;
  orderStore.update(orderId, { items: row.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) });
}

export function prepareAllAdminOrderItems(orderId: string, preparedBy: string): void {
  const row = orderStore.getById(orderId);
  if (!row) return;
  orderStore.update(orderId, {
    items: row.items.map((item) => ({ ...item, preparedQty: item.quantity, preparedBy: item.preparedBy || preparedBy })),
  });
}

export function updateAdminOrderLiveChecklist(orderId: string, key: string, checked: boolean): void {
  const row = orderStore.getById(orderId);
  if (!row) return;
  orderStore.update(orderId, { liveChecklist: { ...row.liveChecklist, [key]: checked } });
}

/** Đóng đơn hàng — mốc cuối cùng trong vòng đời vận hành, do Manager thực hiện thủ công sau khi đã
 * quyết toán + hoàn kho xong (mục 1 CLAUDE.md: "Mọi cột mốc quan trọng cần xác nhận thủ công bởi
 * Manager"). Khác trạng thái COMPLETED (sự kiện đã diễn ra xong nhưng có thể chưa chốt sổ). */
export function closeAdminOrder(orderId: string, closedBy: string): void {
  orderStore.update(orderId, { closedAt: new Date().toISOString(), closedBy });
}

export function addAdminOrderDispute(orderId: string, note: string, createdBy: string): void {
  const row = orderStore.getById(orderId);
  if (!row) return;
  orderStore.update(orderId, {
    disputeLogs: [
      { id: `DSP-${orderId}-${row.disputeLogs.length + 1}`, note, createdBy, createdAt: new Date().toISOString(), resolved: false },
      ...row.disputeLogs,
    ],
  });
}

export function resolveAdminOrderDispute(orderId: string, disputeId: string): void {
  const row = orderStore.getById(orderId);
  if (!row) return;
  orderStore.update(orderId, { disputeLogs: row.disputeLogs.map((d) => (d.id === disputeId ? { ...d, resolved: true } : d)) });
}

// ---------------------------------------------------------------------------
// Phiếu chuẩn bị (Picklist) xuất kho theo đơn — tab "Thiết bị & Kho hàng" ở trang chi tiết đơn đặt
// thực chất là màn hình làm việc (working view) để chuẩn bị kho; phiếu này là bản chốt/xuất ra từ
// đúng dữ liệu hạng mục của đơn tại thời điểm bấm nút, dùng để in/giao cho tổ kho. Mã phiếu sinh 1 lần
// và giữ nguyên cho các lần xem lại sau trong phiên làm việc (Map module-scope, mất khi tải lại trang
// — không bọc localStorage vì chỉ là mã phiếu tạm sinh lại được, không phải dữ liệu nghiệp vụ chính).
// ---------------------------------------------------------------------------

export interface OrderPicklist {
  code: string;
  orderId: string;
  createdAt: string;
}

const picklistStore = new Map<string, OrderPicklist>();
let picklistSeq = 0;

export function getOrCreateOrderPicklist(orderId: string): OrderPicklist {
  const existing = picklistStore.get(orderId);
  if (existing) return existing;
  picklistSeq += 1;
  const picklist: OrderPicklist = {
    code: `PKL-${orderId}-${String(picklistSeq).padStart(2, '0')}`,
    orderId,
    createdAt: new Date().toISOString(),
  };
  picklistStore.set(orderId, picklist);
  return picklist;
}

export interface OrderPicklistSummary {
  picklist: OrderPicklist;
  row: AdminOrderRow;
  totalItemsCount: number;
  preparedItemsCount: number;
}

// Đơn đủ điều kiện lập phiếu chuẩn bị xuất kho (đã xác nhận/đang thi công) — dùng cho màn hình
// "Pick-list xuất kho" độc lập của Manager, tổng hợp trạng thái chuẩn bị + xuất kho theo từng đơn thay
// vì phải mở từng trang chi tiết đơn đặt. Đáp ứng checklist "Kho & Supplier > Pick-list xuất kho".
export function getAdminOrderPicklists(): OrderPicklistSummary[] {
  return orderStore
    .getAll()
    .filter((row) => row.status === 'CONFIRMED' || row.status === 'IN_PROGRESS')
    .map((row) => ({
      picklist: getOrCreateOrderPicklist(row.orderId),
      row,
      totalItemsCount: row.items.reduce((sum, item) => sum + item.quantity, 0),
      preparedItemsCount: row.items.reduce((sum, item) => sum + item.preparedQty, 0),
    }));
}

export function markAdminOrderPickedUp(orderId: string): void {
  orderStore.update(orderId, { pickedUpAt: new Date().toISOString() });
}

// Báo giá đã duyệt, chưa liên kết với đơn đặt nào — nguồn chọn khi liên kết thêm báo giá vào đơn đặt
// (mục "Báo giá & Hợp đồng liên đới" ở trang chi tiết). Chưa lọc theo customerId của đơn hiện tại dù
// quotation.customerId giờ đã là FK thật (Task 15) — giữ nguyên hành vi cũ (liệt kê mọi báo giá đã
// duyệt, không phân biệt khách hàng) vì đây không phải yêu cầu của Task 15, chỉ cải thiện nếu cần sau.
export function getLinkableQuotationsForOrder() {
  const linkedIds = new Set(orderStore.getAll().filter((r) => r.quotationId).map((r) => r.quotationId));
  return getAdminQuotations().filter((q) => q.status === 'approved' && !linkedIds.has(q.quotationId));
}

export function linkQuotationToOrder(orderId: string, quotationId: string): void {
  const quotation = getAdminQuotations().find((q) => q.quotationId === quotationId);
  const row = orderStore.getById(orderId);
  if (!row) return;
  const mergedItems: AdminOrderLineItem[] = quotation
    ? [
        ...row.items,
        ...quotation.items.map((qi, idx) => ({
          id: `${orderId}-q-${quotationId}-${idx}`,
          category: qi.category,
          description: qi.name,
          quantity: qi.quantity,
          unitPrice: qi.unitPrice,
          status: 'confirmed' as OrderItemStatus,
          source: 'internal' as OrderItemSource,
          preparedQty: 0,
          preparedBy: '',
        })),
      ]
    : row.items;
  const totalPrice = mergedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  orderStore.update(orderId, { quotationId, items: mergedItems, totalPrice });
}

export function unlinkQuotationFromOrder(orderId: string): void {
  orderStore.update(orderId, { quotationId: undefined });
}

// ---------------------------------------------------------------------------
// Chi tiết đơn đặt — sinh dữ liệu mở rộng (hạng mục, tiến độ, nhân sự, lịch sử) từ AdminOrderRow.
// ---------------------------------------------------------------------------

export type OrderTimelineState = 'done' | 'current' | 'upcoming';

export interface AdminOrderTimelineStep {
  key: string;
  label: string;
  detail: string;
  state: OrderTimelineState;
}

export interface AdminOrderCrewMember {
  name: string;
  role: string;
}

export interface AdminOrderHistoryEntry {
  timestamp: string;
  actor: string;
  action: string;
}

export interface AdminOrderDetail {
  row: AdminOrderRow;
  eventName: string;
  location: string;
  timeWindow: string;
  createdAt: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  items: AdminOrderLineItem[];
  discount: number;
  surcharge: number;
  total: number;
  crew: AdminOrderCrewMember[];
  timeline: AdminOrderTimelineStep[];
  history: AdminOrderHistoryEntry[];
}

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'created', label: 'Tạo đơn đặt' },
  { key: 'confirmed', label: 'Xác nhận dịch vụ' },
  { key: 'assigned', label: 'Phân công nhân sự' },
  { key: 'preparing', label: 'Chuẩn bị sự kiện' },
  { key: 'ongoing', label: 'Đang diễn ra' },
  { key: 'done', label: 'Hoàn tất sự kiện' },
];

function reachedIndexForStatus(status: BookingStatus): number {
  if (status === 'CANCELLED') return 0;
  if (status === 'NEW') return 1;
  if (status === 'CONFIRMED') return 2;
  if (status === 'IN_PROGRESS') return 4;
  return 5; // COMPLETED
}

function buildOrderTimeline(status: BookingStatus): AdminOrderTimelineStep[] {
  const reachedIndex = reachedIndexForStatus(status);
  return TIMELINE_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    detail: index <= reachedIndex ? 'Đã hoàn tất' : 'Chưa thực hiện',
    state: (index < reachedIndex ? 'done' : index === reachedIndex ? 'current' : 'upcoming') as OrderTimelineState,
  }));
}

const CREW_ROLE_POOL = ['Trưởng nhóm điều phối', 'Điều phối khách mời', 'Kỹ thuật âm thanh ánh sáng', 'Trang trí & setup'];

// Task 14: email/địa chỉ/công ty của khách trên trang chi tiết đơn giờ lấy THẬT từ db/customers.ts
// theo customerId (trước đây tự sinh độc lập bằng slugifyEmail/ADDRESS_POOL/COMPANY_POOL riêng,
// không khớp với thông tin khách hàng thật hiển thị ở trang Khách hàng).
export function getAdminOrderDetail(id: string): AdminOrderDetail | undefined {
  const row = getAdminOrderById(id);
  if (!row) return undefined;

  const seedIndex = Number(row.orderId.replace(/\D/g, '')) || 0;
  const customer = getAdminCustomers().find((c) => c.customerId === row.customerId);

  const discount = seedIndex % 5 === 0 ? 10_000_000 : 0;
  const surcharge = 0;
  const total = row.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) - discount + surcharge;

  const crew: AdminOrderCrewMember[] = [row.coordinatorName, ...CREW_ROLE_POOL.slice(1).map((_, i) => COORDINATOR_POOL[(seedIndex + i + 1) % COORDINATOR_POOL.length])].map(
    (name, i) => ({ name, role: CREW_ROLE_POOL[i] }),
  );

  const history: AdminOrderHistoryEntry[] = [
    { timestamp: '10/07/2026 09:00', actor: row.coordinatorName, action: 'Thêm sự kiện' },
    { timestamp: '10/07/2026 09:30', actor: row.coordinatorName, action: 'Tạo đơn đặt' },
    { timestamp: '11/07/2026 14:00', actor: row.coordinatorName, action: 'Cập nhật hạng mục dịch vụ' },
    { timestamp: '12/07/2026 10:15', actor: row.coordinatorName, action: 'Phân công nhân sự phụ trách' },
  ];

  return {
    row,
    eventName: `Lễ cưới ${row.customerName}`,
    location: `Riverside Palace (${row.venue})`,
    timeWindow: `17:30 - 22:00, ${row.weddingDate.split('-').reverse().join('/')}`,
    createdAt: '10/07/2026',
    customerEmail: customer?.email ?? '',
    customerCompany: '',
    customerAddress: customer?.address ?? '',
    items: row.items,
    discount,
    surcharge,
    total,
    crew,
    timeline: buildOrderTimeline(row.status),
    history,
  };
}

// ---------------------------------------------------------------------------
// Chi tiết khách hàng (đặt ở ĐÂY, không phải customers.ts — xem ghi chú vòng import đầu file) —
// TASK 13/14: khác bản gốc adminCustomersMock.ts ở chỗ danh sách đơn hàng (`orders`) giờ lấy THẬT
// theo customerId thay vì tự sinh dữ liệu giả độc lập — đây là điểm chứng minh "list và detail có
// quan hệ với nhau" (xem DEMO_CHECKLIST.md Task 24).
// ---------------------------------------------------------------------------

export interface CustomerOrderSummary {
  id: string;
  event: string;
  date: string; // YYYY-MM-DD
  value: number;
  status: BookingStatus;
  contract: string;
  coordinator: string;
}

export interface AdminCustomerDetail {
  customer: AdminCustomer;
  clientType: string;
  source: string;
  tier: string;
  createdAt: string;
  coordinatorName: string;
  orders: CustomerOrderSummary[];
  totalValue: number;
  remainingDebt: number;
  paidAmount: number;
  paymentRate: number;
  activeOrdersCount: number;
  signedContractsCount: number;
}

const CUSTOMER_SOURCE_POOL = ['Facebook Ads', 'Hotline', 'Giới thiệu', 'Website', 'Zalo OA'];

export function getAdminCustomerDetail(id: string): AdminCustomerDetail | undefined {
  const customer = getAdminCustomerById(id);
  if (!customer) return undefined;

  const seedIndex = Number(customer.customerId.replace(/\D/g, '')) || 0;
  const today = new Date('2026-07-10');
  const isVip = customer.totalSpent >= 300_000_000;

  const realOrders = getOrdersByCustomerId(customer.customerId);
  const orders: CustomerOrderSummary[] = realOrders.map((row) => ({
    id: row.orderId,
    event: `Lễ cưới ${row.customerName} tại ${row.venue}`,
    date: row.weddingDate,
    value: row.totalPrice,
    status: row.status,
    contract: row.status === 'CANCELLED' ? '—' : `HD${row.orderId.replace(/\D/g, '')}`,
    coordinator: row.coordinatorName,
  }));

  const totalValue = orders.reduce((sum, o) => sum + o.value, 0) || customer.totalSpent;
  const remainingDebt = customer.status === 'inactive' ? 0 : Math.round(totalValue * (0.05 + ((seedIndex * 7) % 15) / 100));
  const paidAmount = totalValue - remainingDebt;
  const paymentRate = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 100;
  const coordinatorName = orders[0]?.coordinator ?? '—';

  return {
    customer,
    clientType: isVip ? 'Doanh nghiệp' : 'Cá nhân',
    source: CUSTOMER_SOURCE_POOL[seedIndex % CUSTOMER_SOURCE_POOL.length],
    tier: isVip ? 'VIP' : 'Standard',
    createdAt: addDays(today, -(120 + seedIndex * 5)),
    coordinatorName,
    orders,
    totalValue,
    remainingDebt,
    paidAmount,
    paymentRate,
    activeOrdersCount: orders.filter((o) => o.status === 'NEW' || o.status === 'IN_PROGRESS').length,
    signedContractsCount: orders.filter((o) => o.status !== 'CANCELLED').length,
  };
}
