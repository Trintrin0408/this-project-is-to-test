// Mới hoàn toàn — trước đây chỉ là stub {id: number}. Chưa có UI dùng domain này.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model WageRecord, enum WageRole/WageStatus),
// wage.route.ts, wage.validator.ts.

export type WageRole = 'SETUP' | 'DECOR' | 'SOUND' | 'LEADER' | 'MC_SINGER';
export type WageStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID';

export interface WageRecord {
  wageId: string;
  wageCode: string;
  orderId: string;
  userId: string;
  wageRole: WageRole;
  shifts: number;
  wageRate: number;
  totalWage: number; // generated column = shifts * wageRate
  status: WageStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetWagesSummaryQuery {
  page?: number;
  limit?: number;
  period?: string;
  userId?: string;
  status?: WageStatus;
}

// POST /api/v1/wages/:id/confirm — validator chỉ chấp nhận chuỗi tự do, luôn gửi 'CONFIRMED'
export interface ConfirmWagePayload {
  status: 'CONFIRMED';
}
