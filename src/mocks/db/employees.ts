import type { BadgeVariant } from '@/components/ui/Badge';
import { createMockStore } from './utils';

// Nguồn Employee (nhân sự vận hành sự kiện — KHÁC RBAC User đăng nhập) DUY NHẤT cho toàn bộ UI, theo
// DEMO_CHECKLIST.md Task 18 (Giai đoạn 2 — hợp nhất mock data). Trước đây `adminEmployeesMock.ts`
// (22 nhân sự, `NV001`..`NV022`) là nguồn hiển thị duy nhất cho trang /admin/settings/users, nhưng
// TÁCH BIỆT HOÀN TOÀN khỏi 5 pool tên rời rạc sau — mỗi pool tự khai báo lại (một phần) đúng 5 người
// đầu tiên trong `NAME_POOL` gốc của file đó, không tham chiếu chung 1 nguồn nào:
//   - `COORDINATOR_POOL` (trước ở adminOrdersMock.ts, nay `db/orders.ts`) — 5 tên, gán "Điều phối viên"
//     khi tạo/sửa đơn đặt.
//   - `ASSIGNEE_POOL` (trước ở adminQuotationsMock.ts, nay `db/quotations.ts`) — 4 tên (thiếu "Vũ Hoàng
//     Long" so với 5 người còn lại — KHÔNG phải lỗi, giữ nguyên để không đổi assignee của báo giá đã
//     seed sẵn, xem ghi chú tại chỗ khai báo `ASSIGNEE_POOL` bên dưới), gán "Người khảo sát" báo giá.
//   - `SURVEY_ASSIGNEE_OPTIONS` (adminSurveyReportsMock.ts) — 5 tên, gán người khảo sát khi tạo báo cáo.
//   - `LEADER_STAFF_POOL` (managerFieldOpsMock.ts) — 3/5 tên, gán "Leader phụ trách" ghi nhận hiện trường.
//   - `PLANNING_STAFF_POOL` (adminSchedulePlansMock.ts, nay `db/schedulePlans.ts`) — 5 tên kèm vai trò
//     hiện trường bespoke ("Trưởng nhóm điều phối", "Hậu cần"...) — vai trò này KHÁC hẳn `EmployeeRole`
//     (phân loại nhân sự chính thức: Quản lý/Điều phối viên/Kỹ thuật/Bếp trưởng/MC/Trang trí), nên
//     KHÔNG gộp field `role`, chỉ gộp phần TÊN người về `FIELD_OPS_STAFF` bên dưới.
// Cả 5 pool đều là 5 người ĐẦU TIÊN của `NAME_POOL` gốc (Vũ Hoàng Long, Lê Minh Dũng, Nguyễn Thị Hương,
// Trần Anh Tuấn, Phạm Thị Mai — tương ứng NV001-NV005) — giờ tính từ 1 mảng `FIELD_OPS_STAFF` DUY NHẤT
// bên dưới thay vì 5 bản khai báo tên độc lập dễ lệch nhau khi sửa 1 chỗ mà quên chỗ khác. Giữ NGUYÊN
// VẸN thành phần/thứ tự từng pool cũ (kể cả các "thiếu sót" như ASSIGNEE_POOL thiếu 1 người) để KHÔNG
// làm đổi assignee của bất kỳ Order/Quotation/SurveyReport nào đã seed sẵn — chỉ đổi NGUỒN, không đổi
// GIÁ TRỊ hiển thị.

export type EmployeeRole = 'Quản lý' | 'Điều phối viên' | 'Kỹ thuật' | 'Bếp trưởng' | 'MC/MC Lead' | 'Trang trí';
export type EmployeeStatus = 'active' | 'inactive';

export const EMPLOYEE_ROLES: EmployeeRole[] = ['Quản lý', 'Điều phối viên', 'Kỹ thuật', 'Bếp trưởng', 'MC/MC Lead', 'Trang trí'];

export const EMPLOYEE_ROLE_BADGE: Record<EmployeeRole, BadgeVariant> = {
  'Quản lý': 'info',
  'Điều phối viên': 'success',
  'Kỹ thuật': 'warning',
  'Bếp trưởng': 'error',
  'MC/MC Lead': 'info',
  'Trang trí': 'neutral',
};

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Đang trực', variant: 'success' },
  inactive: { label: 'Ngoại tuyến', variant: 'neutral' },
};

export interface AdminEmployee {
  id: string; // NV001
  name: string;
  phone: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  avatarColor: string;
  assignedBookings: number;
}

const NAME_POOL = [
  'Vũ Hoàng Long', 'Lê Minh Dũng', 'Nguyễn Thị Hương', 'Trần Anh Tuấn', 'Phạm Thị Mai',
  'Bùi Thanh Hương', 'Trần Đức Anh', 'Mai Thị Hạnh', 'Đỗ Quốc Việt', 'Ngô Thị Lan',
  'Hoàng Văn Kiên', 'Đặng Thị Thu', 'Lâm Quốc Bảo', 'Tô Thị Ngọc', 'Dương Văn Phát',
];

const AVATAR_COLOR_POOL = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-violet-600', 'bg-slate-600'];

function slugifyEmail(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase()
    .split(/\s+/);
  const last = normalized[normalized.length - 1] ?? 'nv';
  const initials = normalized.slice(0, -1).map((p) => p[0]).join('');
  return `${last}.${initials}@bnwems.vn`;
}

function generateMockEmployees(): AdminEmployee[] {
  return Array.from({ length: 22 }, (_, i) => {
    const name = NAME_POOL[i % NAME_POOL.length];
    return {
      id: `NV${String(i + 1).padStart(3, '0')}`,
      name: i >= NAME_POOL.length ? `${name} ${Math.floor(i / NAME_POOL.length) + 1}` : name,
      phone: `09${String(20_000_000 + i * 191).slice(0, 8)}`,
      email: slugifyEmail(name),
      role: EMPLOYEE_ROLES[i % EMPLOYEE_ROLES.length],
      status: i % 5 === 0 ? 'inactive' : 'active',
      avatarColor: AVATAR_COLOR_POOL[i % AVATAR_COLOR_POOL.length],
      assignedBookings: i % 8,
    };
  });
}

const employeeStore = createMockStore<AdminEmployee>('employees', generateMockEmployees(), 'id');

export function getAdminEmployees(): AdminEmployee[] {
  return employeeStore.getAll();
}

export function addAdminEmployee(employee: AdminEmployee): void {
  employeeStore.add(employee);
}

export function updateAdminEmployee(id: string, patch: Partial<AdminEmployee>): void {
  employeeStore.update(id, patch);
}

export function deleteAdminEmployee(id: string): void {
  employeeStore.remove(id);
}

export function nextAdminEmployeeId(): string {
  const maxNum = employeeStore.getAll().reduce((max, e) => {
    const num = Number(e.id.replace(/\D/g, ''));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `NV${String(maxNum + 1).padStart(3, '0')}`;
}

// ===== Pool nhân sự đội hiện trường dùng chung (Task 18) — 5 người đầu tiên (NV001-NV005) của roster
// nhân sự đầy đủ ở trên, KHÔNG đổi khi seed lại vì `generateMockEmployees()` luôn xếp đúng 5 người này
// ở 5 vị trí đầu (NAME_POOL[0..4]). Đây là 1 SNAPSHOT tên (không phải bản ghi `AdminEmployee` sống —
// nếu 1 trong 5 người bị xóa/đổi tên qua trang /admin/settings/users, các pool này KHÔNG tự cập nhật
// theo — tình huống hiếm/không phải luồng nghiệp vụ chính nên chấp nhận được cho demo). =====
export const FIELD_OPS_STAFF: AdminEmployee[] = generateMockEmployees().slice(0, 5);

/** Gán "Điều phối viên" khi tạo/sửa đơn đặt — trước đây khai riêng ở adminOrdersMock.ts. */
export const COORDINATOR_POOL: string[] = FIELD_OPS_STAFF.map((e) => e.name);

/** Gán "Người khảo sát" khi phân công khảo sát báo giá — trước đây khai riêng ở adminQuotationsMock.ts.
 * CHỈ 4/5 người (thiếu "Vũ Hoàng Long") — giữ nguyên đúng thành phần cũ để không đổi assignee của các
 * báo giá đã seed sẵn (seed dùng `ASSIGNEE_POOL[index % ASSIGNEE_POOL.length]`, đổi length sẽ đổi luôn
 * người được gán ở phần lớn báo giá hiện có). */
export const ASSIGNEE_POOL: string[] = FIELD_OPS_STAFF.slice(1).map((e) => e.name);

/** Gán người khảo sát khi tạo báo cáo khảo sát hiện trường — trước đây khai riêng ở
 * adminSurveyReportsMock.ts. */
export const SURVEY_ASSIGNEE_OPTIONS: string[] = FIELD_OPS_STAFF.map((e) => e.name);

/** Gán "Leader phụ trách" khi Leader Staff ghi nhận Change Request/biên bản hiện trường — trước đây
 * khai riêng ở managerFieldOpsMock.ts. Chỉ 3/5 người, giữ nguyên đúng thành phần + thứ tự cũ. */
export const LEADER_STAFF_POOL: string[] = [FIELD_OPS_STAFF[0].name, FIELD_OPS_STAFF[3].name, FIELD_OPS_STAFF[2].name];
