'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle2, Clock, DollarSign, MapPin, Package, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { AdminSurveyReport, SURVEY_REPORT_STATUS_META } from '@/mocks/db';

interface SurveyDetailDrawerProps {
  report: AdminSurveyReport;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function SurveyDetailDrawer({ report, onClose, onConfirm }: Readonly<SurveyDetailDrawerProps>) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const quoteTotal = report.quoteItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
              <Badge variant={SURVEY_REPORT_STATUS_META[report.status].variant}>{SURVEY_REPORT_STATUS_META[report.status].label}</Badge>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900">{report.id}</h3>
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
              <span className="mt-1 block font-mono font-bold text-slate-800">{report.orderId}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Khách hàng</span>
              <span className="mt-1 block font-semibold text-slate-800">{report.customerName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Sự kiện</span>
              <span className="mt-1 block font-semibold text-slate-800">{report.eventName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Ngày diễn ra sự kiện</span>
              <span className="mt-1 inline-flex items-center gap-1 font-bold text-blue-600">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(report.eventDate)}
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
            <div className="grid grid-cols-1 gap-2.5">
              {report.measurements.map((m) => (
                <div key={m.key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <span className="font-medium text-slate-500">{m.key}</span>
                  <span className="text-right font-bold text-slate-800">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Ghi nhận hiện trường</h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-600">
              <p className="mb-2 font-medium text-slate-800">Mô tả tổng quan:</p>
              {report.content}
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
                Đồ đạc / thiết bị đề xuất thuê ({report.rentalItems.length})
              </h4>
              {report.rentalItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-150 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2">Tên trang bị thuê</th>
                        <th className="px-3 py-2 text-center">SL</th>
                        <th className="px-3 py-2">Ghi chú vận hành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {report.rentalItems.map((item) => (
                        <tr key={item.name}>
                          <td className="px-3 py-2 font-semibold text-slate-900">{item.name}</td>
                          <td className="bg-blue-50/30 px-3 py-2 text-center font-bold text-blue-600">{item.quantity}</td>
                          <td className="px-3 py-2 italic text-slate-500">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center italic text-slate-400">
                  Chưa khai báo trang bị / đồ thuê kèm theo.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Danh sách thiết bị báo giá nháp ({report.quoteItems.length})
              </h4>
              {report.quoteItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-150 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2">Tên thiết bị báo giá nháp</th>
                        <th className="w-16 px-3 py-2 text-center">SL</th>
                        <th className="px-3 py-2 text-right">Đơn giá nháp</th>
                        <th className="px-3 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {report.quoteItems.map((item) => (
                        <tr key={item.name}>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {item.name}
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-500">{item.category}</span>
                          </td>
                          <td className="bg-emerald-50/30 px-3 py-2 text-center font-bold text-emerald-600">{item.quantity}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-600">{formatCurrency(item.price)}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-150 bg-emerald-50/10 font-bold text-slate-900">
                        <td colSpan={3} className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-500">
                          Tổng giá trị nháp:
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatCurrency(quoteTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center italic text-slate-400">
                  Chưa khai báo thiết bị báo giá nháp.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Minh chứng hình ảnh</h4>
            <div className="grid grid-cols-3 gap-2">
              {report.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh mock từ URL ngoài, không cần tối ưu qua next/image
                <img
                  key={src}
                  src={src}
                  alt="Ảnh hiện trường khảo sát"
                  onClick={() => setLightboxImage(src)}
                  className="h-24 w-full cursor-zoom-in rounded-lg border border-slate-100 object-cover transition-opacity hover:opacity-80"
                />
              ))}
            </div>
            <p className="text-[10px] italic text-slate-400">Nhấn vào ảnh để xem toàn màn hình.</p>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Khảo sát viên: <strong>{report.assignee}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Gửi lúc: <strong>{report.submittedTime}</strong>
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-150 bg-slate-50 p-5">
          <Button variant="secondary" onClick={onClose}>
            Đóng lại
          </Button>
          {report.status === 'PENDING_CONFIRM' && (
            <Button onClick={() => onConfirm(report.id)}>
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
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh mock từ URL ngoài */}
          <img src={lightboxImage} alt="Ảnh hiện trường khảo sát (phóng to)" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
