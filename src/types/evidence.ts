// Mới — chưa có module riêng dù nhiều domain khác (SchedulePlan/Attendance/SurveyReport/
// Settlement/Deposit) tham chiếu evidenceId. Nguồn: D:\bnwems-backend-api
// prisma/schema.prisma (model Evidence), evidence.route.ts.

export interface Evidence {
  evidenceId: string;
  fileUrl: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
}

// POST /api/v1/evidence/upload — multipart/form-data. `folder` chọn thư mục lưu trên Firebase
// Storage. referenceType/referenceId được controller nhận nhưng KHÔNG có cột lưu — bị bỏ qua.
export interface UploadEvidencePayload {
  file: File;
  folder?: string;
  description?: string;
}
