// Mới hoàn toàn — trước đây chỉ là stub {id: number}. Chưa có UI dùng domain này.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model BusinessPolicy, enum PolicyType),
// policy.route.ts, policy.validator.ts.

export type PolicyType = 'DEPOSIT' | 'CANCELLATION' | 'COMPENSATION' | 'FEE' | 'WAGE';

export interface BusinessPolicy {
  policyId: string;
  policyCode: string;
  policyName: string;
  policyType: PolicyType;
  description?: string;
  policyValue: number;
  unit: string; // chuỗi tự do (vd "Ngày", "%", "VNĐ") — validator không ràng buộc enum
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetPoliciesQuery {
  policyType?: PolicyType;
  isActive?: boolean;
  /** Tìm theo policyCode/policyName (server-side) — xem docs/admin_chinhsach_api.md mục 6.4. */
  search?: string;
  page?: number;
  limit?: number;
}

// POST /api/v1/policies
export interface CreatePolicyPayload {
  policyCode: string;
  policyName: string;
  policyType: PolicyType;
  policyValue: number;
  unit: string;
  description?: string;
}

// PUT /api/v1/policies/:id — không sửa được policyCode/policyName/policyType sau khi tạo
export interface UpdatePolicyPayload {
  policyValue?: number;
  unit?: string;
  isActive?: boolean;
  description?: string;
}
