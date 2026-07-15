import type { BadgeVariant } from '@/components/ui/Badge';
import { createMockStore, nextSequentialId } from './utils';

// Nguồn Customer DUY NHẤT cho toàn bộ UI (Admin + Manager) — trước đây là src/mocks/adminCustomersMock.ts,
// chuyển vào đây theo DEMO_CHECKLIST.md Task 13 (Giai đoạn 2 — hợp nhất mock data). Không dùng chung
// với src/types/customer.ts / customer.service.ts (model đó dành cho luồng chọn khách hàng khi
// Manager tạo báo giá qua API thật — 2 khái niệm tách biệt trong toàn bộ giai đoạn UI-first, xem
// CLAUDE.md mục 0). Dữ liệu lưu qua localStorage (xem utils.ts createMockStore) — sống sót qua F5.
//
// File này KHÔNG được import bất kỳ thứ gì (giá trị, không phải type) từ ./orders — orders.ts import
// customers.ts ở top-level (để gán customerId FK thật khi sinh seed), nên chiều ngược lại sẽ tạo
// vòng lặp import thật và lỗi "Cannot access '...' before initialization" lúc chạy (đã gặp thật khi
// build Task 13/14, xem lịch sử task). Logic cần cả 2 phía (như getAdminCustomerDetail) đặt ở
// orders.ts, nơi đã có sẵn 1 chiều phụ thuộc an toàn.

export type AdminCustomerStatus = 'active' | 'inactive';

export const CUSTOMER_STATUS_META: Record<AdminCustomerStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  inactive: { label: 'Tạm ngưng', variant: 'neutral' },
};

export interface AdminCustomer {
  customerId: string; // KH001
  customerName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: AdminCustomerStatus;
  totalBookings: number;
  totalSpent: number;
}

const NAME_POOL = [
  'Nguyễn Minh Trí', 'Trần Thu Thảo', 'Phạm Hải Nam', 'Đỗ Anh Khoa', 'Vũ Ngọc Lan',
  'Hoàng Gia Bảo', 'Bùi Thanh Hà', 'Ngô Quốc Huy', 'Lý Diễm My', 'Đặng Văn Phúc',
  'Phan Thảo Vy', 'Trương Đình Khang', 'Mai Thu Hương', 'Đinh Công Danh', 'Lâm Bảo Châu',
  'Cao Xuân Sơn', 'Tô Kim Ngân', 'Dương Nhật Minh', 'Huỳnh Gia Hân', 'Vương Đức Anh',
];

const ADDRESS_POOL = [
  '123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',
  '45 Lê Lợi, P. Bến Thành, Q.1, TP. Hồ Chí Minh',
  '78 Nguyễn Văn Cừ, P.4, Q.5, TP. Hồ Chí Minh',
  '12 Hoàng Diệu, P. Linh Trung, TP. Thủ Đức',
  '256 Cách Mạng Tháng 8, Q.3, TP. Hồ Chí Minh',
  '89 Điện Biên Phủ, Q. Bình Thạnh, TP. Hồ Chí Minh',
];

const NOTES_POOL = [
  'Khách quen, ưu tiên tư vấn gói cao cấp.',
  'Yêu cầu liên hệ qua Zalo thay vì gọi điện.',
  'Đã từng đặt tiệc sinh nhật, hài lòng về dịch vụ.',
  '',
  '',
];

function slugifyEmail(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase()
    .split(/\s+/);
  const last = normalized[normalized.length - 1] ?? 'khach';
  const initials = normalized.slice(0, -1).map((p) => p[0]).join('');
  return `${last}.${initials}@gmail.com`;
}

function generateMockCustomers(): AdminCustomer[] {
  return Array.from({ length: 42 }, (_, i) => {
    const name = NAME_POOL[i % NAME_POOL.length];
    const isInactive = i % 7 === 0;
    return {
      customerId: `KH${String(i + 1).padStart(3, '0')}`,
      customerName: i >= NAME_POOL.length ? `${name} ${Math.floor(i / NAME_POOL.length) + 1}` : name,
      phone: `09${String(10_000_000 + i * 173).slice(0, 8)}`,
      email: slugifyEmail(name),
      address: ADDRESS_POOL[i % ADDRESS_POOL.length],
      notes: NOTES_POOL[i % NOTES_POOL.length],
      status: isInactive ? 'inactive' : 'active',
      totalBookings: 1 + (i % 6),
      totalSpent: 15_000_000 + ((i * 3_700_000) % 500_000_000),
    };
  });
}

const customerStore = createMockStore<AdminCustomer>('customers', generateMockCustomers(), 'customerId');

export function getAdminCustomers(): AdminCustomer[] {
  return customerStore.getAll();
}

export function getAdminCustomerById(id: string): AdminCustomer | undefined {
  return customerStore.getById(id);
}

export function addAdminCustomer(customer: AdminCustomer): void {
  customerStore.add(customer);
}

export function updateAdminCustomer(id: string, patch: Partial<AdminCustomer>): void {
  customerStore.update(id, patch);
}

export function deleteAdminCustomer(id: string): void {
  customerStore.remove(id);
}

export function nextAdminCustomerId(): string {
  return nextSequentialId(customerStore.getAll(), 'customerId', 'KH', 3);
}
