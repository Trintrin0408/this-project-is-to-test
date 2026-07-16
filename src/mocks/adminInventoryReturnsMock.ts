import { getAdminOrderById, getAdminOrders, type AdminOrderRow } from '@/mocks/db/orders';

// Trang /admin/inventory/returns ("Thu hồi & hoàn kho") + /manager/inventory/returns (dùng chung file
// này) code THUẦN GIAO DIỆN theo mục 0 CLAUDE.md. Mỗi "phiếu hoàn kho" ghi nhận việc trả lại thiết bị
// đã thuê cho một đơn cưới sau khi thi công xong, kèm số lượng còn nguyên vẹn/hỏng/mất kiểm đếm được —
// khi xác nhận, hệ thống mô phỏng cập nhật lại tồn kho theo công thức UC 2.23 (Thu hồi & hoàn kho).
//
// Task "System Testing" audit 2b-4: trước đây `orderCode`/`orderName`/`customerName` tự gõ tay (dạng
// "ĐC-2026-0498", không khớp bất kỳ đơn thật nào trong db/orders.ts). Đã sửa: `orderCode` giờ LUÔN là
// `orderId` thật (định dạng `DD00xx`), `orderName`/`customerName` derive từ đơn đó qua
// `getAdminOrderById()` — form "Tạo phiếu" đổi từ 3 ô nhập tay sang chọn 1 đơn thật (đã thi
// công/hoàn thành) qua `getEligibleOrdersForReturn()`, theo đúng pattern `manager/suppliers/returns`
// đã dùng (`getSupplierRentalOrders()`).

export type ReturnSlipStatus = 'PENDING' | 'DONE';

export const RETURN_SLIP_STATUS_META: Record<ReturnSlipStatus, { label: string; badgeClass: string }> = {
  PENDING: { label: 'CHƯA HOÀN', badgeClass: 'bg-amber-100 text-amber-700' },
  DONE: { label: 'ĐÃ HOÀN', badgeClass: 'bg-emerald-100 text-emerald-700' },
};

export interface ReturnSlipItem {
  itemName: string;
  unit: string;
  totalToReturn: number;
  intact: number;
  damaged: number;
  lost: number;
  note: string;
  /** Số liệu tồn kho đang ghi nhận trước khi hoàn kho, dùng để tính dự kiến sau hoàn kho. */
  warehouseBefore: {
    totalStock: number;
    damagedStock: number;
    lockedStock: number;
  };
}

export interface ReturnSlip {
  id: string;
  orderCode: string;
  orderName: string;
  customerName: string;
  status: ReturnSlipStatus;
  createdAt: string;
  createdBy: string;
  actualReturnDate?: string;
  items: ReturnSlipItem[];
}

/** Đơn đủ điều kiện tạo phiếu hoàn kho — đã thi công/hoàn thành sự kiện (`IN_PROGRESS`/`COMPLETED`),
 * dùng cho Select "Chọn đơn đặt cưới" ở form tạo phiếu (cả 2 trang Admin + Manager). */
export function getEligibleOrdersForReturn(): AdminOrderRow[] {
  return getAdminOrders().filter((o) => o.status === 'IN_PROGRESS' || o.status === 'COMPLETED');
}

type ReturnSlipSeedRow = Omit<ReturnSlip, 'orderCode' | 'orderName' | 'customerName'> & { orderIndex: number };

function buildSeedReturnSlips(): ReturnSlip[] {
  const eligibleOrders = getEligibleOrdersForReturn();

  const rows: ReturnSlipSeedRow[] = [
    {
      id: 'PN010',
      orderIndex: 0,
      status: 'DONE',
      createdAt: '2026-07-03T09:00:00',
      createdBy: 'Phạm Minh Đức',
      actualReturnDate: '2026-07-03',
      items: [
        {
          itemName: 'Bàn tròn 1.8m',
          unit: 'Cái',
          totalToReturn: 40,
          intact: 40,
          damaged: 0,
          lost: 0,
          note: '',
          warehouseBefore: { totalStock: 150, damagedStock: 0, lockedStock: 40 },
        },
      ],
    },
    {
      id: 'PN011',
      orderIndex: 1,
      status: 'DONE',
      createdAt: '2026-07-06T14:20:00',
      createdBy: 'Lê Minh Dũng',
      actualReturnDate: '2026-07-06',
      items: [
        {
          itemName: 'Ghế chiavari trắng',
          unit: 'Cái',
          totalToReturn: 200,
          intact: 196,
          damaged: 3,
          lost: 1,
          note: 'Sứt chân do vận chuyển',
          warehouseBefore: { totalStock: 500, damagedStock: 5, lockedStock: 200 },
        },
      ],
    },
    {
      id: 'PN012',
      orderIndex: 2,
      status: 'PENDING',
      createdAt: '2026-07-09T10:15:30',
      createdBy: 'Phạm Minh Đức',
      items: [
        {
          itemName: 'Bàn ghế Chavari Gold',
          unit: 'Cái',
          totalToReturn: 100,
          intact: 99,
          damaged: 0,
          lost: 1,
          note: '',
          warehouseBefore: { totalStock: 299, damagedStock: 2, lockedStock: 100 },
        },
      ],
    },
    {
      id: 'PN013',
      orderIndex: 3,
      status: 'PENDING',
      createdAt: '2026-07-11T16:45:00',
      createdBy: 'Nguyễn Thị Hương',
      items: [
        {
          itemName: 'Đèn chùm trang trí',
          unit: 'Cái',
          totalToReturn: 6,
          intact: 6,
          damaged: 0,
          lost: 0,
          note: '',
          warehouseBefore: { totalStock: 30, damagedStock: 1, lockedStock: 6 },
        },
        {
          itemName: 'Thảm đỏ',
          unit: 'm²',
          totalToReturn: 80,
          intact: 78,
          damaged: 2,
          lost: 0,
          note: 'Ố bẩn do trời mưa',
          warehouseBefore: { totalStock: 400, damagedStock: 0, lockedStock: 80 },
        },
      ],
    },
  ];

  return rows.map((row) => {
    const { orderIndex, ...rest } = row;
    const order = eligibleOrders[orderIndex % eligibleOrders.length];
    return {
      ...rest,
      orderCode: order.orderId,
      orderName: `Lễ cưới ${order.customerName}`,
      customerName: order.customerName,
    };
  });
}

let store: ReturnSlip[] = buildSeedReturnSlips();

export function getReturnSlips(): ReturnSlip[] {
  return store;
}

export function getReturnSlipById(id: string): ReturnSlip | undefined {
  return store.find((s) => s.id === id);
}

export interface CreateReturnSlipItemInput {
  itemName: string;
  unit: string;
  totalToReturn: number;
  warehouseTotalStock: number;
  warehouseDamagedStock: number;
  warehouseLockedStock: number;
}

export interface CreateReturnSlipInput {
  /** orderId thật trỏ vào db/orders.ts — chọn từ getEligibleOrdersForReturn(), không gõ tay. */
  orderId: string;
  createdBy: string;
  items: CreateReturnSlipItemInput[];
}

function nextReturnSlipId(): string {
  const maxNum = store.reduce((max, s) => {
    const num = Number(s.id.replace(/\D/g, ''));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `PN${String(maxNum + 1).padStart(3, '0')}`;
}

export function createReturnSlip(input: CreateReturnSlipInput): ReturnSlip {
  const order = getAdminOrderById(input.orderId);
  if (!order) throw new Error(`Không tìm thấy đơn ${input.orderId}`);

  const slip: ReturnSlip = {
    id: nextReturnSlipId(),
    orderCode: order.orderId,
    orderName: `Lễ cưới ${order.customerName}`,
    customerName: order.customerName,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    items: input.items.map((item) => ({
      itemName: item.itemName,
      unit: item.unit,
      totalToReturn: item.totalToReturn,
      intact: item.totalToReturn,
      damaged: 0,
      lost: 0,
      note: '',
      warehouseBefore: {
        totalStock: item.warehouseTotalStock,
        damagedStock: item.warehouseDamagedStock,
        lockedStock: item.warehouseLockedStock,
      },
    })),
  };
  store = [slip, ...store];
  return slip;
}

export function confirmReturnSlip(id: string, items: ReturnSlipItem[]): void {
  const today = new Date().toISOString().slice(0, 10);
  store = store.map((slip) =>
    slip.id === id
      ? {
          ...slip,
          status: 'DONE',
          actualReturnDate: today,
          items: items.map((item) => ({
            ...item,
            warehouseBefore: {
              totalStock: item.warehouseBefore.totalStock - item.lost,
              damagedStock: item.warehouseBefore.damagedStock + item.damaged,
              lockedStock: item.warehouseBefore.lockedStock - item.totalToReturn,
            },
          })),
        }
      : slip,
  );
}
