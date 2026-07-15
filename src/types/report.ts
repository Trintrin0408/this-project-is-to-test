// docs/api/13-reports.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06.
// Nguồn: D:\bnwems-backend-api dashboard.service.ts, dashboard.controller.ts,
// reports.route.ts, manager.route.ts.

// GET /api/v1/dashboard/admin
export interface AdminDashboardStats {
  activeOrders: number;
  totalRevenueMonth: number;
  unpaidSupplierDebt: number;
  recentOrders: { orderId: string; orderStatus: string; eventName?: string }[];
}

// GET /api/v1/dashboard/manager — pendingChangeRequests -> pendingWarnings (ChangeRequest đã bị
// xoá khỏi schema, thay bằng OrderWarning); alerts giờ là OrderWarning chưa xử lý.
export interface ManagerDashboardStats {
  ordersInProgress: number;
  pendingWarnings: number;
  tasksToday: number;
  alerts: { type: 'warning'; warningId: string; content: string }[];
}

// GET /api/v1/reports/revenue?startDate=&endDate= — bắt buộc truyền khoảng ngày.
// breakdownByMonth/topCustomers backend LUÔN trả rỗng (chưa implement group-by) — hiển thị UI cần
// xử lý graceful khi rỗng, không phải lỗi.
export interface RevenueReportPoint {
  month: string;
  revenue: number;
}

export interface RevenueReport {
  totalRevenue: number;
  breakdownByMonth: RevenueReportPoint[];
  topCustomers: { customerId: string; revenue: number }[];
}

// GET /api/v1/reports/inventory — mostUsedItems LUÔN trả rỗng (chưa implement); backend cũng
// KHÔNG lọc theo startDate/endDate dù nhận query (tính tổng toàn hệ thống).
export interface InventoryReport {
  totalDamaged: number;
  totalLost: number;
  mostUsedItems: { itemId: string; itemName: string; usageCount: number }[];
}

// GET /api/v1/reports/verification?orderId= — warningsResolved/damageLossRecorded HIỆN LUÔN
// hardcode true ở backend (chưa thật sự kiểm tra) — không dùng 2 field này để quyết định nghiệp vụ.
export interface OperationalVerification {
  orderId: string;
  tasksCompleted: number;
  totalTasks: number;
  warningsResolved: boolean;
  damageLossRecorded: boolean;
  verificationStatus: 'ready_for_settlement' | 'pending';
}

// GET /api/v1/manager/approvals — hàng đợi "chờ xác nhận" tổng hợp cho Manager
export interface ManagerApprovals {
  orderWarnings: { warningId: string; orderId: string; content: string; isResolved: boolean; createdAt: string }[];
  surveyReports: { surveyId: string; orderId: string; status: string; location: string; surveyDate: string }[];
}
