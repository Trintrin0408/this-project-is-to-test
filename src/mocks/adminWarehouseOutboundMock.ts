import type { BadgeVariant } from '@/components/ui/Badge';
import { adjustAdminEquipmentStock, getAdminEquipmentById } from '@/mocks/db/catalog';
import { getAdminOrders } from '@/mocks/db/orders';
import { FIELD_OPS_STAFF } from '@/mocks/db/employees';

// Trang /admin/inventory/outbound ("Xuất kho") hiện code THUẦN GIAO DIỆN theo mục 0 CLAUDE.md, port từ
// docs/components/WarehouseOutView.tsx. Khi xác nhận xuất kho, store này gọi sang
// adminEquipmentMock.adjustAdminEquipmentStock để trừ tồn kho thật trong phiên làm việc, giữ số liệu
// khớp với trang "Gói sản phẩm & dịch vụ" và "Tồn kho doanh nghiệp".
//
// Task "System Testing" audit 2b-3: trước đây `bookingName` là chuỗi tự do tự bịa (vd "Tiệc cưới Minh
// Tuấn & Hồng Nhung"), không có field nào trỏ đơn thật; `receiver` cũng lấy tên từ pool riêng không
// liên quan `db/employees.ts`. Đã sửa: thêm `orderId` trỏ THẬT vào `db/orders.ts` (10 đơn
// CONFIRMED/IN_PROGRESS đầu tiên), `bookingName` giờ derive từ `customerName` của đơn đó thay vì tự
// sinh độc lập; `receiver` lấy từ `FIELD_OPS_STAFF` (Task 18, pool nhân sự dùng chung) thay vì
// `OUTBOUND_RECEIVER_OPTIONS` riêng (đã xóa — chưa từng được dùng thật, các giá trị receiver trước đây
// gõ tay trực tiếp không qua mảng này).

export type OutboundStatus = 'exported' | 'not_exported';

export const OUTBOUND_STATUS_META: Record<OutboundStatus, { label: string; variant: BadgeVariant }> = {
  exported: { label: 'Đã xuất', variant: 'success' },
  not_exported: { label: 'Chưa xuất', variant: 'warning' },
};

export interface OutboundVoucherItem {
  equipmentId: string;
  name: string;
  unit: string;
  requestedQty: number;
  note?: string;
}

export interface OutboundVoucher {
  id: string; // PX0001
  orderId: string; // trỏ thật vào db/orders.ts
  bookingName: string;
  expectedDate: string; // YYYY-MM-DD
  actualDate: string; // YYYY-MM-DD HH:mm hoặc rỗng nếu chưa xuất
  status: OutboundStatus;
  receiver: string;
  truckNumber: string;
  notes: string;
  items: OutboundVoucherItem[];
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildItems(pairs: [string, number, string?][]): OutboundVoucherItem[] {
  return pairs.map(([equipmentId, requestedQty, note]) => {
    const equipment = getAdminEquipmentById(equipmentId);
    return { equipmentId, name: equipment?.name ?? equipmentId, unit: equipment?.unit ?? 'Cái', requestedQty, note };
  });
}

type OutboundVoucherSeedRow = Omit<OutboundVoucher, 'items' | 'orderId' | 'bookingName' | 'receiver'> & {
  itemPairs: [string, number, string?][];
  orderIndex: number;
  receiverIndex: number;
};

function generateMockVouchers(): OutboundVoucher[] {
  const today = new Date('2026-07-12');
  const eligibleOrders = getAdminOrders().filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS');

  const rows: OutboundVoucherSeedRow[] = [
    {
      id: 'PX0001',
      orderIndex: 0,
      expectedDate: addDays(today, -3),
      actualDate: `${addDays(today, -3)} 08:30`,
      status: 'exported',
      receiverIndex: 0,
      truckNumber: '29C-123.45',
      notes: 'Bàn giao đầy đủ thiết bị trang trí và bàn ghế cho sảnh Hera.',
      itemPairs: [
        ['BG005', 300],
        ['BG001', 30],
        ['KB001', 30],
        ['AC001', 30],
      ],
    },
    {
      id: 'PX0002',
      orderIndex: 1,
      expectedDate: addDays(today, -2),
      actualDate: `${addDays(today, -2)} 10:15`,
      status: 'exported',
      receiverIndex: 1,
      truckNumber: '51C-789.12',
      notes: 'Lắp đặt bàn ghế tiệc cưới sảnh Zeus.',
      itemPairs: [
        ['BG005', 250],
        ['BG001', 25],
      ],
    },
    {
      id: 'PX0003',
      orderIndex: 2,
      expectedDate: addDays(today, -1),
      actualDate: `${addDays(today, -1)} 09:05`,
      status: 'exported',
      receiverIndex: 2,
      truckNumber: '29C-445.67',
      notes: 'Bàn ghế và khăn trải bàn cổng cưới sảnh Artemis.',
      itemPairs: [
        ['BG003', 100],
        ['KB001', 10],
      ],
    },
    {
      id: 'PX0004',
      orderIndex: 3,
      expectedDate: addDays(today, 1),
      actualDate: '',
      status: 'not_exported',
      receiverIndex: 0,
      truckNumber: '29C-332.11',
      notes: 'Thiết bị phụ trợ chụp hình và quay phim ngoài trời sảnh Aphrodite.',
      itemPairs: [
        ['BG005', 150],
        ['CH001', 2],
      ],
    },
    {
      id: 'PX0005',
      orderIndex: 4,
      expectedDate: addDays(today, -1),
      actualDate: `${addDays(today, -1)} 14:20`,
      status: 'exported',
      receiverIndex: 3,
      truckNumber: '30F-982.55',
      notes: '',
      itemPairs: [
        ['QT001', 10],
        ['DT001', 5],
      ],
    },
    {
      id: 'PX0006',
      orderIndex: 5,
      expectedDate: addDays(today, 2),
      actualDate: '',
      status: 'not_exported',
      receiverIndex: 1,
      truckNumber: '29C-123.45',
      notes: '',
      itemPairs: [
        ['BG005', 120],
        ['DT006', 20],
      ],
    },
    {
      id: 'PX0007',
      orderIndex: 6,
      expectedDate: addDays(today, -2),
      actualDate: `${addDays(today, -2)} 07:45`,
      status: 'exported',
      receiverIndex: 0,
      truckNumber: '29H-456.78',
      notes: '',
      itemPairs: [
        ['BG001', 20],
        ['BG005', 200],
      ],
    },
    {
      id: 'PX0008',
      orderIndex: 7,
      expectedDate: addDays(today, 3),
      actualDate: '',
      status: 'not_exported',
      receiverIndex: 2,
      truckNumber: '29C-223.11',
      notes: '',
      itemPairs: [
        ['QT002', 4],
        ['AC001', 10],
      ],
    },
    {
      id: 'PX0009',
      orderIndex: 8,
      expectedDate: addDays(today, 0),
      actualDate: '',
      status: 'not_exported',
      receiverIndex: 3,
      truckNumber: '29C-888.88',
      notes: 'Bàn giao thiết bị theo đúng hạng mục đã chốt trong báo giá.',
      itemPairs: [
        ['BG005', 100, 'Theo bàn tiệc'],
        ['BG001', 10, 'Theo bàn tiệc'],
        ['QT002', 4, 'Làm mát'],
        ['AC001', 10, 'Bộ tiếp khách'],
      ],
    },
    {
      id: 'PX0010',
      orderIndex: 9,
      expectedDate: addDays(today, 5),
      actualDate: '',
      status: 'not_exported',
      receiverIndex: 1,
      truckNumber: '30F-122.34',
      notes: '',
      itemPairs: [['BG003', 180]],
    },
  ];

  return rows.map((row) => {
    const { orderIndex, receiverIndex, itemPairs, ...rest } = row;
    const order = eligibleOrders[orderIndex % eligibleOrders.length];
    const receiver = FIELD_OPS_STAFF[receiverIndex % FIELD_OPS_STAFF.length].name;
    return {
      ...rest,
      orderId: order.orderId,
      bookingName: `Lễ cưới ${order.customerName}`,
      receiver,
      items: buildItems(itemPairs),
    };
  });
}

let store: OutboundVoucher[] = generateMockVouchers();

export function getAdminOutboundVouchers(): OutboundVoucher[] {
  return store;
}

export function getAdminOutboundVoucherById(id: string): OutboundVoucher | undefined {
  return store.find((v) => v.id === id);
}

/** Xác nhận xuất kho: chuyển trạng thái phiếu và trừ tồn kho khả dụng của từng thiết bị liên quan. */
export function confirmOutboundExport(id: string): void {
  const voucher = store.find((v) => v.id === id);
  if (!voucher || voucher.status === 'exported') return;

  voucher.items.forEach((item) => {
    adjustAdminEquipmentStock(item.equipmentId, 'xuat_kho', item.requestedQty, `Xuất kho cho phiếu ${id}`, `Phiếu xuất: ${id} (${voucher.bookingName})`);
  });

  const now = new Date();
  const actualDate = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  store = store.map((v) => (v.id === id ? { ...v, status: 'exported', actualDate } : v));
}
