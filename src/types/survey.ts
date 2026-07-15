// docs/api/10-survey-assignment.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06. Field thật
// khác hẳn (không còn workTaskId/evidences[]/surveyedBy) — SurveyReport giờ có đầy đủ thông tin
// khảo sát hiện trường (kích thước, lối vào, ràng buộc mặt bằng...) gắn trực tiếp vào Order.
// GET /survey-reports/:id có include `evidence` (1 file duy nhất) nhưng KHÔNG join reporter/
// confirmer — không có tên người khảo sát trong response dù reportedBy/confirmedBy đã lưu thật.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model SurveyReport), operations.route.ts.

export type SurveyStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'SUBMITTED' | 'CONFIRMED';

export interface SurveyReport {
  surveyId: string;
  reportCode: string;
  orderId: string;
  planId?: string;
  evidenceId?: string;
  evidence?: { evidenceId: string; fileUrl: string };
  surveyDate: string;
  location: string;
  area?: number;
  length?: number;
  width?: number;
  entrance?: string;
  siteConstraints?: string;
  additionalRequests?: string;
  proposedItems?: string;
  notes?: string;
  status: SurveyStatus;
  reportedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/survey-reports
export interface CreateSurveyReportPayload {
  orderId: string;
  planId?: string;
  evidenceId?: string;
  surveyDate: string; // ISO datetime
  location: string;
  area?: number;
  length?: number;
  width?: number;
  entrance?: string;
  siteConstraints?: string;
  additionalRequests?: string;
  proposedItems?: string;
  notes?: string;
}

// PUT /api/v1/survey-reports/:id/confirm
export interface ConfirmSurveyReportPayload {
  status: SurveyStatus;
}
