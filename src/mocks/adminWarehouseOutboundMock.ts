import type { BadgeVariant } from '@/components/ui/Badge';
import { adjustAdminEquipmentStock, getAdminEquipmentById } from '@/mocks/db/catalog';

// Trang /admin/inventory/outbound ("Xuất kho") hiện code THUẦN GIAO DIỆN theo mục 0 CLAUDE.md, port từ
// docs/components/WarehouseOutView.tsx. Khi xác nhận xuất kho, store này gọi sang
// adminEquipmentMock.adjustAdminEquipmentStock để trừ tồn kho thật trong phiên làm việc, giữ số liệu
// khớp với trang "Gói sản phẩm & dịch vụ" và "Tồn kho doanh nghiệp".

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
  bookingName: string;
  expectedDate: string; // YYYY-MM-DD
  actualDate: string; // YYYY-MM-DD HH:mm hoặc rỗng nếu chưa xuất
  status: OutboundStatus;
  receiver: string;
  truckNumber: string;
  notes: string;
  items: OutboundVoucherItem[];
}

export const OUTBOUND_RECEIVER_OPTIONS = ['Vũ Hoàng Long', 'Nguyễn Minh Quân', 'Mai Thị Hạnh', 'Bùi Thanh Hương'];

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

function generateMockVouchers(): OutboundVoucher[] {
  const today = new Date('2026-07-12');

  const rows: Array<Omit<OutboundVoucher, 'items'> & { itemPairs: [string, number, string?][] }> = [
    {
      id: 'PX0001',
      bookingName: 'Tiệc cưới Minh Tuấn & Hồng Nhung',
      expectedDate: addDays(today, -3),
      actualDate: `${addDays(today, -3)} 08:30`,
      status: 'exported',
      receiver: 'Vũ Hoàng Long',
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
      bookingName: 'Lễ thành hôn Quốc Bảo & Mỹ Duyên',
      expectedDate: addDays(today, -2),
      actualDate: `${addDays(today, -2)} 10:15`,
      status: 'exported',
      receiver: 'Nguyễn Minh Quân',
      truckNumber: '51C-789.12',
      notes: 'Lắp đặt bàn ghế tiệc cưới sảnh Zeus.',
      itemPairs: [
        ['BG005', 250],
        ['BG001', 25],
      ],
    },
    {
      id: 'PX0003',
      bookingName: 'Tiệc cưới Thế Vinh & Khánh Vy',
      expectedDate: addDays(today, -1),
      actualDate: `${addDays(today, -1)} 09:05`,
      status: 'exported',
      receiver: 'Mai Thị Hạnh',
      truckNumber: '29C-445.67',
      notes: 'Bàn ghế và khăn trải bàn cổng cưới sảnh Artemis.',
      itemPairs: [
        ['BG003', 100],
        ['KB001', 10],
      ],
    },
    {
      id: 'PX0004',
      bookingName: 'Lễ vu quy Hoài Nam & Thùy Chi',
      expectedDate: addDays(today, 1),
      actualDate: '',
      status: 'not_exported',
      receiver: 'Vũ Hoàng Long',
      truckNumber: '29C-332.11',
      notes: 'Thiết bị phụ trợ chụp hình và quay phim ngoài trời sảnh Aphrodite.',
      itemPairs: [
        ['BG005', 150],
        ['CH001', 2],
      ],
    },
    {
      id: 'PX0005',
      bookingName: 'Tiệc cưới Văn Lâm & Quỳnh Anh',
      expectedDate: addDays(today, -1),
      actualDate: `${addDays(today, -1)} 14:20`,
      status: 'exported',
      receiver: 'Bùi Thanh Hương',
      truckNumber: '30F-982.55',
      notes: '',
      itemPairs: [
        ['QT001', 10],
        ['DT001', 5],
      ],
    },
    {
      id: 'PX0006',
      bookingName: 'Tiệc cưới Tiến Đạt & Minh Khuê',
      expectedDate: addDays(today, 2),
      actualDate: '',
      status: 'not_exported',
      receiver: 'Nguyễn Minh Quân',
      truckNumber: '29C-123.45',
      notes: '',
      itemPairs: [
        ['BG005', 120],
        ['DT006', 20],
      ],
    },
    {
      id: 'PX0007',
      bookingName: 'Lễ thành hôn Đức Huy & Trà My',
      expectedDate: addDays(today, -2),
      actualDate: `${addDays(today, -2)} 07:45`,
      status: 'exported',
      receiver: 'Vũ Hoàng Long',
      truckNumber: '29H-456.78',
      notes: '',
      itemPairs: [
        ['BG001', 20],
        ['BG005', 200],
      ],
    },
    {
      id: 'PX0008',
      bookingName: 'Tiệc cưới Xuân Trường & Thảo Nguyên',
      expectedDate: addDays(today, 3),
      actualDate: '',
      status: 'not_exported',
      receiver: 'Mai Thị Hạnh',
      truckNumber: '29C-223.11',
      notes: '',
      itemPairs: [
        ['QT002', 4],
        ['AC001', 10],
      ],
    },
    {
      id: 'PX0009',
      bookingName: 'Đám cưới Minh Anh & Thu Hà',
      expectedDate: addDays(today, 0),
      actualDate: '',
      status: 'not_exported',
      receiver: 'Bùi Thanh Hương',
      truckNumber: '29C-888.88',
      notes: 'Bàn giao thiết bị đám cưới Minh Anh & Thu Hà sảnh Hoàng Gia.',
      itemPairs: [
        ['BG005', 100, 'Theo bàn tiệc'],
        ['BG001', 10, 'Theo bàn tiệc'],
        ['QT002', 4, 'Làm mát'],
        ['AC001', 10, 'Bộ tiếp khách'],
      ],
    },
    {
      id: 'PX0010',
      bookingName: 'Lễ thành hôn Duy Mạnh & Quỳnh Anh',
      expectedDate: addDays(today, 5),
      actualDate: '',
      status: 'not_exported',
      receiver: 'Nguyễn Minh Quân',
      truckNumber: '30F-122.34',
      notes: '',
      itemPairs: [['BG003', 180]],
    },
  ];

  return rows.map((row) => ({ ...row, items: buildItems(row.itemPairs) }));
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
