'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle2, Clock, DollarSign, Loader2, MapPin, Package, User, X } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { evidenceApiService } from '@/services/evidence.service';
import { orderApiService } from '@/services/order.service';
import { quotationApiService } from '@/services/quotation.service';
import type { SurveyReport, SurveyStatus } from '@/types/survey';
import type { Evidence } from '@/types/evidence';
import type { QuotationDetailApi } from '@/types/quotation';

// Nối API thật theo docs/khaosathientruong_api.md mục 3 (2026-07-20, mọi quyết định đã chốt) —
// report giờ là shape thật (types/survey.ts) từ GET /survey-reports/:id, không phải mock
// AdminSurveyReport nữa. Khối "Danh sách thiết bị báo giá nháp" (2026-07-21, theo yêu cầu người dùng)
// đã đổi từ dữ liệu mock cứng sang đọc thật: `survey_reports` không có bảng lưu thiết bị báo giá riêng,
// nhưng dữ liệu này thật ra có sẵn ở báo giá (quotation) đã liên kết với đơn (`orders.quotationId` →
// `GET /quotations/:id`, đã có đủ items[] thật) — không cần Backend làm gì thêm. Khối "Chiều cao
// trần"/"Công suất điện" vẫn hoàn toàn thiếu dữ liệu thật (không có cột nào trong `survey_reports`) —
// giữ nguyên mock in nghiêng, xem docs/more-require.md mục (t).

const MOCK_CEILING_HEIGHT = '4.5 m';
const MOCK_POWER_CAPACITY = '3-phase, 63A';

const EXTRA_MOCK_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=280&fit=crop';

const SURVEY_STATUS_META: Record<SurveyStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: 'Bản nháp', variant: 'neutral' },
  NEEDS_REVIEW: { label: 'Chờ xác nhận', variant: 'warning' },
  SUBMITTED: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
};

interface SurveyDetailDrawerProps {
  report: SurveyReport;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

type QuotationLoadState = 'loading' | 'loaded' | 'no-quotation' | 'error';

export default function SurveyDetailDrawer({ report, onClose, onConfirm }: Readonly<SurveyDetailDrawerProps>) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [linkedQuotation, setLinkedQuotation] = useState<QuotationDetailApi | null>(null);
  const [quotationLoadState, setQuotationLoadState] = useState<QuotationLoadState>('loading');

  useEffect(() => {
    if (!report.evidenceId) {
      setEvidence(null);
      return;
    }
    evidenceApiService
      .getEvidenceById(report.evidenceId)
      .then((res) => setEvidence(res.data ?? null))
      .catch(() => setEvidence(null));
  }, [report.evidenceId]);

  // Khối "Danh sách thiết bị báo giá nháp" đọc từ báo giá thật liên kết với đơn của báo cáo khảo sát
  // này — survey_reports không có cột lưu thiết bị, phải đi qua orders.quotationId → GET /quotations/:id.
  useEffect(() => {
    let cancelled = false;
    setQuotationLoadState('loading');
    setLinkedQuotation(null);
    orderApiService
      .getOrder(report.orderId)
      .then((orderRes) => {
        const quotationId = orderRes.data?.quotationId;
        if (!quotationId) {
          if (!cancelled) setQuotationLoadState('no-quotation');
          return;
        }
        return quotationApiService.getQuotation(quotationId).then((quoRes) => {
          if (cancelled) return;
          setLinkedQuotation(quoRes.data);
          setQuotationLoadState('loaded');
        });
      })
      .catch(() => {
        if (!cancelled) setQuotationLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [report.orderId]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col justify-between border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chi tiết báo cáo khảo sát</span>
              <Badge variant={SURVEY_STATUS_META[report.status].variant}>{SURVEY_STATUS_META[report.status].label}</Badge>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900">{report.reportCode}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-200/50 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-150 bg-slate-50/60 p-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Mã đơn đặt</span>
              <span className="mt-1 block font-mono font-bold text-slate-800">{report.orderCode}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Khách hàng</span>
              <span className="mt-1 block font-semibold text-slate-800">{report.customerName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Sự kiện</span>
              <span className="mt-1 block font-semibold text-slate-800">{report.eventName || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Ngày khảo sát</span>
              <span className="mt-1 inline-flex items-center gap-1 font-bold text-blue-600">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(report.surveyDate)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Địa điểm hiện trường</span>
              <span className="mt-1 inline-flex items-center gap-1 font-medium text-slate-800">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {report.location}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Thông tin đo đạc</h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Diện tích</span>
                <span className="mt-0.5 block font-bold text-slate-800">{report.area != null ? `${report.area} m²` : 'Chưa có'}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Chiều dài</span>
                <span className="mt-0.5 block font-bold text-slate-800">{report.length != null ? `${report.length} m` : 'Chưa có'}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Chiều rộng</span>
                <span className="mt-0.5 block font-bold text-slate-800">{report.width != null ? `${report.width} m` : 'Chưa có'}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Lối vận chuyển đồ</span>
                <span className="mt-0.5 block font-bold text-slate-800">{report.entrance || 'Chưa có'}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Chiều cao trần</span>
                <span className="mt-0.5 block font-bold italic text-slate-500">{MOCK_CEILING_HEIGHT}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                <span className="block font-medium text-slate-500">Công suất nguồn điện</span>
                <span className="mt-0.5 block font-bold italic text-slate-500">{MOCK_POWER_CAPACITY}</span>
              </div>
            </div>
            <p className="text-[10px] italic text-slate-400">
              2 chỉ số "Chiều cao trần"/"Công suất nguồn điện" là dữ liệu fix cứng — backend chưa có cột lưu (xem docs/more-require.md mục (t)).
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Ghi nhận hiện trường</h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-600">
              <p className="mb-2 font-medium text-slate-800">Ràng buộc / hiện trạng mặt bằng:</p>
              {report.siteConstraints || 'Chưa ghi nhận.'}
            </div>
            {report.notes && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 text-xs text-slate-600">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Lưu ý thi công quan trọng:
                </p>
                {report.notes}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <Package className="h-4 w-4 text-blue-600" />
                Đồ đạc / thiết bị đề xuất thuê
              </h4>
              <div className="rounded-xl border border-slate-150 bg-white p-3.5 text-xs leading-relaxed text-slate-700 shadow-xs">
                {report.proposedItems || (
                  <span className="italic text-slate-400">Chưa khai báo trang bị / đồ thuê kèm theo.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Danh sách thiết bị báo giá {linkedQuotation ? `(${linkedQuotation.quotationCode})` : ''}
              </h4>

              {quotationLoadState === 'loading' && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-150 bg-white p-4 text-xs text-slate-400 shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tải báo giá liên kết...
                </div>
              )}

              {quotationLoadState === 'no-quotation' && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center text-xs italic text-slate-400">
                  Đơn này chưa liên kết báo giá nào (`orders.quotationId` trống).
                </div>
              )}

              {quotationLoadState === 'error' && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center text-xs text-rose-500">
                  Không tải được báo giá liên kết. Vui lòng thử lại.
                </div>
              )}

              {quotationLoadState === 'loaded' && linkedQuotation && (
                <>
                  <div className="overflow-hidden rounded-xl border border-slate-150 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px] border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-3 py-2">Tên thiết bị</th>
                            <th className="w-16 px-3 py-2 text-center">SL</th>
                            <th className="px-3 py-2 text-right">Đơn giá</th>
                            <th className="px-3 py-2 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {linkedQuotation.items.map((item) => (
                            <tr key={item.quotationItemId}>
                              <td className="px-3 py-2 font-semibold text-slate-700">
                                {item.itemName}
                                <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-500">{item.categoryName}</span>
                              </td>
                              <td className="bg-emerald-50/30 px-3 py-2 text-center font-bold text-emerald-600">{item.quantity}</td>
                              <td className="px-3 py-2 text-right font-medium text-slate-500">{formatCurrency(item.price)}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-700">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                          {linkedQuotation.items.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-4 text-center italic text-slate-400">
                                Báo giá chưa có hạng mục nào.
                              </td>
                            </tr>
                          )}
                          <tr className="border-t border-slate-150 bg-emerald-50/10 font-bold text-slate-700">
                            <td colSpan={3} className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-500">
                              Tổng giá trị báo giá:
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-600">{formatCurrency(linkedQuotation.totalAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-[10px] italic text-slate-400">
                    Dữ liệu thật lấy từ báo giá {linkedQuotation.quotationCode} liên kết với đơn này (`orders.quotationId` → `GET /quotations/:id`).
                  </p>
                </>
              )}
            </div>
          </div>

          {report.additionalRequests && (
            <div className="space-y-3">
              <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Yêu cầu bổ sung</h4>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-600">
                {report.additionalRequests}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Minh chứng hình ảnh</h4>
            <div className="grid grid-cols-3 gap-2">
              {evidence?.fileUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh thật từ Firebase Storage, không cần tối ưu qua next/image
                <img
                  src={evidence.fileUrl}
                  alt="Ảnh hiện trường khảo sát (thật)"
                  onClick={() => setLightboxImage(evidence.fileUrl)}
                  className="h-24 w-full cursor-zoom-in rounded-lg border border-slate-100 object-cover transition-opacity hover:opacity-80"
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh minh họa, không phải dữ liệu thật */}
              <img
                src={EXTRA_MOCK_IMAGE}
                alt="Ảnh minh họa hiện trường (dữ liệu mẫu)"
                onClick={() => setLightboxImage(EXTRA_MOCK_IMAGE)}
                className="h-24 w-full cursor-zoom-in rounded-lg border border-dashed border-slate-200 object-cover opacity-70 transition-opacity hover:opacity-100"
              />
            </div>
            {!evidence?.fileUrl && (
              <p className="text-[10px] italic text-slate-400">Chưa có ảnh minh chứng thật (evidence_id chưa gắn hoặc chưa tải được).</p>
            )}
            <p className="text-[10px] italic text-slate-400">
              Ảnh có viền nét đứt là ảnh minh họa (dữ liệu mẫu) — `survey_reports.evidence_id` chỉ lưu được 1 ảnh thật/báo cáo, xem docs/more-require.md mục (t).
            </p>
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Khảo sát viên: <strong>{report.reportedByName || '—'}</strong>
            </span>
            {report.confirmedByName && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Đã xác nhận bởi: <strong>{report.confirmedByName}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-150 bg-slate-50 p-5">
          <Button variant="secondary" onClick={onClose}>
            Đóng lại
          </Button>
          {(report.status === 'NEEDS_REVIEW' || report.status === 'SUBMITTED') && (
            <Button onClick={() => onConfirm(report.surveyId)}>
              <CheckCircle2 className="h-4 w-4" />
              Xác nhận báo cáo khảo sát
            </Button>
          )}
        </div>
      </motion.div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-8"
          onClick={() => setLightboxImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh mock/thật từ URL ngoài */}
          <img src={lightboxImage} alt="Ảnh hiện trường khảo sát (phóng to)" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
