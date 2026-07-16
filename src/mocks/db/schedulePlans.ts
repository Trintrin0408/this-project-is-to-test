import { getAdminOrders } from './orders';
import { getAdminQuotations } from './quotations';
import { FIELD_OPS_STAFF } from './employees';

// Nguồn SchedulePlan (Kế hoạch & phân công) DUY NHẤT cho toàn bộ UI, theo DEMO_CHECKLIST.md Task 18
// (Giai đoạn 2 — hợp nhất mock data) — chuyển từ src/mocks/adminSchedulePlansMock.ts, đã xóa file cũ.
// File gốc đã tham chiếu ĐÚNG order thật qua `getAdminOrders()` từ trước (không có FK giả cần sửa như
// Order/Quotation/Supplier ở Task 14/15/17) — xác nhận lại vẫn đúng sau khi các Task đó đổi cấu trúc
// `AdminOrderRow` (thêm `customerId`...): `generateMockPlans()`/`getUnplannedOrders()` chỉ đọc
// `order.orderId`/`customerName`/`weddingDate`/`venue`/`coordinatorName`/`status` — không có field nào
// bị đổi tên hay xóa, không cần sửa gì thêm ngoài đổi vị trí file + đường dẫn import.
//
// `PLANNING_STAFF_POOL` (tên + vai trò hiện trường bespoke, VD "Trưởng nhóm điều phối") giờ lấy TÊN từ
// `FIELD_OPS_STAFF` dùng chung (db/employees.ts, Task 18) thay vì tự khai lại 5 tên độc lập — vai trò
// hiện trường bespoke KHÔNG gộp vào `EmployeeRole` chính thức vì là 2 khái niệm khác nhau (xem giải
// thích đầu db/employees.ts).

export type PlanStatus = 'DRAFT' | 'CONFIRMED';
export type ActivityType = 'Khảo sát' | 'Lắp đặt' | 'Thu hồi';
export type TaskStatus = 'TODO' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export const ACTIVITY_TYPE_OPTIONS: ActivityType[] = ['Khảo sát', 'Lắp đặt', 'Thu hồi'];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; badgeClass: string }> = {
  TODO: { label: 'Chưa thực hiện', badgeClass: 'bg-slate-100 text-slate-600' },
  ASSIGNED: { label: 'Đã phân công', badgeClass: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', badgeClass: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Hoàn thành', badgeClass: 'bg-emerald-100 text-emerald-700' },
  BLOCKED: { label: 'Bị chặn', badgeClass: 'bg-red-100 text-red-700' },
};

export interface PlanActivity {
  id: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm" hoặc "YYYY-MM-DD HH:mm" nếu qua đêm
  location: string;
  notes: string;
}

export interface PlanStaffMember {
  name: string;
  role: string;
}

export interface PlanWorkTask {
  id: string;
  title: string;
  assignee: string;
  team: string[];
  startTime: string; // "YYYY-MM-DD HH:mm"
  location: string;
  requirements: string;
  status: TaskStatus;
  /** Giờ THẬT bắt đầu làm việc (HH:mm, ghi lúc bấm "Bắt đầu làm việc") — khác `startTime` vốn chỉ là
   * giờ dự kiến trong kế hoạch. */
  actualStartTime?: string;
  /** Giờ THẬT hoàn thành (HH:mm, ghi lúc xác nhận hoàn thành kèm ảnh minh chứng). */
  actualEndTime?: string;
  /** Ảnh thi công do nhân sự tải lên để xác nhận công việc đã hoàn thành (chỉ lưu tạm qua object URL
   * của trình duyệt — mất khi tải lại trang, xem giải thích chung của file này). */
  evidencePhotoName?: string;
  evidencePhotoUrl?: string;
}

export interface SchedulePlan {
  id: string; // KHOP-2026-0001
  orderId: string;
  /** Gắn với báo giá khi kế hoạch này là 1 buổi khảo sát hiện trường lập trước khi có đơn đặt
   * (xem handleOpenSurveyPlanning ở trang chi tiết báo giá) — orderId lúc này tạm dùng mã báo giá. */
  quotationId?: string;
  customerName: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  location: string;
  manager: string;
  notes: string;
  status: PlanStatus;
  activities: PlanActivity[];
  staffList: PlanStaffMember[];
  tasks: PlanWorkTask[];
}

// Vai trò hiện trường bespoke cho từng người trong đội quy hoạch — KHÁC EmployeeRole chính thức, xem
// giải thích đầu file. Tên lấy từ FIELD_OPS_STAFF (đúng 5 người, cùng thứ tự NAME_POOL gốc) để không
// tự khai lại tên độc lập nữa.
export const PLANNING_STAFF_POOL: PlanStaffMember[] = [
  { name: FIELD_OPS_STAFF[0].name, role: 'Trưởng nhóm điều phối' },
  { name: FIELD_OPS_STAFF[1].name, role: 'Kỹ thuật âm thanh ánh sáng' },
  { name: FIELD_OPS_STAFF[2].name, role: 'Điều phối khách mời' },
  { name: FIELD_OPS_STAFF[3].name, role: 'Trang trí & setup' },
  { name: FIELD_OPS_STAFF[4].name, role: 'Hậu cần' },
];

export interface PlanStatusInfo {
  label: string;
  dotColorClass: string;
  badgeClass: string;
}

// Trạng thái hiển thị tính toán từ status + tiến độ tasks (giống hệt logic getPlanStatusInfo của
// file mẫu) — dùng chung cho cả lịch điều phối và danh sách kế hoạch.
export function getPlanStatusInfo(plan: SchedulePlan): PlanStatusInfo {
  if (plan.status === 'DRAFT') {
    return { label: 'Chuẩn bị', dotColorClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-800' };
  }
  const tasks = plan.tasks;
  if (tasks.length === 0) {
    return { label: 'Đã chốt', dotColorClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-800' };
  }
  if (tasks.every((t) => t.status === 'COMPLETED')) {
    return { label: 'Hoàn thành', dotColorClass: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-800' };
  }
  if (tasks.some((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED')) {
    return { label: 'Đang thực hiện', dotColorClass: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-800' };
  }
  return { label: 'Đã chốt', dotColorClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-800' };
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateMockPlans(): SchedulePlan[] {
  const eligibleOrders = getAdminOrders().filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS');

  return eligibleOrders.slice(0, 16).map((order, index) => {
    const activityDate = order.weddingDate;
    const staffCount = 2 + (index % 3);
    const staffList = Array.from({ length: staffCount }, (_, i) => PLANNING_STAFF_POOL[(index + i) % PLANNING_STAFF_POOL.length]);

    const taskCount = index % 4; // 0-3 việc, để vẫn có vài kế hoạch "Đã chốt" (chưa có việc)
    const tasks: PlanWorkTask[] = Array.from({ length: taskCount }, (_, i) => {
      const statusPool: TaskStatus[] = ['TODO', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
      return {
        id: `TSK-${order.orderId}-${i + 1}`,
        title: ['Lắp dựng sân khấu & backdrop', 'Trang trí sảnh tiệc', 'Kiểm tra âm thanh ánh sáng', 'Thu hồi thiết bị sau tiệc'][i % 4],
        assignee: staffList[i % staffList.length].name,
        team: staffList.filter((_, si) => si !== i % staffList.length).map((s) => s.name),
        startTime: `${activityDate} ${8 + i * 3}:00`,
        location: order.venue,
        requirements: 'Chuẩn bị đầy đủ thiết bị theo danh sách hạng mục đã duyệt trong báo giá.',
        status: statusPool[(index + i) % statusPool.length],
      };
    });

    return {
      id: `KHOP-2026-${String(index + 1).padStart(4, '0')}`,
      orderId: order.orderId,
      customerName: order.customerName,
      eventName: `Lễ cưới ${order.customerName}`,
      eventDate: order.weddingDate,
      location: order.venue,
      manager: order.coordinatorName,
      notes: index % 3 === 0 ? 'Ưu tiên hoàn tất lắp đặt trước 22h, tránh ảnh hưởng khu vực lân cận.' : '',
      status: index % 5 === 0 ? 'DRAFT' : 'CONFIRMED',
      activities: [
        {
          id: `ACT-${order.orderId}-1`,
          type: 'Lắp đặt',
          date: addDays(new Date(activityDate), -1),
          startTime: '23:00',
          endTime: '02:00',
          location: order.venue,
          notes: 'Lắp dựng kết cấu thô, sân khấu và backdrop chính.',
        },
        {
          id: `ACT-${order.orderId}-2`,
          type: 'Thu hồi',
          date: addDays(new Date(activityDate), 1),
          startTime: '08:00',
          endTime: '11:00',
          location: order.venue,
          notes: 'Thu hồi thiết bị, sân khấu và backdrop sau tiệc, kiểm đếm trước khi nhập kho.',
        },
      ],
      staffList,
      tasks,
    };
  });
}

let store: SchedulePlan[] = generateMockPlans();

export function getAdminSchedulePlans(): SchedulePlan[] {
  return store;
}

export function getAdminSchedulePlanById(id: string): SchedulePlan | undefined {
  return store.find((p) => p.id === id);
}

export function saveAdminSchedulePlan(plan: SchedulePlan): void {
  const exists = store.some((p) => p.id === plan.id);
  store = exists ? store.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...store];
}

export function deleteAdminSchedulePlan(id: string): void {
  store = store.filter((p) => p.id !== id);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

/** Đánh dấu 1 công việc kỹ thuật là ĐANG LÀM (bấm "Bắt đầu làm việc") — ghi giờ bắt đầu thật, khác
 * `startTime` vốn chỉ là giờ dự kiến trong kế hoạch. */
export function startAdminScheduleTask(planId: string, taskId: string): void {
  store = store.map((p) =>
    p.id === planId
      ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status: 'IN_PROGRESS', actualStartTime: t.actualStartTime ?? nowTime() } : t)) }
      : p,
  );
}

/** Gắn ảnh thi công minh chứng cho 1 công việc kỹ thuật và tự đánh dấu công việc đó Hoàn thành — ghi
 * kèm giờ hoàn thành thật (và giờ bắt đầu thật nếu công việc chưa từng bấm "Bắt đầu làm việc"). */
export function confirmAdminScheduleTaskWithEvidence(planId: string, taskId: string, evidence: { fileName: string; previewUrl: string }): void {
  store = store.map((p) =>
    p.id === planId
      ? {
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'COMPLETED',
                  actualStartTime: t.actualStartTime ?? nowTime(),
                  actualEndTime: nowTime(),
                  evidencePhotoName: evidence.fileName,
                  evidencePhotoUrl: evidence.previewUrl,
                }
              : t,
          ),
        }
      : p,
  );
}

export function getAdminSchedulePlanByQuotationId(quotationId: string): SchedulePlan | undefined {
  return store.find((p) => p.quotationId === quotationId);
}

export interface FlatWorkTask extends PlanWorkTask {
  planId: string;
  planStatus: PlanStatus;
  orderId: string;
  customerName: string;
  eventName: string;
}

// Gộp phẳng toàn bộ công việc kỹ thuật (PlanWorkTask) từ mọi kế hoạch — dùng cho màn hình "Công việc"
// (Work Task) độc lập của Manager, khác với danh sách Kế hoạch & phân công vốn nhóm theo từng kế
// hoạch. Đáp ứng checklist "Điều phối nhân sự & phương tiện > Work Task".
export function getAllAdminWorkTasks(): FlatWorkTask[] {
  return store.flatMap((plan) =>
    plan.tasks.map((task) => ({
      ...task,
      planId: plan.id,
      planStatus: plan.status,
      orderId: plan.orderId,
      customerName: plan.customerName,
      eventName: plan.eventName,
    })),
  );
}

/** Cập nhật 1 công việc kỹ thuật (đổi phân công/trạng thái) từ màn hình Công việc độc lập. */
export function updateAdminScheduleTask(planId: string, taskId: string, patch: Partial<PlanWorkTask>): void {
  store = store.map((p) => (p.id === planId ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) } : p));
}

export function nextAdminSchedulePlanId(): string {
  const maxNum = store.reduce((max, p) => {
    const num = Number(p.id.split('-').pop());
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `KHOP-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

// Đơn đặt đã xác nhận nhưng chưa có kế hoạch điều phối — nguồn chọn cho form tạo kế hoạch mới.
// currentPlanId: khi sửa kế hoạch, vẫn cần hiện đơn đặt đang gắn với chính kế hoạch đó trong danh
// sách (dù đơn đó đã "có kế hoạch" — chính là kế hoạch đang sửa).
export function getUnplannedOrders(currentPlanId?: string) {
  const plannedOrderIds = new Set(
    store.filter((p) => p.id !== currentPlanId).map((p) => p.orderId),
  );
  return getAdminOrders()
    .filter((o) => (o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS') && !plannedOrderIds.has(o.orderId))
    .map((o) => ({
      orderId: o.orderId,
      quotationId: undefined as string | undefined,
      customerName: o.customerName,
      eventName: `Lễ cưới ${o.customerName}`,
      eventDate: o.weddingDate,
      location: o.venue,
      coordinatorName: o.coordinatorName,
    }));
}

// Báo giá chưa duyệt (chưa có đơn đặt thật) và chưa gắn kế hoạch nào — nguồn "đơn đặt ảo" bổ sung cho
// form tạo kế hoạch, phục vụ lập lịch khảo sát hiện trường sớm ngay từ ô tìm kiếm (không bắt buộc phải
// đi từ trang chi tiết báo giá với ?quotationId= mới thấy được báo giá đó nữa).
export function getUnplannedQuotations(currentPlanId?: string) {
  const plannedQuotationIds = new Set(
    store.filter((p) => p.id !== currentPlanId && p.quotationId).map((p) => p.quotationId as string),
  );
  return getAdminQuotations()
    .filter((q) => (q.status === 'draft' || q.status === 'surveying') && !plannedQuotationIds.has(q.quotationId))
    .map((q) => ({
      orderId: q.code,
      quotationId: q.quotationId as string | undefined,
      customerName: q.customerName,
      eventName: `Khảo sát hiện trường - Báo giá ${q.code}`,
      eventDate: q.validUntil,
      location: '',
      coordinatorName: q.assignee,
    }));
}
