import { getAdminOrders } from '@/mocks/db/orders';
import { getAdminSurveyReports } from '@/mocks/db/surveyReports';
import { getFieldHandovers } from '@/mocks/db/changeRequests';

// Trang /manager/dashboard THUẦN GIAO DIỆN theo mục 0 CLAUDE.md — dữ liệu ảo cố định, chưa nối
// reportApiService thật. Khác Administrative Dashboard của Admin (thiên về doanh thu/audit),
// Operational Dashboard của Manager tập trung vào trạng thái order/task/thanh toán/kho và đặc biệt
// là "hàng đợi chờ xác nhận" — phần lớn dữ liệu hiện trường do Leader Staff (mobile) ghi nhận trước,
// Manager chỉ xác nhận (confirm) trên web (xem mục 1 CLAUDE.md, phần Vai trò & phân quyền).
//
// activeOrders tính từ src/mocks/db/orders.ts thật (DEMO_CHECKLIST.md Task 14).
// DEMO_CHECKLIST.md Task 21: 2/5 loại trong hàng đợi "chờ xác nhận" (survey, handover) giờ đếm THẬT
// từ db/surveyReports.ts (status PENDING_CONFIRM) + db/changeRequests.ts (FieldHandoverRecord status
// PENDING_CONFIRM) — 2 domain này chỉ có từ Task 20. 3 loại còn lại (field_payment/damage_loss/
// settlement) vẫn giữ số tĩnh: field_payment/settlement cần phân biệt trạng thái "Leader Staff đã ghi
// nhận tại hiện trường, chờ Manager xác nhận" mà db/payments.ts (Task 19) hiện KHÔNG mô hình hóa
// riêng (Deposit chỉ có PENDING/RECEIVED — không có state "đã ghi nhận nhưng chưa duyệt"); damage_loss
// chưa có domain riêng nào trong db/. tasksToday/inventoryAlerts vẫn tĩnh vì "việc hôm nay" (cần khớp
// đúng 1 ngày cụ thể) và "cảnh báo tồn kho" (cần ngưỡng nghiệp vụ chưa có trong CLAUDE.md mục 1) không
// derive được có ý nghĩa từ dữ liệu seed hiện tại của db/schedulePlans.ts (Task 18, mọi
// weddingDate/tasks đều lệch khỏi mốc "hôm nay" cố định 2026-07-10) / db/catalog.ts (Task 16, mọi
// item seed đều có availableStock/totalStock ≥ 80% — không có kịch bản "sắp hết hàng" nào trong seed).
export function getManagerDashboardKpis() {
  const surveyPending = getAdminSurveyReports().filter((r) => r.status === 'PENDING_CONFIRM').length;
  const handoverPending = getFieldHandovers().filter((h) => h.status === 'PENDING_CONFIRM').length;
  const staticPendingCount = 2 + 2 + 1; // field_payment + damage_loss + settlement — xem giải thích ở trên

  return {
    activeOrders: getAdminOrders().filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS').length,
    activeOrdersChange: '+4 tuần này',
    pendingConfirmations: surveyPending + handoverPending + staticPendingCount,
    pendingConfirmationsChange: 'Cần xử lý',
    tasksToday: 12,
    tasksTodayChange: '3 nhóm hiện trường',
    inventoryAlerts: 3,
    inventoryAlertsChange: 'Thiếu hàng dự kiến',
  };
}

export type ConfirmationType =
  | 'survey'
  | 'handover'
  | 'damage_loss'
  | 'settlement'
  | 'field_payment'
  | 'inventory_return';

export interface PendingConfirmation {
  type: ConfirmationType;
  label: string;
  description: string;
  count: number;
  href: string;
}

// Mỗi mục ứng với 1 loại biên bản Leader Staff ghi nhận tại hiện trường qua app mobile, chờ Manager
// xác nhận trên web trước khi coi là chính thức. count của "survey"/"handover" tính thật (Task 21) —
// xem giải thích chi tiết ở getManagerDashboardKpis(); 3 mục còn lại giữ số minh họa cố định.
export function getPendingConfirmations(): PendingConfirmation[] {
  return [
    {
      type: 'survey',
      label: 'Báo cáo khảo sát',
      description: 'Khảo sát viên đã nộp, chờ duyệt để lập báo giá',
      count: getAdminSurveyReports().filter((r) => r.status === 'PENDING_CONFIRM').length,
      href: '/manager/survey',
    },
    {
      type: 'field_payment',
      label: 'Chứng từ thanh toán tại hiện trường',
      description: 'Leader Staff ghi nhận cọc/quyết toán tiền mặt hoặc chuyển khoản',
      count: 2,
      href: '/manager/payments/deposits',
    },
    {
      type: 'handover',
      label: 'Biên bản nghiệm thu/bàn giao',
      description: 'Chờ xác nhận trước khi gửi khách hàng',
      count: getFieldHandovers().filter((h) => h.status === 'PENDING_CONFIRM').length,
      href: '/manager/field-ops/handovers',
    },
    {
      type: 'damage_loss',
      label: 'Ghi nhận hỏng/mất thiết bị',
      description: 'Chờ duyệt để tính đền bù theo giá mua',
      count: 2,
      href: '/manager/field-ops/handovers',
    },
    {
      type: 'settlement',
      label: 'Settlement cuối kỳ',
      description: 'Leader Staff ghi tại hiện trường, chờ quyết toán chính thức',
      count: 1,
      href: '/manager/orders',
    },
  ];
}
