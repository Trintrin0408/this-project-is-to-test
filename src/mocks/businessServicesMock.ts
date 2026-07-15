import type { BadgeVariant } from '@/components/ui/Badge';

// Trang /admin/catalog/business-services (Dịch vụ doanh nghiệp) hiện code THUẦN GIAO DIỆN theo
// mục 0 CLAUDE.md (giai đoạn dựng UI, tạm không đối chiếu docs/api/database) — không có endpoint
// thật đứng sau, toàn bộ dữ liệu ở file này là mock giữ trong 1 store ở module-scope để list/thêm
// hoạt động qua lại trong phiên làm việc (mất khi reload).

export type BusinessServiceStatus = 'active' | 'paused' | 'stopped';

export const BUSINESS_SERVICE_STATUS_META: Record<BusinessServiceStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Đang cung cấp', variant: 'success' },
  paused: { label: 'Tạm ngừng', variant: 'warning' },
  stopped: { label: 'Ngừng cung cấp', variant: 'error' },
};

export const BUSINESS_SERVICE_CATEGORY_OPTIONS = [
  'Tiệc & Sự kiện', 'Hội nghị', 'Team Building', 'Trang trí', 'Ẩm thực', 'Nghỉ dưỡng',
];

export interface BusinessServicePackage {
  id: string;
  code: string;
  name: string;
  category: string;
  shortDescription: string;
  detailDescription: string;
  priceFrom: number;
  status: BusinessServiceStatus;
  imageUrl: string;
  updatedAt: string; // YYYY-MM-DD
}

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1511578314322-379afb47686e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=200&h=200&fit=crop',
];

const EXTRA_NAME_POOL = [
  { name: 'Gói Tiệc Cuối Năm Doanh Nghiệp', category: 'Tiệc & Sự kiện', code: 'BIZ-YEAREND', desc: 'Tổ chức tiệc tất niên trọn gói, sân khấu ánh sáng chuyên nghiệp.' },
  { name: 'Gói Hội Thảo Ra Mắt Sản Phẩm', category: 'Hội nghị', code: 'BIZ-LAUNCH', desc: 'Không gian ra mắt sản phẩm, hệ thống trình chiếu và âm thanh cao cấp.' },
  { name: 'Gói Du Lịch Kết Hợp Team Building', category: 'Team Building', code: 'BIZ-TRIP', desc: 'Kết hợp nghỉ dưỡng và hoạt động gắn kết đội nhóm ngoài trời.' },
  { name: 'Gói Trang Trí Sảnh Hội Nghị', category: 'Trang trí', code: 'BIZ-DECOR-HN', desc: 'Trang trí sảnh theo bộ nhận diện thương hiệu doanh nghiệp.' },
  { name: 'Gói Ẩm Thực Buffet Doanh Nghiệp', category: 'Ẩm thực', code: 'BIZ-BUFFET', desc: 'Thực đơn buffet đa dạng phục vụ số lượng lớn khách mời.' },
  { name: 'Gói Nghỉ Dưỡng Cuối Tuần', category: 'Nghỉ dưỡng', code: 'BIZ-RETREAT', desc: 'Chương trình nghỉ dưỡng kết hợp workshop nội bộ cho doanh nghiệp.' },
  { name: 'Gói Hội Nghị Khách Hàng', category: 'Hội nghị', code: 'BIZ-CLIENT', desc: 'Tổ chức hội nghị tri ân, chăm sóc khách hàng thân thiết.' },
  { name: 'Gói Tiệc Kỷ Niệm Thành Lập', category: 'Tiệc & Sự kiện', code: 'BIZ-ANNIV', desc: 'Tổ chức lễ kỷ niệm thành lập công ty quy mô lớn.' },
];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateMockServices(): BusinessServicePackage[] {
  const today = new Date('2026-07-10');

  const seeded: BusinessServicePackage[] = [
    {
      id: 'biz-1',
      code: 'BIZ-PREMIUM',
      name: 'Gói Tiệc Doanh Nghiệp Premium',
      category: 'Tiệc & Sự kiện',
      shortDescription: 'Gói tiệc cao cấp dành cho sự kiện doanh nghiệp. Quy mô từ 100 - 500 khách.',
      detailDescription: 'Gói tiệc cao cấp dành cho sự kiện doanh nghiệp, bao gồm thực đơn cao cấp, sân khấu, âm thanh ánh sáng chuyên nghiệp. Quy mô phục vụ từ 100 đến 500 khách.',
      priceFrom: 450_000,
      status: 'active',
      imageUrl: IMAGE_POOL[0],
      updatedAt: addDays(today, -2),
    },
    {
      id: 'biz-2',
      code: 'BIZ-CONFERENCE',
      name: 'Gói Hội Nghị Toàn Diện',
      category: 'Hội nghị',
      shortDescription: 'Dịch vụ tổ chức hội nghị, hội thảo trọn gói bao gồm thiết bị và nhân sự.',
      detailDescription: 'Dịch vụ tổ chức hội nghị, hội thảo trọn gói bao gồm thiết bị trình chiếu, âm thanh, và nhân sự hỗ trợ chuyên nghiệp trong suốt sự kiện.',
      priceFrom: 320_000,
      status: 'active',
      imageUrl: IMAGE_POOL[2],
      updatedAt: addDays(today, -3),
    },
    {
      id: 'biz-3',
      code: 'BIZ-TEAMBUILD',
      name: 'Gói Team Building',
      category: 'Team Building',
      shortDescription: 'Chương trình team building sáng tạo kết hợp du lịch và gala dinner.',
      detailDescription: 'Chương trình team building sáng tạo kết hợp các hoạt động du lịch trải nghiệm và tiệc gala dinner khép lại chương trình.',
      priceFrom: 280_000,
      status: 'paused',
      imageUrl: IMAGE_POOL[3],
      updatedAt: addDays(today, -5),
    },
    {
      id: 'biz-4',
      code: 'BIZ-DECOR',
      name: 'Gói Trang Trí Doanh Nghiệp',
      category: 'Trang trí',
      shortDescription: 'Trang trí sân khấu, không gian sự kiện theo nhận diện thương hiệu.',
      detailDescription: 'Trang trí sân khấu, không gian sự kiện theo đúng bộ nhận diện thương hiệu (màu sắc, logo, backdrop) của doanh nghiệp.',
      priceFrom: 150_000,
      status: 'active',
      imageUrl: IMAGE_POOL[4],
      updatedAt: addDays(today, -7),
    },
  ];

  // 18 đang cung cấp / 4 tạm ngừng / 2 ngừng cung cấp trên tổng 24 dịch vụ — đã dùng 3 active + 1
  // paused ở 4 dòng seed phía trên, phần còn lại (20 dòng) cần thêm 15 active + 3 paused + 2 stopped.
  const remainingStatuses: BusinessServiceStatus[] = [
    ...Array(15).fill('active'),
    ...Array(3).fill('paused'),
    ...Array(2).fill('stopped'),
  ];

  const generated: BusinessServicePackage[] = remainingStatuses.map((status, i) => {
    const base = EXTRA_NAME_POOL[i % EXTRA_NAME_POOL.length];
    const suffix = Math.floor(i / EXTRA_NAME_POOL.length) + 1;
    return {
      id: `biz-${seeded.length + i + 1}`,
      code: suffix > 1 ? `${base.code}-${suffix}` : base.code,
      name: suffix > 1 ? `${base.name} ${suffix}` : base.name,
      category: base.category,
      shortDescription: base.desc,
      detailDescription: base.desc,
      priceFrom: 120_000 + ((i * 35_000) % 400_000),
      status,
      imageUrl: IMAGE_POOL[i % IMAGE_POOL.length],
      updatedAt: addDays(today, -(8 + i * 3)),
    };
  });

  return [...seeded, ...generated];
}

let store: BusinessServicePackage[] = generateMockServices();

export function getBusinessServices(): BusinessServicePackage[] {
  return store;
}

export function addBusinessService(service: BusinessServicePackage): void {
  store = [service, ...store];
}

export function updateBusinessService(id: string, patch: Partial<BusinessServicePackage>): void {
  store = store.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function deleteBusinessService(id: string): void {
  store = store.filter((s) => s.id !== id);
}

export function nextBusinessServiceCode(): string {
  const year = 25;
  const seq = 20 + (store.length % 80);
  return `BIZ-${year}${seq}`;
}
