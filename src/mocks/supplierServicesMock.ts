import type { BadgeVariant } from '@/components/ui/Badge';
import { getAdminSuppliers } from '@/mocks/db/suppliers';

// Trang /admin/catalog/supplier-services (Dịch vụ NCC) hiện code THUẦN GIAO DIỆN theo mục 0
// CLAUDE.md (giai đoạn dựng UI, tạm không đối chiếu docs/api/database) — không có endpoint thật
// đứng sau, toàn bộ dữ liệu ở file này là mock giữ trong 1 store ở module-scope để list/thêm hoạt
// động qua lại trong phiên làm việc (mất khi reload).
//
// Task "System Testing" audit 2b-5: trước đây `supplierName`/`supplierPhone` tự sinh từ
// `SUPPLIER_POOL` (10 tên bịa), không khớp 7 nhà cung cấp thật trong `db/suppliers.ts`. Đã sửa: thêm
// `supplierId` trỏ THẬT (cycle qua 7 NCC thật vì có nhiều hơn 7 dịch vụ), `supplierName`/
// `supplierPhone` derive từ đó qua `getAdminSuppliers()` thay vì tự sinh độc lập.

export type SupplierServiceStatus = 'active' | 'paused' | 'stopped';

export const SUPPLIER_SERVICE_STATUS_META: Record<SupplierServiceStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  paused: { label: 'Tạm ngừng', variant: 'warning' },
  stopped: { label: 'Ngừng cung cấp', variant: 'error' },
};

export const SUPPLIER_SERVICE_CATEGORY_OPTIONS = [
  'Dịch vụ (Sự kiện, MC, Nhạc...)',
  'Âm thanh - Ánh sáng',
  'Nhà bạt - Sân khấu',
  'Trang trí (Hoa, Backdrop...)',
  'Ẩm thực',
  'Vận chuyển',
  'Nhân sự hỗ trợ',
];

export const SUPPLIER_SERVICE_UNIT_OPTIONS = ['Gói', 'm²', 'Suất', 'Ngày', 'Cái', 'Người/buổi'];

export interface SupplierServicePackage {
  id: string;
  code: string;
  name: string;
  supplierId: string; // trỏ thật vào db/suppliers.ts
  supplierName: string;
  supplierPhone: string;
  category: string;
  unit: string;
  referencePrice: number;
  status: SupplierServiceStatus;
  imageUrl: string;
  description: string;
  updatedAt: string; // YYYY-MM-DD
}

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200&h=200&fit=crop',
];

const EXTRA_SERVICE_POOL = [
  { name: 'Cho thuê bàn ghế tiệc cưới', category: 'Nhà bạt - Sân khấu', unit: 'Cái', codePrefix: 'FURN' },
  { name: 'Trang trí xe hoa cưới', category: 'Trang trí (Hoa, Backdrop...)', unit: 'Gói', codePrefix: 'CARDEC' },
  { name: 'Cho thuê xe đưa đón khách', category: 'Vận chuyển', unit: 'Ngày', codePrefix: 'TRANS' },
  { name: 'Nhân sự hỗ trợ lễ tân sự kiện', category: 'Nhân sự hỗ trợ', unit: 'Người/buổi', codePrefix: 'STAFF' },
  { name: 'Cho thuê backdrop sân khấu', category: 'Nhà bạt - Sân khấu', unit: 'Gói', codePrefix: 'STAGE' },
  { name: 'Dịch vụ đặt tiệc buffet lưu động', category: 'Ẩm thực', unit: 'Suất', codePrefix: 'BUFFET' },
  { name: 'Cho thuê hệ thống chiếu sáng sân khấu', category: 'Âm thanh - Ánh sáng', unit: 'Gói', codePrefix: 'LIGHT' },
  { name: 'Trang trí hoa lụa cao cấp', category: 'Trang trí (Hoa, Backdrop...)', unit: 'Gói', codePrefix: 'FLORA' },
  { name: 'MC dẫn chương trình chuyên nghiệp', category: 'Dịch vụ (Sự kiện, MC, Nhạc...)', unit: 'Buổi', codePrefix: 'MC' },
  { name: 'Ban nhạc sống biểu diễn sự kiện', category: 'Dịch vụ (Sự kiện, MC, Nhạc...)', unit: 'Buổi', codePrefix: 'BAND' },
];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateMockServices(): SupplierServicePackage[] {
  const today = new Date('2026-07-10');
  const realSuppliers = getAdminSuppliers();
  const supplierAt = (index: number) => realSuppliers[index % realSuppliers.length];

  const seeded: SupplierServicePackage[] = [
    {
      id: 'ncc-1',
      code: 'NCC-SRV-001',
      name: 'Cho thuê âm thanh ánh sáng',
      supplierId: supplierAt(0).supplierId,
      supplierName: supplierAt(0).supplierName,
      supplierPhone: supplierAt(0).phone,
      category: 'Âm thanh - Ánh sáng',
      unit: 'Gói',
      referencePrice: 12_500_000,
      status: 'active',
      imageUrl: IMAGE_POOL[0],
      description: 'Trọn gói dàn âm thanh, ánh sáng sân khấu cho tiệc cưới quy mô lớn.',
      updatedAt: addDays(today, -1),
    },
    {
      id: 'ncc-2',
      code: 'NCC-SRV-002',
      name: 'Cho thuê nhà bạt không gian',
      supplierId: supplierAt(1).supplierId,
      supplierName: supplierAt(1).supplierName,
      supplierPhone: supplierAt(1).phone,
      category: 'Nhà bạt - Sân khấu',
      unit: 'm²',
      referencePrice: 85_000,
      status: 'active',
      imageUrl: IMAGE_POOL[1],
      description: 'Nhà bạt sự kiện ngoài trời, tính giá theo diện tích thi công.',
      updatedAt: addDays(today, -2),
    },
    {
      id: 'ncc-3',
      code: 'NCC-SRV-003',
      name: 'Trang trí hoa tươi',
      supplierId: supplierAt(2).supplierId,
      supplierName: supplierAt(2).supplierName,
      supplierPhone: supplierAt(2).phone,
      category: 'Trang trí (Hoa, Backdrop...)',
      unit: 'Gói',
      referencePrice: 5_800_000,
      status: 'active',
      imageUrl: IMAGE_POOL[2],
      description: 'Trang trí hoa tươi cổng, sảnh và bàn tiệc theo yêu cầu.',
      updatedAt: addDays(today, -3),
    },
    {
      id: 'ncc-4',
      code: 'NCC-SRV-004',
      name: 'Dịch vụ catering tiệc cưới',
      supplierId: supplierAt(3).supplierId,
      supplierName: supplierAt(3).supplierName,
      supplierPhone: supplierAt(3).phone,
      category: 'Ẩm thực',
      unit: 'Suất',
      referencePrice: 350_000,
      status: 'active',
      imageUrl: IMAGE_POOL[3],
      description: 'Thực đơn tiệc cưới đa dạng, phục vụ theo suất ăn.',
      updatedAt: addDays(today, -4),
    },
  ];

  // 93 đang hoạt động / 18 tạm ngừng / 17 ngừng cung cấp trên tổng 128 dịch vụ — 4 dòng seed phía
  // trên đều "active", phần còn lại (124 dòng) cần thêm 89 active + 18 paused + 17 stopped.
  const remainingStatuses: SupplierServiceStatus[] = [
    ...Array(89).fill('active'),
    ...Array(18).fill('paused'),
    ...Array(17).fill('stopped'),
  ];

  const generated: SupplierServicePackage[] = remainingStatuses.map((status, i) => {
    const base = EXTRA_SERVICE_POOL[i % EXTRA_SERVICE_POOL.length];
    const supplier = supplierAt(i);
    const suffix = Math.floor(i / EXTRA_SERVICE_POOL.length) + 1;
    return {
      id: `ncc-${seeded.length + i + 1}`,
      code: `NCC-SRV-${String(seeded.length + i + 1).padStart(3, '0')}`,
      name: suffix > 1 ? `${base.name} ${suffix}` : base.name,
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      supplierPhone: supplier.phone,
      category: base.category,
      unit: base.unit,
      referencePrice: 40_000 + ((i * 65_000) % 8_000_000),
      status,
      imageUrl: IMAGE_POOL[i % IMAGE_POOL.length],
      description: `${base.name} do ${supplier.supplierName} cung cấp.`,
      updatedAt: addDays(today, -(5 + i * 2)),
    };
  });

  return [...seeded, ...generated];
}

let store: SupplierServicePackage[] = generateMockServices();

export function getSupplierServices(): SupplierServicePackage[] {
  return store;
}

export function getSupplierNames(): string[] {
  return Array.from(new Set(store.map((s) => s.supplierName))).sort();
}

export function addSupplierService(service: SupplierServicePackage): void {
  store = [service, ...store];
}

export function updateSupplierService(id: string, patch: Partial<SupplierServicePackage>): void {
  store = store.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function deleteSupplierService(id: string): void {
  store = store.filter((s) => s.id !== id);
}

export function nextSupplierServiceCode(): string {
  const maxNum = store.reduce((max, s) => {
    const num = Number(s.code.replace(/\D/g, ''));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `NCC-SRV-${String(maxNum + 1).padStart(3, '0')}`;
}
