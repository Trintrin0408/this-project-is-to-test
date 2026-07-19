# BNWEMS Web Frontend

Web application for the **Binh Nguyen Wedding Event Management System (BNWEMS)** for Admin and Manager roles. Built with Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + Axios.

> **
>
> sử dụng api giả lập
> Backend (`D:\bnwems-backend-api`) hiện đang lỗi (Aiven cloud DB lệch schema so với
> `prisma/schema.prisma`, mọi request đều trả `400 DB_ERROR` — xem `docs/more-require.md` mục (jj)).
> Trong lúc chờ backend/DB owner khắc phục, màn hình đăng nhập tạm dùng 2 tài khoản ảo cố định
> (`src/mocks/authAccounts.ts`), không gọi `POST /auth/login` thật:
>
>
> | Tài khoản | Mật khẩu    | Vai trò |
> | ----------- | ------------- | -------- |
> | `admin`     | `Admin@123`   | Admin    |
> | `manager`   | `Manager@123` | Manager  |
>
> Các màn hình khác vẫn giữ nguyên code gọi `services/*.service.ts` như cũ (chưa xóa), nhưng vì
> backend đang lỗi nên phần lớn sẽ không tải được dữ liệu thật — trọng tâm hiện tại là xây/tinh
> chỉnh giao diện, không phải nối API. Gỡ ghi chú này và khôi phục lại `authApiService.login()` khi
> backend đăng nhập được bình thường trở lại.

## Tech Stack


| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Framework   | Next.js 16 (App Router)                 |
| Language    | TypeScript 5.x                          |
| Styling     | TailwindCSS v4                          |
| HTTP Client | Axios (with JWT interceptors)           |
| State       | React Context (AuthContext)             |
| Testing     | Jest + React Testing Library + jest-dom |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and set the backend API URL
cp .env.example .env.local

# 3. Start development server
npm run dev
```

The app will run at `http://localhost:3000`.

## Available Scripts


| Script                  | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start Next.js development server |
| `npm run build`         | Build for production             |
| `npm start`             | Run production build             |
| `npm run test`          | Run all Jest tests               |
| `npm run test:coverage` | Run tests with coverage report   |

## Project Structure

````
web-frontend/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── src/
│
│   ├── app/
│   │
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │
│   │   ├── admin/                  # Chỉ master data + audit + settings (KHÔNG xử lý vận hành)
│   │   │
│   │   │   ├── dashboard/          # Administrative Dashboard
│   │   │   │   └── page.tsx
│   │   │
│   │   │   ├── catalog/            # Danh mục thiết bị/dịch vụ — phân loại bằng itemType, có
│   │   │   │   ├── page.tsx        # thể gắn thêm CatalogCategory (tùy chọn) qua categoryId
│   │   │   │   └── categories/     # Category Management (docs/api/03-catalog.md)
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │
│   │   │   ├── inventory/          # Xem (read-only) — không có create/update
│   │   │   │   ├── stock-status/
│   │   │   │   └── maintenance/
│   │   │
│   │   │   ├── warehouse/          # View Warehouse Information (UC-ID-21) — chỉ xem, không tạo/sửa kho
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/           # Chi tiết kho + tồn kho thiết bị (GET /warehouses, GET /inventory)
│   │   │
│   │   │   ├── policies/           # Chính sách cọc/hủy/đền bù/phụ phí/lương
│   │   │   │   └── page.tsx
│   │   │
│   │   │   ├── orders_audit/       # Audit đơn hàng — chỉ xem, KHÔNG tạo/sửa
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │
│   │   │   ├── reports/            # Báo cáo & audit (Admin-only)
│   │   │   │   ├── revenue/
│   │   │   │   ├── orders/
│   │   │   │   ├── inventory/
│   │   │   │   └── debts/
│   │   │
│   │   │   └── settings/
│   │   │       ├── users/
│   │   │       ├── roles/
│   │   │       └── system/
│   │
│   │   └── manager/                # Toàn bộ vận hành (vòng đời Order)
│   │       │
│   │       ├── dashboard/          # Operational Dashboard
│   │       ├── customers/
│   │       │   └── [id]/
│   │       ├── quotations/
│   │       │   └── [id]/
│   │       ├── orders/
│   │       │   ├── create/
│   │       │   └── [id]/
│   │       ├── survey/             # Khảo sát + theo dõi tiến độ
│   │       ├── schedule/
│   │       │   ├── plans/          # Schedule Plan (kế hoạch tổng thể)
│   │       │   └── tasks/          # Work Task (giao việc từng staff)
│   │       ├── inventory/
│   │       │   ├── pick-lists/     # Generate Pick List
│   │       │   └── returns/        # Confirm Check-out/Return
│   │       ├── suppliers/
│   │       │   ├── [id]/
│   │       │   └── debts/
│   │       ├── procurement/        # Supplier Rental/Purchase Order
│   │       │   └── confirmations/  # Confirm nhận/trả hàng Supplier
│   │       ├── field-ops/          # Hàng đợi xác nhận dữ liệu Leader Staff ghi từ mobile
│   │       │   ├── change-requests/
│   │       │   ├── handovers/
│   │       │   └── damage-loss/
│   │       ├── payments/
│   │       │   ├── deposits/
│   │       │   ├── settlements/
│   │       │   └── transactions/
│   │       └── wages/              # Confirm Staff Work and Wage
│   │
│   │
│   ├── components/
│   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Pagination.tsx
│   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │
│   │   ├── orders/
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── FinalQuotation.tsx
│   │
│   │   ├── inventory/
│   │   │   ├── EquipmentTable.tsx
│   │   │   ├── StockWarning.tsx
│   │   │   └── MaintenanceHistory.tsx
│   │
│   │   ├── catalog/
│   │   │   ├── CatalogItemFormModal.tsx
│   │   │   ├── CatalogItemDetailModal.tsx
│   │   │   └── CategoryFormModal.tsx
│   │
│   │   ├── suppliers/
│   │   │   ├── SupplierTable.tsx
│   │   │   └── ProcurementRequestForm.tsx
│   │
│   │   ├── schedule/
│   │   │   ├── CalendarView.tsx      # Schedule Plan
│   │   │   └── AssignmentModal.tsx   # Work Task
│   │
│   │   └── reports/
│   │       ├── RevenueChart.tsx
│   │       ├── DebtChart.tsx
│   │       └── DashboardStats.tsx
│   │
│   │   (Component cho các module mới — catalog/policies/quotations/survey/field-ops/payments/wages —
│   │    sẽ bổ sung theo cùng pattern trên khi triển khai logic thật cho từng màn hình.)
│   │
│   │
│   ├── services/
│   │
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── customer.service.ts
│   │   ├── quotation.service.ts
│   │   ├── catalog.service.ts
│   │   ├── policy.service.ts
│   │   ├── survey.service.ts
│   │   ├── schedulePlan.service.ts
│   │   ├── workTask.service.ts
│   │   ├── inventory.service.ts
│   │   ├── supplier.service.ts
│   │   ├── procurement.service.ts
│   │   ├── fieldOps.service.ts
│   │   ├── payment.service.ts
│   │   ├── staff.service.ts
│   │   ├── wage.service.ts
│   │   ├── debt.service.ts
│   │   ├── notification.service.ts
│   │   ├── user.service.ts
│   │   └── report.service.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── PermissionContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   └── usePermission.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── order.ts
│   │   ├── customer.ts
│   │   ├── quotation.ts
│   │   ├── catalog.ts
│   │   ├── warehouse.ts
│   │   ├── policy.ts
│   │   ├── survey.ts
│   │   ├── schedulePlan.ts
│   │   ├── workTask.ts
│   │   ├── inventory.ts
│   │   ├── supplier.ts
│   │   ├── fieldOps.ts
│   │   ├── payment.ts
│   │   ├── wage.ts
│   │   ├── notification.ts
│   │   └── report.ts
│   │
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── order-status.ts
│   │   └── permissions.ts
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   └── exportExcel.ts
│   │
│   └── proxy.ts
│
├── __tests__/
│   ├── components/
│   ├── services/
│   └── hooks/
│
├── .env.local
├── package.json
├── tsconfig.json
└── next.config.js
....

## Running Tests

```bash
npm run test
````
