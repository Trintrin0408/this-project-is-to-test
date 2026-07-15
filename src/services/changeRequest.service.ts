import api from './api';
import type { ChangeRequest, CreateChangeRequestPayload } from '@/types/changeRequest';

export interface GetChangeRequestsQuery {
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ===== MOCK-ONLY =====
// Model ChangeRequest đã bị XÓA HẲN khỏi backend thật (0 kết quả grep "ChangeRequest" trong
// D:\bnwems-backend-api) — không còn route/controller/service/model nào tương ứng. Theo quyết định
// giữ UI + chuyển sang mock rõ ràng (xem docs/more-require.md mục mới nhất), service này gọi qua
// `api` (chặn bởi mockAdapter.ts như mọi service khác — DEMO_CHECKLIST.md Task 20, trước đây gọi
// riêng `fetch()` tới route handler Next.js `src/app/api/v1/change-requests/*` dùng
// `src/mocks/seed.ts`, là cơ chế mock thứ 3 độc lập, đã xóa). XÓA toàn bộ mock này ngay khi backend
// bổ sung lại API cho change-request.
export const changeRequestApiService = {
  async getChangeRequests(params?: GetChangeRequestsQuery) {
    const response = await api.get('/change-requests', { params });
    return response.data as { success: boolean; data: ChangeRequest[]; meta: { totalCount: number } };
  },

  async createChangeRequest(_orderId: string, _payload: CreateChangeRequestPayload) {
    throw new Error('Không có API tạo change-request — mục này chỉ dùng để mobile Leader Staff ghi nhận (ngoài phạm vi web).');
  },

  async approveChangeRequest(id: string, status: 'approved' | 'rejected') {
    const response = await api.put(`/change-requests/${id}/approve`, { status });
    return response.data;
  },
};
